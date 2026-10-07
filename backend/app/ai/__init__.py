"""
KILATIS AI package: the image forensics pipeline.

Start reading at orchestrator.py - it runs every step in order and points to the
file that does each step.
"""
from app.ai.orchestrator import KilatisOrchestrator, get_orchestrator
from app.ai.schemas import BatchDetectionResponse, ImageAnalysisResult

__all__ = [
    "KilatisOrchestrator",
    "get_orchestrator",
    "ImageAnalysisResult",
    "BatchDetectionResponse",
]
