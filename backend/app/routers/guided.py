import json
import os
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database import get_session
from app.models.guided import GuidedSessionDB
from app.schemas import GuidedSession, GuidedStep, GuidedTask, WorkflowMetadata

router = APIRouter()

# Load workflows
WORKFLOWS_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "workflows")
WORKFLOWS = {}

def load_workflows():
    if not os.path.exists(WORKFLOWS_DIR):
        return
    for filename in os.listdir(WORKFLOWS_DIR):
        if filename.endswith(".json"):
            try:
                with open(os.path.join(WORKFLOWS_DIR, filename), "r", encoding="utf-8") as f:
                    workflow = json.load(f)
                    WORKFLOWS[workflow["id"]] = workflow
            except Exception as e:
                print(f"Error loading workflow {filename}: {e}")

load_workflows()

@router.get("/api/guided/workflows", response_model=List[WorkflowMetadata])
def list_workflows():
    return [
        WorkflowMetadata(id=wf["id"], title=wf["title"], description=wf.get("description", ""))
        for wf in WORKFLOWS.values()
    ]

@router.post("/api/guided/start", response_model=GuidedSession)
def start_session(
    workflow_id: str,
    db: Session = Depends(get_session)
):
    if workflow_id not in WORKFLOWS:
        raise HTTPException(status_code=404, detail="Workflow not found")

    workflow = WORKFLOWS[workflow_id]
    first_step_id = workflow["steps"][0]["id"]

    session_id = str(uuid.uuid4())

    db_session = GuidedSessionDB(
        id=session_id,
        workflow_id=workflow_id,
        current_step_id=first_step_id,
        answers_json="{}"
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)

    return GuidedSession(
        id=db_session.id,
        workflow_id=db_session.workflow_id,
        current_step_id=db_session.current_step_id,
        answers={},
        is_complete=False,
        tasks=[],
        warnings=[]
    )

@router.post("/api/guided/answer", response_model=GuidedSession)
def answer_question(
    session_id: str,
    answer: str,
    db: Session = Depends(get_session)
):
    db_session = db.get(GuidedSessionDB, session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    workflow = WORKFLOWS[db_session.workflow_id]
    answers = json.loads(db_session.answers_json)

    # Save answer
    if db_session.current_step_id:
        answers[db_session.current_step_id] = answer
        db_session.answers_json = json.dumps(answers)

        # Determine next step
        current_step = next((s for s in workflow["steps"] if s["id"] == db_session.current_step_id), None)
        if current_step:
            next_step_id = current_step.get("next")
            db_session.current_step_id = next_step_id

            if not next_step_id:
                db_session.is_complete = True
                _generate_tasks_and_warnings_db(db_session)

    db.add(db_session)
    db.commit()
    db.refresh(db_session)

    return _map_to_schema(db_session)

@router.get("/api/guided/session/{session_id}", response_model=GuidedSession)
def get_session_api(
    session_id: str,
    db: Session = Depends(get_session)
):
    db_session = db.get(GuidedSessionDB, session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    return _map_to_schema(db_session)

@router.get("/api/guided/history", response_model=List[GuidedSession])
def get_session_history(
    db: Session = Depends(get_session)
):
    statement = select(GuidedSessionDB)
    results = db.exec(statement).all()
    return [_map_to_schema(s) for s in results]

@router.get("/api/guided/step/{workflow_id}/{step_id}", response_model=GuidedStep)
def get_step(workflow_id: str, step_id: str):
    if workflow_id not in WORKFLOWS:
         raise HTTPException(status_code=404, detail="Workflow not found")

    workflow = WORKFLOWS[workflow_id]
    step = next((s for s in workflow["steps"] if s["id"] == step_id), None)

    if not step:
        raise HTTPException(status_code=404, detail="Step not found")

    return GuidedStep(**step)

def _map_to_schema(db_s: GuidedSessionDB) -> GuidedSession:
    tasks = [GuidedTask(**t) for t in json.loads(db_s.tasks_json)]
    warnings = json.loads(db_s.warnings_json)
    return GuidedSession(
        id=db_s.id,
        workflow_id=db_s.workflow_id,
        current_step_id=db_s.current_step_id,
        answers=json.loads(db_s.answers_json),
        is_complete=db_s.is_complete,
        tasks=tasks,
        warnings=warnings
    )

def _generate_tasks_and_warnings_db(session: GuidedSessionDB):
    """
    Simple rule-based analysis based on answers.
    Directly modifies the DB object.
    """
    answers = json.loads(session.answers_json)
    tasks = []
    warnings = []

    # Renewal Logic
    if session.workflow_id == "renewal":
        expiry = answers.get("expiry_date")
        if expiry:
             tasks.append({"id":"t1", "title":"Submit Application", "description":f"Submit before {expiry}"})
             warnings.append("Ensure your passport is valid during the processing time.")

    # Change Employer
    elif session.workflow_id == "change_employer":
        time_held = answers.get("permit_duration")
        if time_held == "Less than 24 months":
            warnings.append("Changing employer within the first 24 months requires a new application.")
            tasks.append({"id":"t2", "title":"Apply for New Permit", "description":"Submit application before starting new job."})
        else:
            tasks.append({"id":"t3", "title":"Check Sector", "description":"If strictly changing occupation, new permit needed. If same occupation, no new permit needed."})

    # Job Loss
    elif session.workflow_id == "job_loss":
        warnings.append("You have 3 months to find a new job from termination date.")
        tasks.append({"id":"t4", "title":"Register with Arbetsförmedlingen", "description":"Do this immediately on your first unemployed day."})

    # General fallback
    if not tasks:
        tasks.append({"id":"t_gen", "title":"Review Requirements", "description":"Check Migration Agency website."})

    session.tasks_json = json.dumps(tasks)
    session.warnings_json = json.dumps(warnings)
