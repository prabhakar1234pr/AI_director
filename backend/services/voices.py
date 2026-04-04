import os
import httpx

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")

# Cached voice list (populated at startup)
_voices: list[dict] = []

# Fallback voices if the API call fails
_FALLBACK_VOICES = [
    {"voice_id": "21m00Tcm4TlvDq8ikWAM", "name": "Rachel", "description": "Calm, clear American female narrator"},
    {"voice_id": "pNInz6obpgDQGcFmaJgB", "name": "Adam", "description": "Deep American male, authoritative"},
    {"voice_id": "EXAVITQu4vr4xnSDxMaL", "name": "Bella", "description": "Warm, expressive American female"},
    {"voice_id": "ErXwobaYiN019PkySvjV", "name": "Antoni", "description": "Smooth British male, versatile"},
    {"voice_id": "VR6AewLTigWG4xSOukaG", "name": "Arnold", "description": "Strong, commanding male narrator"},
    {"voice_id": "MF3mGyEYCl7XYWbV9V6O", "name": "Elli", "description": "Young, energetic American female"},
    {"voice_id": "TxGEqnHWrfWFTfGW9XjX", "name": "Josh", "description": "Youthful American male, expressive"},
    {"voice_id": "yoZ06aMxZJJ28mfd3POQ", "name": "Sam", "description": "Raspy, intense male voice"},
]


async def fetch_voices() -> None:
    """Fetch available voices from ElevenLabs and cache them."""
    global _voices
    if not ELEVENLABS_API_KEY:
        _voices = _FALLBACK_VOICES
        return
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                "https://api.elevenlabs.io/v1/voices",
                headers={"xi-api-key": ELEVENLABS_API_KEY},
            )
            resp.raise_for_status()
            data = resp.json()
            raw = data.get("voices", [])
            _voices = [
                {
                    "voice_id": v["voice_id"],
                    "name": v["name"],
                    "description": (v.get("description") or "")[:100],
                    "labels": v.get("labels", {}),
                }
                for v in raw[:20]
            ]
    except Exception:
        _voices = _FALLBACK_VOICES


def get_voices() -> list[dict]:
    return _voices or _FALLBACK_VOICES


def get_prompt_context() -> str:
    """Return a formatted string listing voices for injection into the LLM prompt."""
    voices = get_voices()
    lines = ["Available ElevenLabs voices (use the voice_id exactly):"]
    for v in voices[:12]:
        labels = v.get("labels", {})
        gender = labels.get("gender", "")
        accent = labels.get("accent", "")
        use_case = labels.get("use case", labels.get("use_case", ""))
        desc = v.get("description") or f"{gender} {accent} {use_case}".strip()
        lines.append(f'  - voice_id: "{v["voice_id"]}" | name: {v["name"]} | {desc}')
    return "\n".join(lines)
