import os
import httpx
from storage.gcs import upload_bytes

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1/text-to-speech"
DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"  # Rachel — fallback


async def generate_audio(
    shot: dict,
    project_id: str,
    shot_idx: int,
) -> str:
    """Generate TTS audio for a shot using the LLM-assigned voice. Returns signed URL."""
    voice_id = shot.get("voice_id") or DEFAULT_VOICE_ID
    text = shot.get("audio", "")

    payload = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75,
            "style": 0.0,
            "use_speaker_boost": True,
        },
    }

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            f"{ELEVENLABS_BASE_URL}/{voice_id}",
            headers={
                "xi-api-key": ELEVENLABS_API_KEY,
                "Content-Type": "application/json",
                "Accept": "audio/mpeg",
            },
            json=payload,
        )
        if resp.status_code == 422 or resp.status_code == 400:
            # Voice ID might be invalid, retry with default
            resp = await client.post(
                f"{ELEVENLABS_BASE_URL}/{DEFAULT_VOICE_ID}",
                headers={
                    "xi-api-key": ELEVENLABS_API_KEY,
                    "Content-Type": "application/json",
                    "Accept": "audio/mpeg",
                },
                json=payload,
            )
        resp.raise_for_status()
        audio_bytes = resp.content

    gcs_path = f"{project_id}/{shot_idx}/audio.mp3"
    signed_url = upload_bytes(gcs_path, audio_bytes, "audio/mpeg")
    return signed_url
