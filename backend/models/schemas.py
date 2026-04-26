from pydantic import BaseModel, Field
from typing import Literal, Optional, Union, Any


class Shot(BaseModel):
    shot: str
    visual: str
    audio: str
    type: Literal["narration", "dialogue", "action"] = "narration"


class ShotWithImage(Shot):
    image_b64: str


class ShotWithAudio(Shot):
    audio_b64: str  # base64-encoded mp3
    voice_id: str  # Chirp 3 HD voice (e.g. "Charon")
    speaker: str   # "narrator" or character name (e.g. "DETECTIVE")


class ShotWithVideo(Shot):
    video_b64: str  # base64-encoded MP4 (Veo 3 output, includes audio)


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


# ── Script generation ─────────────────────────────────────────────────────


class GenerateScriptRequest(BaseModel):
    messages: list[ChatMessage]
    style: Optional[str] = None


class GenerateScriptResponse(BaseModel):
    shots: Optional[list[Shot]] = None
    question: Optional[str] = None
    ready: bool = False


# ── Image generation ──────────────────────────────────────────────────────


class GenerateImagesRequest(BaseModel):
    shots: list[Shot]
    style: str = "cinematic, photorealistic, dramatic lighting"


class GenerateImagesResponse(BaseModel):
    shots: list[ShotWithImage]


class RegenerateImageRequest(BaseModel):
    shot: Shot
    style: str = "cinematic, photorealistic, dramatic lighting"
    instructions: Optional[str] = None  # optional user tweak appended to prompt


class RegenerateImageResponse(BaseModel):
    image_b64: str


# ── Audio generation ──────────────────────────────────────────────────────


class VoiceProfile(BaseModel):
    """One entry in the Chirp 3 HD voice roster Gemini casts from."""

    id: str          # voice short name, e.g. "Charon"
    gender: Literal["male", "female"]
    description: str  # short tag the casting model reads


class VoiceAssignment(BaseModel):
    """Per-shot voice pick (one entry per shot, in order)."""

    voice_id: str   # must be present in the roster
    speaker: str    # "narrator" or a character name in CAPS
    reason: Optional[str] = None  # optional Gemini explanation, for UI debug


class CastVoicesRequest(BaseModel):
    shots: list[Shot]


class CastVoicesResponse(BaseModel):
    assignments: list[VoiceAssignment]
    roster: list[VoiceProfile]


class GenerateAudioRequest(BaseModel):
    shots: list[Shot]
    # If provided, skip Gemini casting and use these directly. Length must
    # equal `shots`. If omitted, the server will cast voices first.
    assignments: Optional[list[VoiceAssignment]] = None


class GenerateAudioResponse(BaseModel):
    shots: list[ShotWithAudio]
    assignments: list[VoiceAssignment]


# ── Video generation (Veo 3 Fast, image-to-video) ─────────────────────────


class GenerateVideosRequest(BaseModel):
    shots: list[Shot]
    style: str = "cinematic, photorealistic, dramatic lighting"
    # One image per shot (base64 jpeg). Missing entries fall back to text-to-video.
    images_b64: Optional[list[Optional[str]]] = None


class GenerateVideosResponse(BaseModel):
    shots: list[ShotWithVideo]


# ── Cursor-style chat ─────────────────────────────────────────────────────


PageId = Literal["script", "visuals", "storyboard", "narration", "video"]


class ChatContext(BaseModel):
    page: PageId
    shots: list[Shot] = Field(default_factory=list)
    style: Optional[str] = None
    has_images: bool = False
    has_audio: bool = False


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    context: ChatContext


class EditShotAction(BaseModel):
    type: Literal["edit_shot"] = "edit_shot"
    index: int
    patch: dict[str, Any]  # any subset of {shot, visual, audio, type}
    reply: str


class RegenerateImageAction(BaseModel):
    type: Literal["regenerate_image"] = "regenerate_image"
    index: int
    instructions: Optional[str] = None
    reply: str


class AddShotAction(BaseModel):
    type: Literal["add_shot"] = "add_shot"
    after_index: int  # -1 = beginning
    shot: Shot
    reply: str


class DeleteShotAction(BaseModel):
    type: Literal["delete_shot"] = "delete_shot"
    index: int
    reply: str


class ReorderShotsAction(BaseModel):
    type: Literal["reorder_shots"] = "reorder_shots"
    order: list[int]  # new permutation of indices
    reply: str


class SetStyleAction(BaseModel):
    type: Literal["set_style"] = "set_style"
    style: str
    reply: str


class GenerateScriptAction(BaseModel):
    """Trigger fresh script generation from the conversation so far."""

    type: Literal["generate_script"] = "generate_script"
    reply: str


class ReplyAction(BaseModel):
    type: Literal["reply"] = "reply"
    reply: str


ChatAction = Union[
    EditShotAction,
    RegenerateImageAction,
    AddShotAction,
    DeleteShotAction,
    ReorderShotsAction,
    SetStyleAction,
    GenerateScriptAction,
    ReplyAction,
]


class ChatResponse(BaseModel):
    action: ChatAction
