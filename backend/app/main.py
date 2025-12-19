from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import chat, documents, guided, auth
from app.database import create_db_and_tables

app = FastAPI(title="Clarus API", version="0.1.0")

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# CORS Configuration
origins = [
    "http://localhost:5173",  # Vite default
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(documents.router)
app.include_router(guided.router)

@app.get("/health")
async def health_check():
    return {"status": "ok", "app_name": "Clarus API"}


@app.get("/")
async def root():
    return {"message": "Welcome to Clarus API"}
