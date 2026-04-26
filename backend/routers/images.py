from fastapi import APIRouter, HTTPException
from models.schemas import GenerateImagesRequest, GenerateImagesResponse, ShotWithImage
from services.gemini_service import generate_all_images

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
