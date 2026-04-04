from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routers import script, images, audio

load_dotenv()

app = FastAPI(title="AI Director API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(script.router, prefix="/api")
app.include_router(images.router, prefix="/api")
app.include_router(audio.router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok"}
