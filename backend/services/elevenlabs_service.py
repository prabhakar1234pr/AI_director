import os
import base64
import asyncio
from elevenlabs import ElevenLabs

DEFAULT_VOICE_ID = None  # resolved at call time from env


def _get_client() -> ElevenLabs:
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        raise ValueError("ELEVENLABS_API_KEY not set")
    return ElevenLabs(api_key=api_key)


def _generate_audio_sync(text: str) -> str:
    """Synchronous ElevenLabs call — returns base64-encoded MP3."""
    voice_id = os.getenv("ELEVENLABS_VOICE_ID", "JBFqnCBsd6RMkjVDRZzb")
    client = _get_client()

    audio_stream = client.text_to_speech.convert(
        voice_id=voice_id,
        text=text,
        model_id="eleven_multilingual_v2",
        output_format="mp3_44100_128",
    )
    audio_bytes = b"".join(chunk for chunk in audio_stream if isinstance(chunk, bytes))
    return base64.b64encode(audio_bytes).decode("utf-8")


async def generate_all_audio(shots) -> list[str]:
    """Generate audio for all shots, capped at 2 concurrent requests (ElevenLabs plan limit)."""
    loop = asyncio.get_event_loop()
    semaphore = asyncio.Semaphore(2)

    async def _guarded(text: str) -> str:
        async with semaphore:
            return await loop.run_in_executor(None, _generate_audio_sync, text)

    tasks = [_guarded(shot.audio) for shot in shots]
    return await asyncio.gather(*tasks)
