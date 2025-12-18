from fastapi import APIRouter
from app.models import ChatRequest, ChatResponse

router = APIRouter()

@router.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    # Placeholder logic for now
    return ChatResponse(answer=f"Echo: {request.message}")
