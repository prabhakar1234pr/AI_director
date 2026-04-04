import os
import httpx
from storage.gcs import upload_bytes

MINIMAX_API_KEY = os.getenv("MINIMAX_API_KEY", "")
MINIMAX_IMAGE_URL = "https://api.minimax.io/v1/image_generation"


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
        "number_of_images": 1,
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

    image_url = data["data"][0]["url"]

    # Download the image and upload to GCS
    async with httpx.AsyncClient(timeout=60) as client:
        img_resp = await client.get(image_url)
        img_resp.raise_for_status()
        image_bytes = img_resp.content

    gcs_path = f"{project_id}/{shot_idx}/image.jpg"
    signed_url = upload_bytes(gcs_path, image_bytes, "image/jpeg")
    return signed_url
