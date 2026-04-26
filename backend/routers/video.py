"""Veo 3 video generation router.

POST /generate-videos — for each shot, kicks off a Veo 3 Fast image-to-video
prediction in parallel (capped concurrency), polls each operation, and returns
the videos as base64 MP4s. The whole call is synchronous from the client's
perspective and may take several minutes for a multi-shot scene.
"""

from fastapi import APIRouter, HTTPException

from models.schemas import (
    GenerateVideosRequest,
    GenerateVideosResponse,
    ShotWithVideo,
)
from services.veo_service import generate_videos_for_shots

router = APIRouter()


@router.post("/generate-videos", response_model=GenerateVideosResponse)
async def generate_videos_endpoint(body: GenerateVideosRequest):
    if not body.shots:
        raise HTTPException(status_code=400, detail="No shots provided")

    try:
        video_b64_list = await generate_videos_for_shots(
            body.shots,
            body.style,
            images_b64=body.images_b64,
        )
    except TimeoutError as e:
        raise HTTPException(status_code=504, detail=f"Veo timed out: {e}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Veo failed: {e}")

    shots_with_video = [
        ShotWithVideo(**shot.model_dump(), video_b64=b64)
        for shot, b64 in zip(body.shots, video_b64_list)
    ]
    return GenerateVideosResponse(shots=shots_with_video)
