from typing import Optional, List
from pydantic import BaseModel, Field


class ImageAnalysisResult(BaseModel):
    filename: str
    verdict: str                  # "AUTHENTIC" | "AI-GENERATED"
    classification: str           # "AUTHENTIC" | "AI-GENERATED" | "DEEPFAKE"
    p_tile: float                 # Whole-image synthetic probability (0.0 to 1.0)
    p_face: Optional[float] = None  # Face manipulation probability if face present
    has_face: bool = False
    tiles_analyzed: int = 0
    face_tiles_analyzed: int = 0
    status: str = "success"
    error: Optional[str] = None


class BatchDetectionResponse(BaseModel):
    case_number: Optional[str] = None
    case_title: Optional[str] = None
    investigator: Optional[str] = None
    total_images: int
    ai_generated_count: int
    deepfake_count: int
    authentic_count: int
    threshold_used: float
    model_status: str             # "model_ready" | "fallback_dummy_mode"
    results: List[ImageAnalysisResult]
