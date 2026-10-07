
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Optional

from app.ai.decision.quality import Quality

# Thresholds: score >= THR is "positive". MOD / HIGH set the confidence tier.
AI_THR, AI_MOD, AI_HIGH = 0.5422, 0.80, 0.87              # Branch 1: P(AI)
SPLICE_THR, SPLICE_MOD, SPLICE_HIGH = 0.520, 0.60, 0.80   # Branch 2: P(splice)


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
    """The rules' finding on one question (AI? or splice?)."""
    name: str
    score: Optional[float]
    threshold: float
    state: AxisState
    tier: Optional[Tier] = None
    demoted: bool = False
    demote_reason: str = ""


@dataclass
class Report:
    verdict: str
    headline: str
    detail: list[str]
    ai: Axis
    splice: Axis
    quality: Quality


def classify(name: str, score: Optional[float], thr: float, mod: float, high: float) -> Axis:
    """Gate 1: positive / negative / not-assessable, and how sure (low / moderate / high)."""
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
    """Gate 3: turn the two axes into one verdict."""
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
    """Run Gates 1-3 on the two branch scores."""
    ai = classify("AI", p_ai if quality.ai_ok else None, AI_THR, AI_MOD, AI_HIGH)
    spl = classify("Splice", det_score if quality.splice_ok else None, SPLICE_THR, SPLICE_MOD, SPLICE_HIGH)

    if quality.degrade:
        ai, spl = _tier_down(ai), _tier_down(spl)

    # Gate 2: AI beats splice (only when the AI result is HIGH).
    if ai.state == AxisState.POSITIVE and ai.tier == Tier.HIGH and spl.state == AxisState.POSITIVE:
        spl.demoted = True
        spl.demote_reason = "image reads fully synthetic; noiseprint has no camera origin to read"

    verdict, headline, detail = _assemble(ai, spl)
    for n in quality.notes:
        detail.append(f"quality: {n}")
    if has_mask and spl.state == AxisState.POSITIVE:
        detail.append("localization mask available")
    return Report(verdict, headline, detail, ai, spl, quality)
