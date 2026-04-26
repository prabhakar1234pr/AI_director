from fastapi import APIRouter, HTTPException
from models.schemas import (
    GenerateImagesRequest,
    GenerateImagesResponse,
    RegenerateImageRequest,
    RegenerateImageResponse,
    ShotWithImage,
)
from services.gemini_service import generate_all_images, generate_image_for_shot

router = APIRouter()


@router.post("/generate-images", response_model=GenerateImagesResponse)
async def generate_images_endpoint(body: GenerateImagesRequest):
    try:
        b64_list = await generate_all_images(body.shots, body.style)
        shots_with_images = [
            ShotWithImage(**shot.model_dump(), image_b64=b64)
            for shot, b64 in zip(body.shots, b64_list)
        ]
        return GenerateImagesResponse(shots=shots_with_images)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/regenerate-image", response_model=RegenerateImageResponse)
async def regenerate_image_endpoint(body: RegenerateImageRequest):
    try:
        visual = body.shot.visual
        if body.instructions:
            visual = f"{visual} Additional direction: {body.instructions}"
        image_b64 = await generate_image_for_shot(visual, body.shot.shot, body.style)
        return RegenerateImageResponse(image_b64=image_b64)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
