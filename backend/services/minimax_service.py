import os
import json
import re
import asyncio
import httpx
from models.schemas import Shot, GenerateScriptResponse

MINIMAX_API_BASE = "https://api.minimax.io/v1"
CHAT_MODEL = "MiniMax-M2"

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
    """Extract first JSON object from model response, even if surrounded by prose."""
    text = text.strip()
    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # Find first {...} block
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    raise ValueError(f"No valid JSON found in model response: {text[:200]}")


async def generate_script(messages: list[dict], style: str | None) -> GenerateScriptResponse:
    api_key = os.getenv("MINIMAX_API_KEY")
    if not api_key:
        raise ValueError("MINIMAX_API_KEY not set")

    system = DIRECTOR_SYSTEM_PROMPT
    if style:
        system += f"\n\nThe user has specified a visual style: {style}. Apply this consistently to all shots."

    minimax_messages = [
        {"role": "system", "name": "System", "content": system},
        *[{"role": m["role"], "name": "User" if m["role"] == "user" else "Assistant", "content": m["content"]}
          for m in messages]
    ]

    payload = {
        "model": CHAT_MODEL,
        "messages": minimax_messages,
        "stream": False,
        "temperature": 0.8,
        "max_tokens": 2000,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            f"{MINIMAX_API_BASE}/text/chatcompletion_v2",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        resp.raise_for_status()
        data = resp.json()

    content = data["choices"][0]["message"]["content"]
    parsed = _extract_json(content)

    if "question" in parsed:
        return GenerateScriptResponse(question=parsed["question"], ready=False)

    if "shots" in parsed:
        shots = [Shot(**s) for s in parsed["shots"]]
        return GenerateScriptResponse(shots=shots, ready=True)

    raise ValueError(f"Unexpected response shape: {list(parsed.keys())}")


async def generate_image_for_shot(visual: str, shot_label: str, style: str) -> str:
    """Returns base64-encoded PNG string for a single shot."""
    api_key = os.getenv("MINIMAX_API_KEY")
    if not api_key:
        raise ValueError("MINIMAX_API_KEY not set")

    prompt = (
        f"Cinematic storyboard frame. {shot_label}. {visual} "
        f"Visual style: {style}. Professional film still, dramatic composition, high quality."
    )[:2000]

    payload = {
        "model": "image-01",
        "prompt": prompt,
        "aspect_ratio": "16:9",
        "response_format": "base64",
        "number_of_images": 1,
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(
            f"{MINIMAX_API_BASE}/image_generation",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        resp.raise_for_status()
        data = resp.json()

    # Response shape: {"data": {"image_base64": ["<base64>", ...]}}
    return data["data"]["image_base64"][0]


async def generate_all_images(shots: list[Shot], style: str) -> list[str]:
    """Generate images for all shots concurrently."""
    tasks = [
        generate_image_for_shot(s.visual, s.shot, style)
        for s in shots
    ]
    return await asyncio.gather(*tasks)
