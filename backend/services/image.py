import base64
import os
from typing import Any

import httpx
from storage.gcs import upload_bytes

MINIMAX_API_KEY = os.getenv("MINIMAX_API_KEY", "")
MINIMAX_IMAGE_URL = "https://api.minimax.io/v1/image_generation"


def minimax_extract_image_download_target(data: dict[str, Any]) -> tuple[str | None, bytes | None]:
    """
    Parse MiniMax /v1/image_generation response.
    Current API: data.data.image_urls[] or data.data.image_base64[].
    Legacy: data.data[0].url
    Returns (url, None) to download, or (None, raw_bytes) for base64.
    """
    block = data.get("data")
    if not block:
        return None, None
    if isinstance(block, dict):
        urls = block.get("image_urls") or []
        if urls and isinstance(urls[0], str):
            return urls[0], None
        b64_list = block.get("image_base64") or []
        if b64_list and isinstance(b64_list[0], str):
            return None, base64.b64decode(b64_list[0])
        return None, None
    if isinstance(block, list) and block:
        first = block[0]
        if isinstance(first, dict) and first.get("url"):
            return first["url"], None
    return None, None


async def generate_image(
    shot: dict,
    style: str,
    project_id: str,
    shot_idx: int,
) -> str:
    """Generate a storyboard image for a shot and upload to GCS. Returns signed URL."""
    prompt = (
        f"Cinematic storyboard frame, {style}, {shot['visual']}, "
        "film photography, dramatic lighting, high contrast, no text, no watermark, "
        "professional cinematography"
    )
    payload = {
        "model": "image-01",
        "prompt": prompt,
        "aspect_ratio": "16:9",
        "n": 1,
        "response_format": "url",
        "prompt_optimizer": True,
    }

    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            MINIMAX_IMAGE_URL,
            headers={
                "Authorization": f"Bearer {MINIMAX_API_KEY}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        resp.raise_for_status()
        data = resp.json()

    base_resp = data.get("base_resp") or {}
    if base_resp.get("status_code") not in (None, 0):
        raise ValueError(
            f"MiniMax image API error {base_resp.get('status_code', '?')}: "
            f"{base_resp.get('status_msg', data)}"
        )

    image_url, raw_bytes = minimax_extract_image_download_target(data)
    if raw_bytes is not None:
        image_bytes = raw_bytes
    elif image_url:
        async with httpx.AsyncClient(timeout=60) as client:
            img_resp = await client.get(image_url)
            img_resp.raise_for_status()
            image_bytes = img_resp.content
    else:
        raise ValueError(
            f"MiniMax image API returned no image (image_urls / image_base64 empty): {data!r}"
        )

    gcs_path = f"{project_id}/{shot_idx}/image.jpg"
    signed_url = upload_bytes(gcs_path, image_bytes, "image/jpeg")
    return signed_url
