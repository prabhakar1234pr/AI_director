import asyncio
import json
import os
import re
from datetime import datetime, timedelta, timezone

import httpx
import google.auth
from google.auth.transport.requests import Request

from models.schemas import GenerateScriptResponse, Shot

DEFAULT_TEXT_MODEL = "gemini-2.5-flash"
DEFAULT_IMAGE_MODEL = "gemini-2.5-flash-image"
DEFAULT_LOCATION = "us-central1"
_token_cache: dict[str, datetime | str] = {}

DIRECTOR_SYSTEM_PROMPT = """You are a cinematic AI director and screenwriter. Turn natural language scene descriptions into professional storyboard scripts.

You may ask AT MOST 2 clarifying questions (style, time of day) — only if the information is critically missing and would significantly change the visuals. Never ask both at once.

When you have enough information, output ONLY raw JSON — no markdown fences, no explanation, nothing else — in exactly this format:
{"shots": [{"shot": "Wide shot", "visual": "rich cinematic description", "audio": "spoken narration or dialogue text", "type": "narration"}], "ready": true}

If you need ONE clarification, output ONLY:
{"question": "Your single question here (cinematic / anime / noir / documentary)?"}

Rules:
- Generate 3 to 4 shots maximum
- "shot": camera framing (Wide shot, Close-up, Medium shot, Over-the-shoulder, Aerial shot, etc.)
- "visual": 2-3 sentence cinematic description including lighting, mood, color palette — this is used for image generation
- "audio": 1-2 sentences of narration or dialogue spoken aloud (present tense, natural speech)
- "type": one of "narration", "dialogue", or "action"
- Keep descriptions vivid and cinematic"""


def _extract_json(text: str) -> dict:
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    raise ValueError(f"No valid JSON found in model response: {text[:200]}")


def _extract_text_response(data: dict) -> str:
    candidates = data.get("candidates") or []
    for candidate in candidates:
        parts = (candidate.get("content") or {}).get("parts") or []
        for part in parts:
            if isinstance(part, dict) and part.get("text"):
                return part["text"]
    raise ValueError(f"Gemini returned no text content. Response: {data!r}")


def _extract_inline_image_b64(data: dict) -> str | None:
    candidates = data.get("candidates") or []
    for candidate in candidates:
        parts = (candidate.get("content") or {}).get("parts") or []
        for part in parts:
            if not isinstance(part, dict):
                continue
            inline_data = part.get("inlineData") or part.get("inline_data") or {}
            if inline_data.get("data"):
                return inline_data["data"]
    return None


def _get_project_and_location() -> tuple[str, str]:
    project = os.getenv("GCP_PROJECT_ID") or os.getenv("GOOGLE_CLOUD_PROJECT")
    if not project:
        raise ValueError("GCP_PROJECT_ID (or GOOGLE_CLOUD_PROJECT) not set")
    location = os.getenv("GCP_LOCATION", DEFAULT_LOCATION)
    return project, location


def _token_is_valid() -> bool:
    token = _token_cache.get("token")
    expires_at = _token_cache.get("expires_at")
    return bool(token and isinstance(expires_at, datetime) and expires_at > datetime.now(timezone.utc))


def _fetch_access_token_sync() -> str:
    if _token_is_valid():
        return str(_token_cache["token"])

    credentials, _ = google.auth.default(scopes=["https://www.googleapis.com/auth/cloud-platform"])
    credentials.refresh(Request())
    if not credentials.token:
        raise ValueError("Failed to obtain Google access token from service account credentials")

    expiry = credentials.expiry or (datetime.now(timezone.utc) + timedelta(minutes=55))
    _token_cache["token"] = credentials.token
    _token_cache["expires_at"] = expiry - timedelta(minutes=2)
    return credentials.token


async def _get_access_token() -> str:
    return await asyncio.to_thread(_fetch_access_token_sync)


def _vertex_generate_url(project: str, location: str, model: str) -> str:
    return (
        f"https://{location}-aiplatform.googleapis.com/v1/"
        f"projects/{project}/locations/{location}/publishers/google/models/{model}:generateContent"
    )


async def generate_script(messages: list[dict], style: str | None) -> GenerateScriptResponse:
    project, location = _get_project_and_location()
    access_token = await _get_access_token()
    model = os.getenv("GEMINI_TEXT_MODEL", DEFAULT_TEXT_MODEL)
    system = DIRECTOR_SYSTEM_PROMPT
    if style:
        system += f"\n\nThe user has specified a visual style: {style}. Apply this consistently to all shots."

    contents = [
        {
            "role": "user" if m["role"] == "user" else "model",
            "parts": [{"text": m["content"]}],
        }
        for m in messages
    ]

    payload = {
        "system_instruction": {"parts": [{"text": system}]},
        "contents": contents,
        "generationConfig": {
            "temperature": 0.8,
            "maxOutputTokens": 2000,
            "responseMimeType": "application/json",
        },
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            _vertex_generate_url(project, location, model),
            headers={"Authorization": f"Bearer {access_token}"},
            json=payload,
        )
        resp.raise_for_status()
        data = resp.json()

    content = _extract_text_response(data)
    parsed = _extract_json(content)

    if "question" in parsed:
        return GenerateScriptResponse(question=parsed["question"], ready=False)

    if "shots" in parsed:
        shots = [Shot(**s) for s in parsed["shots"]]
        return GenerateScriptResponse(shots=shots, ready=True)

    raise ValueError(f"Unexpected response shape: {list(parsed.keys())}")


async def generate_image_for_shot(visual: str, shot_label: str, style: str) -> str:
    project, location = _get_project_and_location()
    access_token = await _get_access_token()
    model = os.getenv("GEMINI_IMAGE_MODEL", DEFAULT_IMAGE_MODEL)
    prompt = (
        f"Cinematic storyboard frame. {shot_label}. {visual} "
        f"Visual style: {style}. Professional film still, dramatic composition, high quality."
    )[:3000]

    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseModalities": ["IMAGE", "TEXT"],
            "temperature": 0.4,
        },
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(
            _vertex_generate_url(project, location, model),
            headers={"Authorization": f"Bearer {access_token}"},
            json=payload,
        )
        resp.raise_for_status()
        data = resp.json()

    image_b64 = _extract_inline_image_b64(data)
    if image_b64:
        return image_b64

    text = ""
    try:
        text = _extract_text_response(data)
    except ValueError:
        pass
    raise ValueError(f"Gemini returned no image data. {text[:200]}")


async def generate_all_images(shots: list[Shot], style: str) -> list[str]:
    tasks = [generate_image_for_shot(s.visual, s.shot, style) for s in shots]
    return await asyncio.gather(*tasks)
