from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from app.ai.detector import get_detector
from app.ai.schemas import BatchDetectionResponse, ImageAnalysisResult

router = APIRouter(prefix="/api/detection", tags=["AI Image Detection"])


@router.post("/analyze", response_model=BatchDetectionResponse)
async def analyze_images(
    files: List[UploadFile] = File(...),
    case_number: Optional[str] = Form(None),
    case_title: Optional[str] = Form(None),
    investigator_name: Optional[str] = Form(None),
    case_notes: Optional[str] = Form(None),
):
    """
    Receives batch evidence images, passes them through the KILATIS Tri-Stream
    (Spatial + Frequency + Wavelet) AI Detector, and returns forensic verdicts.
    """
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No evidence images provided for analysis."
        )

    detector = get_detector()
    results: List[ImageAnalysisResult] = []

    for upload_file in files:
        content = await upload_file.read()
        if not content:
            continue

        result = detector.evaluate_image(
            image_bytes=content,
            filename=upload_file.filename or "unknown.png"
        )
        results.append(result)

    total_images = len(results)
    ai_generated_count = sum(1 for r in results if r.classification == "AI-GENERATED")
    deepfake_count = sum(1 for r in results if r.classification == "DEEPFAKE")
    authentic_count = sum(1 for r in results if r.classification == "AUTHENTIC")

    return BatchDetectionResponse(
        case_number=case_number,
        case_title=case_title,
        investigator=investigator_name,
        total_images=total_images,
        ai_generated_count=ai_generated_count,
        deepfake_count=deepfake_count,
        authentic_count=authentic_count,
        threshold_used=detector.threshold,
        model_status="model_ready" if detector.is_ready else "fallback_dummy_mode",
        results=results,
    )
