from fastapi import APIRouter, HTTPException
from typing import List, Optional, Dict
from app.schemas import WorkflowMetadata, GuidedSession, GuidedStep, GuidedTask
import json
import uuid
import os

router = APIRouter()

# In-memory session store (replace with DB later)
SESSIONS: Dict[str, GuidedSession] = {}

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
def start_session(workflow_id: str):
    if workflow_id not in WORKFLOWS:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    workflow = WORKFLOWS[workflow_id]
    first_step_id = workflow["steps"][0]["id"]
    
    session_id = str(uuid.uuid4())
    session = GuidedSession(
        id=session_id,
        workflow_id=workflow_id,
        current_step_id=first_step_id,
        answers={},
        is_complete=False
    )
    SESSIONS[session_id] = session
    return session

@router.post("/api/guided/answer", response_model=GuidedSession)
def answer_question(session_id: str, answer: str):
    if session_id not in SESSIONS:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = SESSIONS[session_id]
    workflow = WORKFLOWS[session.workflow_id]
    
    # Save answer
    if session.current_step_id:
        session.answers[session.current_step_id] = answer
        
        # Determine next step
        current_step = next((s for s in workflow["steps"] if s["id"] == session.current_step_id), None)
        if current_step:
            next_step_id = current_step.get("next")
            
            # Simple branching logic if "next" is missing or logic needed
            # For now, we assume simple linear or explicit next, 
            # but if we wanted branching we'd check `options` etc.
            # (The JSONs I created use simple linear for now)
            
            session.current_step_id = next_step_id
            
            if not next_step_id:
                session.is_complete = True
                _generate_tasks_and_warnings(session)

    return session

@router.get("/api/guided/session/{session_id}", response_model=GuidedSession)
def get_session(session_id: str):
    if session_id not in SESSIONS:
        raise HTTPException(status_code=404, detail="Session not found")
    return SESSIONS[session_id]

@router.get("/api/guided/step/{workflow_id}/{step_id}", response_model=GuidedStep)
def get_step(workflow_id: str, step_id: str):
    if workflow_id not in WORKFLOWS:
         raise HTTPException(status_code=404, detail="Workflow not found")
    
    workflow = WORKFLOWS[workflow_id]
    step = next((s for s in workflow["steps"] if s["id"] == step_id), None)
    
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")
        
    return GuidedStep(**step)


def _generate_tasks_and_warnings(session: GuidedSession):
    """
    Simple rule-based analysis based on answers.
    """
    # Renewal Logic
    if session.workflow_id == "renewal":
        expiry = session.answers.get("expiry_date")
        if expiry:
             session.tasks.append(GuidedTask(id="t1", title="Submit Application", description=f"Submit before {expiry}"))
             session.warnings.append("Ensure your passport is valid during the processing time.")
    
    # Change Employer
    elif session.workflow_id == "change_employer":
        time_held = session.answers.get("permit_duration")
        if time_held == "Less than 24 months":
            session.warnings.append("Changing employer within the first 24 months requires a new application.")
            session.tasks.append(GuidedTask(id="t2", title="Apply for New Permit", description="Submit application before starting new job."))
        else:
            session.tasks.append(GuidedTask(id="t3", title="Check Sector", description="If strictly changing occupation, new permit needed. If same occupation, no new permit needed."))

    # Job Loss
    elif session.workflow_id == "job_loss":
        session.warnings.append("You have 3 months to find a new job from termination date.")
        session.tasks.append(GuidedTask(id="t4", title="Register with Arbetsförmedlingen", description="Do this immediately on your first unemployed day."))

    # General fallback
    if not session.tasks:
        session.tasks.append(GuidedTask(id="t_gen", title="Review Requirements", description="Check Migration Agency website."))
