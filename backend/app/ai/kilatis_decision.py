"""
KILATIS — Reliability & Decision layer (the "amber" fusion core).

Turns two INDEPENDENT branch outputs into one coherent finding:
  - Branch 1  -> mean P(AI)            (whole-image AI/deepfake)
  - Branch 2  -> sigmoid(det) + mask   (splice detection + localization)

It is a GATED VERDICT MATRIX, not a fused score. The two branches answer
orthogonal questions on different scales, so their raw scores are kept
separate and visible; the layer only decides how they COMBINE into a verdict.

Design:
  Gate 0  input-quality  -> marks an axis not-assessable (abstain), BEFORE scores.
  Gate 1  axis decision  -> each axis: positive / negative, with a coarse tier.
  Gate 2  AI-suppresses-splice -> if AI is HIGH-confidence positive, a positive
          splice is demoted to a low-confidence secondary note (TruFor's
          noiseprint is out-of-domain on fully synthetic images).
  Gate 3  assemble       -> the verdict matrix, including abstain paths.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional

import numpy as np
from PIL import Image

AI_THR, AI_MOD, AI_HIGH = 0.68, 0.80, 0.87          # Branch 1  (mean P(AI))
SPLICE_THR, SPLICE_MOD, SPLICE_HIGH = 0.428, 0.60, 0.80  # Branch 2  sigmoid(det)

MIN_LONG_EDGE = 256      # below this, Branch 1's native-res tiling degenerates
GRAY_SPREAD_EPS = 1.0    # mean inter-channel spread below this => effectively grayscale


class Tier(str, Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"


class AxisState(str, Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NOT_ASSESSABLE = "not-assessable"


@dataclass
class Axis:
    name: str
    score: Optional[float]
    threshold: float
    state: AxisState
    tier: Optional[Tier] = None
    demoted: bool = False
    demote_reason: str = ""


@dataclass
class Quality:
    ai_ok: bool = True
    splice_ok: bool = True
    degrade: bool = False               # screenshot / re-render -> tier everything down
    notes: list[str] = field(default_factory=list)


@dataclass
class Report:
    verdict: str
    headline: str
    detail: list[str]
    ai: Axis
    splice: Axis
    quality: Quality


def input_quality(path: str) -> Quality:
    q = Quality()
    im = Image.open(path)
    w, h = im.size
    exif = im.getexif()
    rgb = np.asarray(im.convert("RGB")).astype(np.float32)

    spread = (np.mean(np.abs(rgb[..., 0] - rgb[..., 1]))
              + np.mean(np.abs(rgb[..., 1] - rgb[..., 2]))) / 2.0
    if spread < GRAY_SPREAD_EPS:
        q.splice_ok = False
        q.notes.append("near-grayscale input -> splice axis not assessable (DVMM 0.676 floor)")

    if max(w, h) < MIN_LONG_EDGE:
        q.ai_ok = False
        q.notes.append(f"long edge {max(w, h)}px < {MIN_LONG_EDGE} -> AI tiling degenerate")

    software = str(exif.get(305, "")).lower()  # tag 305 = Software
    if "screenshot" in software or "screen shot" in software:
        q.degrade = True
        q.notes.append("EXIF marks screenshot -> forensic traces may be destroyed")

    return q


def classify(name: str, score: Optional[float], thr: float, mod: float, high: float) -> Axis:
    if score is None:
        return Axis(name, None, thr, AxisState.NOT_ASSESSABLE)

    if score >= thr:
        tier = Tier.HIGH if score >= high else Tier.MODERATE if score >= mod else Tier.LOW
        return Axis(name, score, thr, AxisState.POSITIVE, tier)

    frac = (thr - score) / thr if thr > 0 else 0.0          # 0 at threshold -> 1 at score 0
    tier = Tier.HIGH if frac >= 0.6 else Tier.MODERATE if frac >= 0.3 else Tier.LOW
    return Axis(name, score, thr, AxisState.NEGATIVE, tier)


def _tier_down(ax: Axis) -> Axis:
    step = {Tier.HIGH: Tier.MODERATE, Tier.MODERATE: Tier.LOW, Tier.LOW: Tier.LOW}
    if ax.tier is not None:
        ax.tier = step[ax.tier]
    return ax


def _assemble(ai: Axis, spl: Axis) -> tuple[str, str, list[str]]:
    A, S = ai.state, spl.state
    NA, POS, NEG = AxisState.NOT_ASSESSABLE, AxisState.POSITIVE, AxisState.NEGATIVE
    detail: list[str] = []

    if A == NA and S == NA:
        return ("Manual review", "Insufficient forensic signal on both axes.", detail)
    if A == NA:
        base = "Spliced" if S == POS else "No splice detected"
        return (base, f"{base}. AI axis not assessed.", detail)
    if S == NA:
        base = "AI-generated / deepfake" if A == POS else "No AI generation detected"
        return (base, f"{base}. Splice axis not assessed.", detail)

    # both axes assessable
    if A == NEG and S == NEG:
        return ("Authentic", "No AI generation and no splice detected.", detail)
    if A == NEG and S == POS:
        return ("Spliced", "Real capture with a foreign region grafted in (see mask).", detail)
    if A == POS and S == NEG:
        return ("AI-generated / deepfake", "Image reads as AI-generated / manipulated whole-image.", detail)

    # A == POS and S == POS
    if spl.demoted:
        detail.append(f"secondary note (low confidence): possible localized manipulation — {spl.demote_reason}")
        return ("AI-generated / deepfake",
                "Image reads as fully synthetic; a localized-manipulation signal is noted but out of the splice method's valid domain.",
                detail)
    return ("AI-generated + spliced",
            "Both axes fired and AI confidence was not high enough to suppress — report both.",
            detail)


def evaluate(quality: Quality, p_ai: float, det_score: float, has_mask: bool = False) -> Report:
    """Core policy. Model-agnostic: pass the two scores + a Quality object."""
    ai = classify("AI", p_ai if quality.ai_ok else None, AI_THR, AI_MOD, AI_HIGH)
    spl = classify("Splice", det_score if quality.splice_ok else None, SPLICE_THR, SPLICE_MOD, SPLICE_HIGH)

    if quality.degrade:
        ai, spl = _tier_down(ai), _tier_down(spl)

    # Gate 2: AI-suppresses-splice (fires ONLY at HIGH-tier AI).
    if ai.state == AxisState.POSITIVE and ai.tier == Tier.HIGH and spl.state == AxisState.POSITIVE:
        spl.demoted = True
        spl.demote_reason = "image reads fully synthetic; noiseprint has no camera origin to read"

    verdict, headline, detail = _assemble(ai, spl)
    for n in quality.notes:
        detail.append(f"quality: {n}")
    if has_mask and spl.state == AxisState.POSITIVE:
        detail.append("localization mask available")
    return Report(verdict, headline, detail, ai, spl, quality)


def evaluate_path(path: str, p_ai: float, det_score: float, has_mask: bool = False) -> Report:
    """Convenience wrapper that computes Gate 0 from the image on disk."""
    return evaluate(input_quality(path), p_ai, det_score, has_mask)
