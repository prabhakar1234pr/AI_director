import json
import os
import re
import httpx
from .voices import get_prompt_context

MINIMAX_API_KEY = os.getenv("MINIMAX_API_KEY", "")
MINIMAX_GROUP_ID = os.getenv("MINIMAX_GROUP_ID", "")
MINIMAX_MODEL = "MiniMax-M2.5"
MINIMAX_URL = f"https://api.minimax.io/v1/text/chatcompletion_v2?GroupId={MINIMAX_GROUP_ID}"

_CLARIFY_SYSTEM = """You are a professional AI film director assistant.
When a user describes a scene, ask at most 2 short clarifying questions to understand:
1. The visual style (e.g. cinematic realism, anime, noir, cartoon, sci-fi)
2. The time of day or lighting mood (e.g. golden hour, night, overcast)

Keep questions brief and conversational. Do NOT generate a script yet."""

_GENERATE_SYSTEM = """You are a professional screenplay writer AI.
Given a scene description and style preferences, generate a storyboard script.

{voice_context}

Return ONLY a valid JSON array of 3-4 shots. No prose, no markdown fences, no explanation.
Each shot must have exactly these fields:
{{
  "shot": "Shot type (e.g. Wide shot, Close-up, Medium shot, Over the shoulder)",
  "visual": "Detailed visual description for image generation (1-2 sentences)",
  "audio": "The narration or dialogue text to be spoken",
  "type": "narration" or "dialogue",
  "voice_id": "The ElevenLabs voice_id best suited for this shot's audio",
  "voice_name": "The name of the chosen voice"
}}

Choose voice_id based on the character or narrator mood for each shot.
Keep visuals cinematic and descriptive. Keep audio natural and brief."""


async def chat(messages: list[dict], style: str | None = None) -> tuple[str, list | None]:
    """
    Send a chat turn to MiniMax.
    Returns (reply_text, script_or_none).
    If the reply is a valid JSON array of shots, parses it as the script.
    """
    # Determine phase based on whether style is known
    if style:
        voice_context = get_prompt_context()
        system_content = _GENERATE_SYSTEM.format(voice_context=voice_context)
    else:
        system_content = _CLARIFY_SYSTEM

    payload = {
        "model": MINIMAX_MODEL,
        "messages": [{"role": "system", "content": system_content}, *messages],
        "stream": False,
        "max_tokens": 2048,
        "temperature": 0.7,
    }

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            MINIMAX_URL,
            headers={
                "Authorization": f"Bearer {MINIMAX_API_KEY}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        resp.raise_for_status()
        data = resp.json()

    reply = data["choices"][0]["message"]["content"].strip()

    # Try to extract JSON array from the reply
    script = _try_parse_script(reply)
    return reply, script


def _try_parse_script(text: str) -> list | None:
    """Try to parse a JSON array from the LLM reply."""
    # Strip markdown code fences if present
    cleaned = re.sub(r"^```(?:json)?\s*", "", text.strip(), flags=re.MULTILINE)
    cleaned = re.sub(r"\s*```$", "", cleaned.strip(), flags=re.MULTILINE)
    cleaned = cleaned.strip()

    if not cleaned.startswith("["):
        return None
    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, list) and len(parsed) > 0:
            return parsed
    except json.JSONDecodeError:
        pass
    return None
