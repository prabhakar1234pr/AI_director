from fastapi import APIRouter, HTTPException
from models.schemas import GenerateScriptRequest, GenerateScriptResponse
from services.gemini_service import generate_script

router = APIRouter()


@router.post("/generate-script", response_model=GenerateScriptResponse)
async def generate_script_endpoint(body: GenerateScriptRequest):
    try:
        messages = [m.model_dump() for m in body.messages]
        return await generate_script(messages, body.style)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
