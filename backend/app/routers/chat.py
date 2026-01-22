from fastapi import APIRouter, HTTPException
from app.gemini_client import answer_with_context, ask_gemini
from app.retrieval import retrieve_context
from app.schemas import ChatRequest, ChatResponse, Document

router = APIRouter()

@router.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(
    request: ChatRequest,
):
    try:
        # RAG flow
        docs = retrieve_context(request.message)

        # Get answer from Gemini
        if docs:
            answer_text = answer_with_context(request.message, docs)
            sources = docs
        else:
            answer_text = ask_gemini(request.message)
            sources = []

        # Format citations
        citations = []
        if sources:
            citations = [
                Document(
                    id=doc.metadata.get("source", "unknown"),
                    title=doc.metadata.get("source", "Untitled"),
                    url=doc.metadata.get("source", "#"),
                    snippet=doc.page_content[:200] + "...",
                    source_type="file"
                ) for doc in sources
            ]

        return ChatResponse(answer=answer_text, citations=citations)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
