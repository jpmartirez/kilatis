import os
import io
import tempfile
import asyncio
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from app.ai.kilatis_orchestrator import get_orchestrator
from app.ai.schemas import BatchDetectionResponse, ImageAnalysisResult

router = APIRouter(prefix="/api/detection", tags=["KILATIS Image Forensics"])

ACCEPTED_IMAGE_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".bmp",
    ".gif",
    ".tiff",
    ".tif",
    ".svg",
    ".heic",
    ".heif",
}


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
    Supports PNG, JPG, JPEG, WEBP, BMP, GIF, TIFF, TIF, SVG, HEIC, and HEIF formats.
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
        suffix = os.path.splitext(filename)[-1].lower() or ".png"

        if suffix not in ACCEPTED_IMAGE_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"File '{filename}' has an unsupported file extension '{suffix}'. "
                    f"Accepted formats: {', '.join(sorted(ACCEPTED_IMAGE_EXTENSIONS))}"
                ),
            )

        # If vector SVG is uploaded, rasterize to PNG so computer vision models can analyze it
        if suffix == ".svg":
            try:
                from svglib.svglib import svg2rlg
                from reportlab.graphics import renderPM

                drawing = svg2rlg(io.BytesIO(content))
                if drawing is None:
                    raise ValueError("Could not parse SVG vector structure")
                png_buf = io.BytesIO()
                renderPM.drawToFile(drawing, png_buf, fmt="PNG")
                content = png_buf.getvalue()
                suffix = ".png"
            except Exception as err:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to rasterize SVG image '{filename}': {err}"
                )

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
