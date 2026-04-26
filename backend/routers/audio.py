"""Audio generation router.

Two endpoints:
- POST /cast-voices    → ask Gemini to assign a Chirp 3 HD voice to each shot
- POST /generate-audio → cast (if assignments not supplied) then synthesize

Both endpoints fall back to a deterministic narrator-only assignment if the
casting model fails for any reason, so audio generation never hard-fails on
casting alone.
"""

from fastapi import APIRouter, HTTPException

from models.schemas import (
    CastVoicesRequest,
    CastVoicesResponse,
    GenerateAudioRequest,
    GenerateAudioResponse,
    ShotWithAudio,
    VoiceAssignment,
)
from services.gemini_service import cast_voices
from services.tts_service import (
    VOICE_IDS,
    DEFAULT_NARRATOR_ID,
    fallback_assignments,
    get_roster,
    synthesize_for_shots,
)

router = APIRouter()


def _normalize_assignments(raw: list[dict], n_shots: int) -> list[VoiceAssignment]:
    """Coerce Gemini's raw output into validated VoiceAssignments of the right length."""
    out: list[VoiceAssignment] = []
    for i in range(n_shots):
        item = raw[i] if i < len(raw) else {}
        voice_id = item.get("voice_id") if isinstance(item, dict) else None
        if voice_id not in VOICE_IDS:
            voice_id = DEFAULT_NARRATOR_ID
        speaker = (item.get("speaker") if isinstance(item, dict) else None) or "narrator"
        out.append(
            VoiceAssignment(
                voice_id=voice_id,
                speaker=str(speaker),
                reason=item.get("reason") if isinstance(item, dict) else None,
            )
        )
    return out


@router.post("/cast-voices", response_model=CastVoicesResponse)
async def cast_voices_endpoint(body: CastVoicesRequest):
    if not body.shots:
        raise HTTPException(status_code=400, detail="No shots provided")
    roster = get_roster()
    try:
        raw = await cast_voices(body.shots, roster)
        assignments = _normalize_assignments(raw, len(body.shots))
    except Exception:
        assignments = fallback_assignments(body.shots)
    return CastVoicesResponse(assignments=assignments, roster=roster)


@router.post("/generate-audio", response_model=GenerateAudioResponse)
async def generate_audio_endpoint(body: GenerateAudioRequest):
    if not body.shots:
        raise HTTPException(status_code=400, detail="No shots provided")

    if body.assignments and len(body.assignments) == len(body.shots):
        assignments = body.assignments
    else:
        try:
            raw = await cast_voices(body.shots, get_roster())
            assignments = _normalize_assignments(raw, len(body.shots))
        except Exception:
            assignments = fallback_assignments(body.shots)

    try:
        audio_b64_list = await synthesize_for_shots(body.shots, assignments)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Cloud TTS failed: {e}")

    shots_with_audio = [
        ShotWithAudio(
            **shot.model_dump(),
            audio_b64=b64,
            voice_id=a.voice_id,
            speaker=a.speaker,
        )
        for shot, b64, a in zip(body.shots, audio_b64_list, assignments)
    ]
    return GenerateAudioResponse(shots=shots_with_audio, assignments=assignments)
