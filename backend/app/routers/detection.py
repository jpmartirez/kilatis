import os
import io
import tempfile
import asyncio
from typing import List, NoReturn, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
import pillow_heif
from PIL import Image
from app.ai.orchestrator import get_orchestrator
from app.ai.schemas import BatchDetectionResponse, ImageAnalysisResult

router = APIRouter(prefix="/api/detection", tags=["KILATIS Image Forensics"])

pillow_heif.register_heif_opener()  # lets Pillow open HEIC / HEIF photos (used by the upload check)

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

# Real image formats (as detected by Pillow from the file CONTENT, not the name) that we accept.
# MPO = the multi-picture JPEG many phone cameras save; DIB = BMP variant.
ACCEPTED_CONTENT_FORMATS = {"PNG", "JPEG", "MPO", "WEBP", "BMP", "DIB", "GIF", "TIFF", "HEIF"}


def _reject(filename: str, reason: str) -> NoReturn:
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"File '{filename}' was rejected: {reason}",
    )


def _rasterize_svg(content: bytes, filename: str) -> bytes:
    """Turn an SVG drawing into PNG bytes so the models can read it. Rejects files that are not valid SVG."""
    try:
        from svglib.svglib import svg2rlg
        from reportlab.graphics import renderPM

        drawing = svg2rlg(io.BytesIO(content))
        if drawing is None:
            raise ValueError("not a valid SVG drawing")
        png_buf = io.BytesIO()
        renderPM.drawToFile(drawing, png_buf, fmt="PNG")
        return png_buf.getvalue()
    except Exception:
        _reject(filename, "its content is not a valid SVG image.")


def _check_image_content(content: bytes, filename: str) -> None:
    """Make sure the bytes really are a supported image, whatever the file name says.

    A text or PDF file renamed to ".png" has the right name but not the right content;
    Pillow cannot read it, so it is rejected here before any analysis runs.
    """
    try:
        with Image.open(io.BytesIO(content)) as img:
            fmt = img.format
            img.verify()   # checks the file structure without decoding the whole picture
    except Exception:
        _reject(filename, "its content is not a real image (only the file name looks like one).")
    if fmt not in ACCEPTED_CONTENT_FORMATS:
        _reject(filename, f"it is a file of type {fmt}, which is not a supported image format.")


def _validate_upload(filename: str, content: bytes) -> tuple[bytes, str]:
    """Return (bytes to analyse, file suffix), or raise a 400 error if the file is not a valid image."""
    if not content:
        _reject(filename, "the file is empty.")

    suffix = os.path.splitext(filename)[-1].lower() or ".png"
    if suffix not in ACCEPTED_IMAGE_EXTENSIONS:
        _reject(filename, f"'{suffix}' files are not supported. "
                          f"Accepted formats: {', '.join(sorted(ACCEPTED_IMAGE_EXTENSIONS))}")

    if suffix == ".svg":
        return _rasterize_svg(content, filename), ".png"

    _check_image_content(content, filename)
    return content, suffix


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

    # 1. Check EVERY file first, so one bad file stops the batch before any model time is spent.
    #    The frontend matches results to files by position, so no file may be skipped silently.
    checked: List[tuple[str, bytes, str]] = []
    for upload_file in files:
        filename = upload_file.filename or "evidence.png"
        content, suffix = _validate_upload(filename, await upload_file.read())
        checked.append((filename, content, suffix))

    # 2. Analyse the checked files.
    orchestrator = get_orchestrator()
    results: List[ImageAnalysisResult] = []

    for filename, content, suffix in checked:
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
