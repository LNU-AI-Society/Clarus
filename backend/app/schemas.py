from typing import List, Optional

from pydantic import BaseModel


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

class GuidedStep(BaseModel):
    id: str
    title: str
    question: str
    type: str # 'text', 'date', 'radio', 'info'
    options: Optional[List[str]] = None
    next: Optional[str] = None # ID of next step, or None if end

class GuidedTask(BaseModel):
    id: str
    title: str
    description: str
    due_date: Optional[str] = None

class GuidedSession(BaseModel):
    id: str
    workflow_id: str
    current_step_id: Optional[str]
    answers: dict[str, str] = {}
    is_complete: bool = False
    tasks: List[GuidedTask] = []
    warnings: List[str] = []

class WorkflowMetadata(BaseModel):
    id: str
    title: str
    description: str
