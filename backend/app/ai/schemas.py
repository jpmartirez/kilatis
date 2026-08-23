from pydantic import BaseModel
from typing import List, Optional


class AxisDetail(BaseModel):
    state: str
    tier: Optional[str] = None
    score: Optional[float] = None
    threshold: float
    demoted: bool = False
    demote_reason: str = ""


class DetectionScores(BaseModel):
    p_ai: float
    p_splice: float


class StreamEvidence(BaseModel):
    spatial_score: float
    frequency_score: float
    wavelet_score: float
    noise_score: float
    noise_inconsistency: float


class ClassProbabilities(BaseModel):
    authentic: float
    traditional_spliced: float
    ai_deepfake: float


class ImageAnalysisResult(BaseModel):
    filename: str
    verdict: str
    headline: str
    scores: DetectionScores
    streams: StreamEvidence
    class_probabilities: ClassProbabilities
    ai_axis: AxisDetail
    splice_axis: AxisDetail
    detail: List[str]
    has_tamper_mask: bool
    mask_base64: Optional[str] = None
    status: str = "success"
    error: Optional[str] = None


class BatchDetectionResponse(BaseModel):
    total_images: int
    authentic_count: int
    spliced_count: int
    ai_generated_count: int
    ai_spliced_count: int
    manual_review_count: int
    results: List[ImageAnalysisResult]
