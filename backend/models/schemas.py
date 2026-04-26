from pydantic import BaseModel
from typing import Literal, Optional


class Shot(BaseModel):
    shot: str
    visual: str
    audio: str
    type: Literal["narration", "dialogue", "action"] = "narration"


class ShotWithImage(Shot):
    image_b64: str  # base64 image from gemini


class ShotWithAudio(Shot):
    audio_b64: str  # base64 MP3 from gTTS


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class GenerateScriptRequest(BaseModel):
    messages: list[ChatMessage]
    style: Optional[str] = None


class GenerateScriptResponse(BaseModel):
    shots: Optional[list[Shot]] = None
    question: Optional[str] = None
    ready: bool = False


class GenerateImagesRequest(BaseModel):
    shots: list[Shot]
    style: str = "cinematic, photorealistic, dramatic lighting"


class GenerateImagesResponse(BaseModel):
    shots: list[ShotWithImage]


class GenerateAudioRequest(BaseModel):
    shots: list[Shot]


class GenerateAudioResponse(BaseModel):
    shots: list[ShotWithAudio]
