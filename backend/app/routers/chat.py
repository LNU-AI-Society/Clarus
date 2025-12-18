from fastapi import APIRouter
from app.models import ChatRequest, ChatResponse
from app.gemini_client import ask_gemini

router = APIRouter()

@router.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    answer = ask_gemini(request.message)
    return ChatResponse(answer=answer)
