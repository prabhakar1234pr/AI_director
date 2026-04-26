# Conversational AI Director

Turn natural language scene descriptions into cinematic storyboards with AI-generated visuals and voice narration.

## Stack

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Backend**: Python FastAPI
- **Script + Images**: Google Gemini (`gemini-2.0-flash` + `gemini-2.0-flash-preview-image-generation`)
- **Audio**: gTTS / browser speech synthesis

## Quick Start

### 1. Environment Setup

```bash
cp .env.example backend/.env
# Edit backend/.env with your real values
```

### 2. Backend

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

## Usage

1. Type a scene description in the chat (e.g. "A detective walks through rain-soaked neon streets at midnight")
2. Answer any clarifying questions (style, mood)
3. Review and edit the generated script JSON
4. Click **Generate Visuals** → AI storyboard images per shot
5. Click **Generate Audio** → narration per shot
6. Click **Play Scene** → synchronized slideshow playback

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ELEVENLABS_API_KEY` | ElevenLabs API key |
| `ELEVENLABS_VOICE_ID` | Voice ID (default: George — cinematic narrator) |
| `GCP_PROJECT_ID` | GCP project used for Vertex AI Gemini |
| `GCP_LOCATION` | Vertex AI region (e.g. `us-central1`) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Local path to service account JSON (Cloud Run uses attached service account) |
