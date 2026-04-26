from fastapi import APIRouter, HTTPException
from pydantic import ValidationError

from models.schemas import (
    AddShotAction,
    ChatRequest,
    ChatResponse,
    DeleteShotAction,
    EditShotAction,
    GenerateScriptAction,
    RegenerateImageAction,
    ReorderShotsAction,
    ReplyAction,
    SetStyleAction,
)
from services.gemini_service import chat_with_director

router = APIRouter()

_ACTION_TYPES = {
    "reply": ReplyAction,
    "generate_script": GenerateScriptAction,
    "edit_shot": EditShotAction,
    "regenerate_image": RegenerateImageAction,
    "add_shot": AddShotAction,
    "delete_shot": DeleteShotAction,
    "reorder_shots": ReorderShotsAction,
    "set_style": SetStyleAction,
}


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(body: ChatRequest):
    try:
        messages = [m.model_dump() for m in body.messages]
        raw = await chat_with_director(messages, body.context)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    action_type = raw.get("type")
    cls = _ACTION_TYPES.get(action_type)

    if cls is None:
        return ChatResponse(
            action=ReplyAction(
                reply=raw.get("reply") or "I had trouble understanding that. Try again?"
            )
        )

    try:
        action = cls(**raw)
    except ValidationError:
        return ChatResponse(
            action=ReplyAction(
                reply=raw.get("reply")
                or "I tried to take an action but the result was malformed. Try rephrasing?"
            )
        )

    return ChatResponse(action=action)
