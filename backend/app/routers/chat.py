from app.schemas import ChatRequest, ChatResponse, Document
from app.gemini_client import ask_gemini, answer_with_context
from app.retrieval import retrieve_context
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.database import get_session
from app.auth import get_current_user
from app.models.user import User
from app.models.chat import ChatMessageDB
import json

router = APIRouter()

@router.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(
    request: ChatRequest, 
    user: Optional[User] = Depends(get_current_user),
    session: Session = Depends(get_session)
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
        citations_json = "[]"
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
            citations_json = json.dumps([c.dict() for c in citations])

        # Persist if user is logged in
        if user:
            # Save User Message
            user_msg = ChatMessageDB(
                user_id=user.id,
                role="user",
                content=request.message
            )
            session.add(user_msg)
            
            # Save AI Response
            ai_msg = ChatMessageDB(
                user_id=user.id,
                role="model",
                content=answer_text,
                citations_json=citations_json
            )
            session.add(ai_msg)
            session.commit()

        return ChatResponse(answer=answer_text, citations=citations)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
