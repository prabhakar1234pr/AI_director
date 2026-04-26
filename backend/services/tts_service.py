"""Google Cloud Text-to-Speech — Chirp 3: HD voices.

Auth piggybacks on the same service-account credentials we already use for
Gemini (`GOOGLE_APPLICATION_CREDENTIALS`). Chirp 3 HD does not support SSML
or pitch/rate parameters, so we send plain text + voice name + MP3 encoding.
"""

from __future__ import annotations

import asyncio
import os
from typing import Iterable

import httpx

from models.schemas import Shot, VoiceAssignment, VoiceProfile
from services.gemini_service import _get_access_token  # type: ignore


CLOUD_TTS_URL = "https://texttospeech.googleapis.com/v1/text:synthesize"
DEFAULT_LANGUAGE = "en-US"


# Curated Chirp 3 HD roster. Gemini sees this exact list and may only pick
# from these IDs. Keep it small and varied so casting is fast and consistent.
CHIRP3_HD_ROSTER: list[VoiceProfile] = [
    VoiceProfile(
        id="Charon",
        gender="male",
        description="Deep, gravelly narrator. Noir, dramatic, authoritative.",
    ),
    VoiceProfile(
        id="Orus",
        gender="male",
        description="Classic warm male narrator. Documentary, reflective.",
    ),
    VoiceProfile(
        id="Algieba",
        gender="male",
        description="Rough, intense, action-leaning male voice.",
    ),
    VoiceProfile(
        id="Puck",
        gender="male",
        description="Playful, youthful, energetic male voice.",
    ),
    VoiceProfile(
        id="Achird",
        gender="male",
        description="Warm, friendly male, conversational.",
    ),
    VoiceProfile(
        id="Aoede",
        gender="female",
        description="Gentle, calm female narrator. Intimate, reflective.",
    ),
    VoiceProfile(
        id="Erinome",
        gender="female",
        description="Bright, upbeat, modern female voice.",
    ),
    VoiceProfile(
        id="Pulcherrima",
        gender="female",
        description="Dramatic, theatrical female voice. Strong emotion.",
    ),
    VoiceProfile(
        id="Callirrhoe",
        gender="female",
        description="Soft, soothing female narrator.",
    ),
    VoiceProfile(
        id="Kore",
        gender="female",
        description="Sharp, clear, professional female voice.",
    ),
]

VOICE_IDS: set[str] = {v.id for v in CHIRP3_HD_ROSTER}
DEFAULT_NARRATOR_ID = "Charon"


def _voice_name(voice_id: str, language: str = DEFAULT_LANGUAGE) -> str:
    """`Charon` → `en-US-Chirp3-HD-Charon`."""
    return f"{language}-Chirp3-HD-{voice_id}"


def get_roster() -> list[VoiceProfile]:
    return list(CHIRP3_HD_ROSTER)


async def synthesize(text: str, voice_id: str, language: str = DEFAULT_LANGUAGE) -> str:
    """Synthesize one chunk. Returns base64-encoded MP3 (string)."""
    if voice_id not in VOICE_IDS:
        voice_id = DEFAULT_NARRATOR_ID

    access_token = await _get_access_token()
    payload = {
        "input": {"text": text},
        "voice": {
            "languageCode": language,
            "name": _voice_name(voice_id, language),
        },
        "audioConfig": {"audioEncoding": "MP3"},
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            CLOUD_TTS_URL,
            headers={"Authorization": f"Bearer {access_token}"},
            json=payload,
        )
        resp.raise_for_status()
        data = resp.json()

    audio_b64 = data.get("audioContent")
    if not audio_b64:
        raise ValueError(f"Cloud TTS returned no audioContent: {data!r}")
    return audio_b64


async def synthesize_for_shots(
    shots: Iterable[Shot],
    assignments: list[VoiceAssignment],
    concurrency: int = 4,
) -> list[str]:
    """Run synthesis for each shot in parallel, capped at `concurrency`."""
    shots_list = list(shots)
    if len(assignments) != len(shots_list):
        raise ValueError(
            f"assignments length ({len(assignments)}) does not match shots ({len(shots_list)})"
        )

    semaphore = asyncio.Semaphore(concurrency)

    async def _one(text: str, voice_id: str) -> str:
        async with semaphore:
            return await synthesize(text, voice_id)

    tasks = [_one(s.audio, a.voice_id) for s, a in zip(shots_list, assignments)]
    return await asyncio.gather(*tasks)


def fallback_assignments(shots: list[Shot]) -> list[VoiceAssignment]:
    """When Gemini casting fails, pick reasonable defaults so audio still works."""
    return [
        VoiceAssignment(
            voice_id=DEFAULT_NARRATOR_ID,
            speaker="narrator" if s.type != "dialogue" else "CHARACTER",
            reason="fallback (casting unavailable)",
        )
        for s in shots
    ]
