import os
import tempfile
import asyncio
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from app.ai.kilatis_orchestrator import get_orchestrator
from app.ai.schemas import BatchDetectionResponse, ImageAnalysisResult

router = APIRouter(prefix="/api/detection", tags=["KILATIS Image Forensics"])


@router.post("/analyze", response_model=BatchDetectionResponse)
async def analyze_images(
    files: List[UploadFile] = File(...),
    case_number: Optional[str] = Form(None),
    case_title: Optional[str] = Form(None),
    investigator_name: Optional[str] = Form(None),
    case_notes: Optional[str] = Form(None),
):
    """
    Receives batch evidence images, runs them through the full KILATIS dual-branch
    (AI Deepfake + TruFor Splicing Localization + Gated Decision Matrix) pipeline,
    and returns comprehensive forensic findings and localization heatmaps.
    """
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No evidence images provided for analysis."
        )

    orchestrator = get_orchestrator()
    results: List[ImageAnalysisResult] = []

    for upload_file in files:
        content = await upload_file.read()
        if not content:
            continue

        filename = upload_file.filename or "evidence.png"
        suffix = os.path.splitext(filename)[-1] or ".png"

        # Write to temporary file for TruFor / OpenCV multi-branch processing
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        try:
            # Offload heavy synchronous PyTorch inference to threadpool
            result = await asyncio.to_thread(
                orchestrator.evaluate_image_file,
                tmp_path,
                filename
            )
            results.append(result)
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    total_images = len(results)
    authentic_count = sum(1 for r in results if r.verdict == "Authentic")
    spliced_count = sum(1 for r in results if r.verdict == "Spliced")
    ai_generated_count = sum(1 for r in results if r.verdict == "AI-generated / deepfake")
    ai_spliced_count = sum(1 for r in results if r.verdict == "AI-generated + spliced")
    manual_review_count = sum(1 for r in results if r.verdict == "Manual review")

    return BatchDetectionResponse(
        total_images=total_images,
        authentic_count=authentic_count,
        spliced_count=spliced_count,
        ai_generated_count=ai_generated_count,
        ai_spliced_count=ai_spliced_count,
        manual_review_count=manual_review_count,
        results=results,
    )
