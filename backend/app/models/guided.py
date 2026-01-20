from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


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


class GuidedAnswerDB(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: str = Field(foreign_key="guidedsessiondb.id")
    answer_data_json: str = "{}"  # JSON string containing step_id, question_id, answer, metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
