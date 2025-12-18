from fastapi import APIRouter
from app.models import ChatRequest, ChatResponse
from app.gemini_client import ask_gemini, answer_with_context
from app.retrieval import retrieve_context

router = APIRouter()

@router.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    # RAG flow
    docs = retrieve_context(request.message)
    
    if docs:
        answer = answer_with_context(request.message, docs)
        return ChatResponse(answer=answer, citations=docs)
    else:
        # Fallback to pure generation if no docs found (or handle differently)
        answer = ask_gemini(request.message)
        return ChatResponse(answer=answer, citations=[])
