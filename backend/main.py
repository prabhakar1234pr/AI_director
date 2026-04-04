import asyncio
import os
from contextlib import asynccontextmanager

import firebase_admin
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

# Initialize Firebase Admin
_cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "./backend-service-account.json")
_firebase_cred = firebase_admin.credentials.Certificate(_cred_path)
firebase_admin.initialize_app(_firebase_cred)

from middleware.auth import verify_token
from services import voices as voice_service
from services import llm as llm_service
from services import image as image_service
from services import audio as audio_service
import storage.firestore as db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Fetch ElevenLabs voice list on startup
    await voice_service.fetch_voices()
    yield


app = FastAPI(title="AI Director API", version="0.2.0", lifespan=lifespan)

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://*.vercel.app",
    os.getenv("FRONTEND_URL", ""),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o for o in ALLOWED_ORIGINS if o],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Models ───────────────────────────────────────────────────────────────────

class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[Message]
    style: str | None = None
    project_id: str | None = None


class Shot(BaseModel):
    shot: str
    visual: str
    audio: str
    type: str
    voice_id: str | None = None
    voice_name: str | None = None
    image_url: str | None = None
    audio_url: str | None = None


class GenerateImagesRequest(BaseModel):
    shots: list[Shot]
    style: str
    project_id: str


class GenerateAudioRequest(BaseModel):
    shots: list[Shot]
    project_id: str


class RegenerateImageRequest(BaseModel):
    shot: Shot
    style: str
    project_id: str
    shot_idx: int


class SaveProjectRequest(BaseModel):
    project_id: str | None = None
    title: str
    style: str | None = None
    messages: list[Message]
    shots: list[Shot]
    stage: str


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "voices_loaded": len(voice_service.get_voices())}


@app.post("/api/chat")
async def chat(req: ChatRequest, uid: str = Depends(verify_token)):
    messages = [m.model_dump() for m in req.messages]
    try:
        reply, script = await llm_service.chat(messages, style=req.style)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM error: {str(e)}")

    return {
        "reply": reply,
        "script": script,
        "needs_clarification": script is None,
    }


@app.post("/api/generate-images")
async def generate_images(req: GenerateImagesRequest, uid: str = Depends(verify_token)):
    async def gen_one(idx: int, shot: Shot):
        try:
            url = await image_service.generate_image(
                shot.model_dump(), req.style, req.project_id, idx
            )
            return {**shot.model_dump(), "image_url": url}
        except Exception as e:
            return {**shot.model_dump(), "image_url": None, "image_error": str(e)}

    results = await asyncio.gather(*[gen_one(i, s) for i, s in enumerate(req.shots)])
    return {"shots": results}


@app.post("/api/generate-audio")
async def generate_audio(req: GenerateAudioRequest, uid: str = Depends(verify_token)):
    async def gen_one(idx: int, shot: Shot):
        try:
            url = await audio_service.generate_audio(
                shot.model_dump(), req.project_id, idx
            )
            return {**shot.model_dump(), "audio_url": url}
        except Exception as e:
            return {**shot.model_dump(), "audio_url": None, "audio_error": str(e)}

    results = await asyncio.gather(*[gen_one(i, s) for i, s in enumerate(req.shots)])
    return {"shots": results}


@app.post("/api/regenerate-image")
async def regenerate_image(req: RegenerateImageRequest, uid: str = Depends(verify_token)):
    try:
        url = await image_service.generate_image(
            req.shot.model_dump(), req.style, req.project_id, req.shot_idx
        )
        return {"image_url": url}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Image generation error: {str(e)}")


@app.get("/api/projects")
async def list_projects(uid: str = Depends(verify_token)):
    return {"projects": db.list_user_projects(uid)}


@app.get("/api/projects/{project_id}")
async def get_project(project_id: str, uid: str = Depends(verify_token)):
    project = db.get_project(project_id, uid)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@app.post("/api/projects")
async def save_project(req: SaveProjectRequest, uid: str = Depends(verify_token)):
    data = {
        "title": req.title,
        "style": req.style,
        "messages": [m.model_dump() for m in req.messages],
        "shots": [s.model_dump() for s in req.shots],
        "stage": req.stage,
    }
    if req.project_id:
        db.update_project(req.project_id, uid, data)
        return {"project_id": req.project_id}
    else:
        project_id = db.create_project(uid, data)
        return {"project_id": project_id}
