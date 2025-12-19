from typing import List, Optional

from pydantic import BaseModel


class Message(BaseModel):
    role: str  # "user" or "model" (or "assistant")
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Message]] = []

class ChatResponse(BaseModel):
    answer: str
