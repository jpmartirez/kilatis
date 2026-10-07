"""
Building the answer the API sends back to the frontend.

  - generate_heatmap_base64 : colours the tamper mask and lays it over the photo
  - build_result            : packs every number into an ImageAnalysisResult
  - build_error_result      : the answer when something went wrong (verdict "Manual review")
"""
from __future__ import annotations

import base64

import cv2
import numpy as np
from PIL import Image

from app.ai.branch1.detector import Branch1Result
from app.ai.branch2.detector import Branch2Result
from app.ai.decision import rules
from app.ai.decision.verdict import FinalDecision
from app.ai.schemas import (
    AxisDetail, ClassProbabilities, DetectionScores, ImageAnalysisResult, StreamEvidence,
)


def generate_heatmap_base64(image: Image.Image, mask: np.ndarray) -> str:
    """Blend a blue-to-red (JET) colour map of the mask over the image; return a JPEG data URL."""
    w, h = image.size
    mask_resized = np.clip(cv2.resize(mask, (w, h), interpolation=cv2.INTER_LINEAR), 0.0, 1.0)
    heatmap = cv2.applyColorMap((mask_resized * 255).astype(np.uint8), cv2.COLORMAP_JET)
    photo = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    overlay = cv2.addWeighted(photo, 0.6, heatmap, 0.4, 0)
    _, buffer = cv2.imencode(".jpg", overlay, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
    return f"data:image/jpeg;base64,{base64.b64encode(buffer).decode('utf-8')}"


def should_show_heatmap(verdict: str, detail: list[str]) -> bool:
    """Show the mask for splice verdicts, or when the decider notes a pasted region (e.g. AI image + pasted part)."""
    return verdict in ("Spliced", "AI-generated + spliced") or any("pasted region" in d for d in detail)


def axis_detail(ax: rules.Axis) -> AxisDetail:
    return AxisDetail(
        state=ax.state.value if hasattr(ax.state, "value") else str(ax.state),
        tier=ax.tier.value if ax.tier and hasattr(ax.tier, "value") else (str(ax.tier) if ax.tier else None),
        score=round(ax.score, 4) if ax.score is not None else None,
        threshold=ax.threshold,
        demoted=ax.demoted,
        demote_reason=ax.demote_reason,
    )


def build_result(filename: str, decision: FinalDecision, rules_report: rules.Report, rules_verdict: str,
                 b1: Branch1Result, b2: Branch2Result, mask_base64: str | None,
                 decider: str, conflicts: list[str]) -> ImageAnalysisResult:
    return ImageAnalysisResult(
        filename=filename,
        verdict=decision.verdict,
        headline=decision.headline,
        scores=DetectionScores(p_ai=round(b1.p_ai, 4), p_splice=round(b2.p_splice, 4)),
        streams=StreamEvidence(
            spatial_score=round(b1.p_spatial, 4),
            frequency_score=round(b1.p_frequency, 4),
            wavelet_score=round(b1.p_wavelet, 4),
            noise_score=round(b2.p_splice, 4),
            noise_inconsistency=round(b2.noise_inconsistency, 4),
        ),
        class_probabilities=ClassProbabilities(
            authentic=round(decision.p_authentic, 4),
            traditional_spliced=round(decision.p_spliced, 4),
            ai_deepfake=round(decision.p_ai_generated, 4),
        ),
        ai_axis=axis_detail(rules_report.ai),
        splice_axis=axis_detail(rules_report.splice),
        detail=decision.detail,
        has_tamper_mask=b2.has_mask,
        mask_base64=mask_base64,
        status="success",
        decider=decider,
        confidence=decision.confidence,
        reasons=decision.reasons,
        rules_verdict=rules_verdict,
        conflicts=conflicts,
    )


def build_error_result(filename: str, err: Exception, decider: str) -> ImageAnalysisResult:
    return ImageAnalysisResult(
        filename=filename,
        verdict="Manual review",
        headline="Inference error encountered during analysis.",
        scores=DetectionScores(p_ai=0.0, p_splice=0.0),
        streams=StreamEvidence(spatial_score=0.0, frequency_score=0.0, wavelet_score=0.0,
                               noise_score=0.0, noise_inconsistency=0.0),
        class_probabilities=ClassProbabilities(authentic=0.0, traditional_spliced=0.0, ai_deepfake=0.0),
        ai_axis=AxisDetail(state="not-assessable", threshold=rules.AI_THR),
        splice_axis=AxisDetail(state="not-assessable", threshold=rules.SPLICE_THR),
        detail=[f"Error: {err}"],
        has_tamper_mask=False,
        mask_base64=None,
        status="error",
        error=str(err),
        decider=decider,
        confidence="manual review",
    )
