"""Google Vertex AI Veo 3 Fast — image-to-video synthesis.

Per shot: submit a long-running prediction, poll until done, return the MP4
as base64. Reuses the same auth + project/location helpers as gemini_service.

Veo 3 Fast generates 8s 720p clips with native audio. We feed the existing
storyboard image as the first frame so the video stays visually consistent
with the storyboard.
"""

from __future__ import annotations

import asyncio
import os
from typing import Optional

import httpx

from models.schemas import Shot
from services.gemini_service import (  # type: ignore
    _get_access_token,
    _get_project_and_location,
)

DEFAULT_VEO_MODEL = "veo-3.0-fast-generate-001"
DEFAULT_DURATION_SECONDS = 8
DEFAULT_ASPECT_RATIO = "16:9"
POLL_INTERVAL_SECONDS = 5
POLL_TIMEOUT_SECONDS = 300  # 5 min/shot ceiling


def _vertex_predict_url(project: str, location: str, model: str) -> str:
    return (
        f"https://{location}-aiplatform.googleapis.com/v1/"
        f"projects/{project}/locations/{location}/publishers/google/models/{model}:predictLongRunning"
    )


def _vertex_fetch_op_url(project: str, location: str, model: str) -> str:
    return (
        f"https://{location}-aiplatform.googleapis.com/v1/"
        f"projects/{project}/locations/{location}/publishers/google/models/{model}:fetchPredictOperation"
    )


def _build_prompt(shot: Shot, style: str) -> str:
    parts = [shot.shot.strip(), shot.visual.strip()]
    if shot.audio and shot.type != "narration":
        parts.append(f'Dialogue: "{shot.audio.strip()}"')
    if style:
        parts.append(f"Visual style: {style.strip()}.")
    parts.append("Cinematic motion, dramatic camera, professional film quality.")
    return " ".join(p for p in parts if p)[:2000]


def _extract_video_b64(response: dict) -> Optional[str]:
    """Veo's response shape varies. Try the common locations."""
    # Common: response.videos[0].bytesBase64Encoded
    videos = response.get("videos")
    if isinstance(videos, list) and videos:
        v = videos[0]
        if isinstance(v, dict):
            data = v.get("bytesBase64Encoded") or v.get("video")
            if isinstance(data, str):
                return data

    # Predictions wrapper: response.predictions[0].bytesBase64Encoded
    preds = response.get("predictions")
    if isinstance(preds, list) and preds:
        p = preds[0]
        if isinstance(p, dict):
            data = p.get("bytesBase64Encoded") or p.get("video")
            if isinstance(data, str):
                return data
            videos = p.get("videos")
            if isinstance(videos, list) and videos and isinstance(videos[0], dict):
                data = videos[0].get("bytesBase64Encoded")
                if isinstance(data, str):
                    return data
    return None


async def generate_video_for_shot(
    shot: Shot,
    style: str,
    image_b64: Optional[str] = None,
) -> str:
    """Submit one Veo 3 generation, poll until done, return base64 MP4."""
    project, location = _get_project_and_location()
    access_token = await _get_access_token()
    model = os.getenv("VEO_MODEL", DEFAULT_VEO_MODEL)

    instance: dict = {"prompt": _build_prompt(shot, style)}
    if image_b64:
        instance["image"] = {
            "bytesBase64Encoded": image_b64,
            "mimeType": "image/jpeg",
        }

    payload = {
        "instances": [instance],
        "parameters": {
            "aspectRatio": DEFAULT_ASPECT_RATIO,
            "durationSeconds": DEFAULT_DURATION_SECONDS,
            "sampleCount": 1,
            "personGeneration": "allow_adult",
        },
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(
            _vertex_predict_url(project, location, model),
            headers={"Authorization": f"Bearer {access_token}"},
            json=payload,
        )
        resp.raise_for_status()
        op = resp.json()

    operation_name = op.get("name")
    if not operation_name:
        raise ValueError(f"Veo did not return an operation: {op!r}")

    fetch_url = _vertex_fetch_op_url(project, location, model)
    deadline = asyncio.get_event_loop().time() + POLL_TIMEOUT_SECONDS

    async with httpx.AsyncClient(timeout=60.0) as client:
        while True:
            if asyncio.get_event_loop().time() > deadline:
                raise TimeoutError(
                    f"Veo operation {operation_name} timed out after {POLL_TIMEOUT_SECONDS}s"
                )

            poll_resp = await client.post(
                fetch_url,
                headers={"Authorization": f"Bearer {access_token}"},
                json={"operationName": operation_name},
            )
            poll_resp.raise_for_status()
            data = poll_resp.json()

            if data.get("done"):
                if "error" in data:
                    raise ValueError(f"Veo operation failed: {data['error']}")
                response = data.get("response", {}) or {}
                video_b64 = _extract_video_b64(response)
                if not video_b64:
                    raise ValueError(f"Veo returned no video bytes: {response!r}")
                return video_b64

            await asyncio.sleep(POLL_INTERVAL_SECONDS)


async def generate_videos_for_shots(
    shots: list[Shot],
    style: str,
    images_b64: Optional[list[Optional[str]]] = None,
    concurrency: int = 2,
) -> list[str]:
    """Run video generation for each shot, capped at `concurrency` parallel ops."""
    if images_b64 is None:
        images_b64 = [None] * len(shots)
    elif len(images_b64) < len(shots):
        images_b64 = list(images_b64) + [None] * (len(shots) - len(images_b64))

    semaphore = asyncio.Semaphore(concurrency)

    async def _one(shot: Shot, img: Optional[str]) -> str:
        async with semaphore:
            return await generate_video_for_shot(shot, style, img)

    tasks = [_one(s, img) for s, img in zip(shots, images_b64)]
    return await asyncio.gather(*tasks)
