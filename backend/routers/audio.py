from fastapi import APIRouter, HTTPException
from models.schemas import GenerateAudioRequest, GenerateAudioResponse, ShotWithAudio
from services.elevenlabs_service import generate_all_audio

router = APIRouter()


@router.post("/generate-audio", response_model=GenerateAudioResponse)
async def generate_audio_endpoint(body: GenerateAudioRequest):
    try:
        b64_list = await generate_all_audio(body.shots)
        shots_with_audio = [
            ShotWithAudio(**shot.model_dump(), audio_b64=b64)
            for shot, b64 in zip(body.shots, b64_list)
        ]
        return GenerateAudioResponse(shots=shots_with_audio)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
