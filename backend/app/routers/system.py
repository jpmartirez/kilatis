import asyncio

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from app.ai.orchestrator import get_orchestrator
from app.core.deps import get_current_investigator
from app.models.user import User

router = APIRouter(prefix="/api/system", tags=["System Readiness"])


def _readiness() -> dict:
    """Readiness facts only: no file paths, settings, or secrets."""
    orchestrator = get_orchestrator()
    return {
        "ready": orchestrator.fully_ready,
        "device": orchestrator.device,
        "models": orchestrator.models_loaded,
        "self_test": orchestrator.self_test,
        "load_seconds": orchestrator.load_seconds,
    }


@router.get("/health")
def health():
    """The API process is up and answering. Says nothing about the AI models."""
    return {"status": "ok"}


@router.get("/ready")
def ready():
    """200 only when all models are loaded and a test analysis has passed; otherwise 503."""
    body = _readiness()
    return JSONResponse(body, status_code=200 if body["ready"] else 503)


@router.post("/warmup")
async def warmup(_: User = Depends(get_current_investigator)):
    """Run the synthetic self-test through the full pipeline again (login required).

    Nothing is written to the database and no report is made.
    """
    orchestrator = get_orchestrator()
    if not all(orchestrator.models_loaded.values()):
        await asyncio.to_thread(orchestrator.load_all_models)
    await asyncio.to_thread(orchestrator.run_self_test)
    body = _readiness()
    return JSONResponse(body, status_code=200 if body["ready"] else 503)
