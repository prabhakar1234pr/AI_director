# Conversational AI Director

Turn natural language scene descriptions into cinematic storyboards with AI-generated visuals and voice narration.

## Stack

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Backend**: Python FastAPI
- **Script + Images**: MiniMax AI (`M2-her` + `image-01`)
- **Audio**: ElevenLabs TTS

## Quick Start

### 1. API Keys

```bash
cp .env.example backend/.env
# Edit backend/.env with your real API keys
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
5. Click **Generate Audio** → ElevenLabs narration per shot
6. Click **Play Scene** → synchronized slideshow playback

## Environment Variables

| Variable | Description |
|----------|-------------|
| `MINIMAX_API_KEY` | MiniMax platform API key |
| `ELEVENLABS_API_KEY` | ElevenLabs API key |
| `ELEVENLABS_VOICE_ID` | Voice ID (default: George — cinematic narrator) |
