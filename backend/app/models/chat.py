from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import datetime

class ChatMessageDB(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    role: str
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    citations_json: Optional[str] = None # Store citations as JSON string for simplicity
