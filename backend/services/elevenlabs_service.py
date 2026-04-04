import base64
import asyncio
import io
from gtts import gTTS


def _generate_audio_sync(text: str) -> str:
    """Generate TTS audio using gTTS (no API key required). Returns base64 MP3."""
    tts = gTTS(text=text, lang="en", slow=False)
    buf = io.BytesIO()
    tts.write_to_fp(buf)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode("utf-8")


async def generate_all_audio(shots) -> list[str]:
    """Generate audio for all shots concurrently."""
    loop = asyncio.get_event_loop()
    semaphore = asyncio.Semaphore(3)

    async def _guarded(text: str) -> str:
        async with semaphore:
            return await loop.run_in_executor(None, _generate_audio_sync, text)

    tasks = [_guarded(shot.audio) for shot in shots]
    return await asyncio.gather(*tasks)
