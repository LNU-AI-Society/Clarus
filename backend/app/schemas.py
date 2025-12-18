from pydantic import BaseModel
from typing import List, Optional

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Message]] = []

class Document(BaseModel):
    id: str
    title: str
    url: str
    snippet: str
    source_type: str = "legislation"  # or "case_law", "government_guidance"

class AnalysisResult(BaseModel):
    summary: str
    key_points: List[str]
    risks: List[str]
    suggested_questions: List[str]

class ChatResponse(BaseModel):
    answer: str
    citations: List[Document] = []
