from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class ChatMessageDB(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    role: str
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    citations_json: Optional[str] = None # Store citations as JSON string for simplicity
