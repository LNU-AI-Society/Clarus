from typing import Optional, List
from sqlmodel import Field, SQLModel, JSON
from datetime import datetime

class GuidedSessionDB(SQLModel, table=True):
    id: str = Field(primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    workflow_id: str
    current_step_id: Optional[str]
    answers_json: str = "{}" # JSON string of answers
    is_complete: bool = False
    tasks_json: str = "[]" # JSON string of tasks
    warnings_json: str = "[]" # JSON string of warnings
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
