from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.routers import auth_router, users_router, detection_router
from app.ai.kilatis_orchestrator import get_orchestrator

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables on startup if not existing
    init_db()
    # Pre-load KILATIS dual-branch AI models into GPU/CPU memory
    orchestrator = get_orchestrator()
    orchestrator.load_all_models()
    yield

app = FastAPI(
    title="Kilatis API",
    description="Backend API for User Auth, Forensic Case Management & Dual-Branch Image Forensics (Splicing + AI/Deepfake)",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Next.js frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(detection_router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Kilatis Backend API is running with Neon PostgreSQL & KILATIS Dual-Branch Forensics"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
