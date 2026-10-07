
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from app.ai.decision import rules
from app.ai.decision.meta_classifier import MetaDecider
from app.ai.decision.quality import Quality

AI_VERDICT = "AI-generated / deepfake"


@dataclass
class FinalDecision:
    verdict: str                 # Authentic / Spliced / AI-generated / deepfake / Manual review
    headline: str                # one-sentence summary
    detail: list[str]            # extra notes (secondary findings, quality notes, ...)
    p_authentic: float           # class probabilities shown in the UI and the report
    p_spliced: float
    p_ai_generated: float
    confidence: Optional[str] = None                     # high / moderate / low / manual review
    reasons: list[str] = field(default_factory=list)     # top evidence behind the verdict


def run_rules(quality: Quality, p_ai: float, p_splice: float, has_mask: bool) -> tuple[rules.Report, str]:
    """Run the rule matrix. "AI-generated" and "Deepfake" are reported as one verdict."""
    report = rules.evaluate(quality, p_ai, p_splice, has_mask=has_mask)
    rules_verdict = report.verdict
    if rules_verdict in (AI_VERDICT, "AI-generated", "Deepfake"):
        rules_verdict = AI_VERDICT
        report.headline = "Forensic analysis indicates AI-generated / synthetic manipulation or deepfake."
    return report, rules_verdict


def decide_with_meta(meta: MetaDecider, evidence: dict, quality: Quality, has_mask: bool) -> FinalDecision:
    """Final verdict from the learned meta-classifier, with real class probabilities."""
    m = meta.decide(evidence)
    detail = list(m.detail) + [f"quality: {n}" for n in quality.notes]
    if has_mask:
        detail.append("localization mask available")
    return FinalDecision(
        verdict=m.verdict,
        headline=m.headline,
        detail=detail,
        p_authentic=m.probs.get("authentic", 0.0),
        p_spliced=m.probs.get("spliced", 0.0),
        p_ai_generated=m.probs.get("ai_generated", 0.0),
        confidence=m.confidence,
        reasons=m.reasons,
    )


def decide_with_rules(report: rules.Report, rules_verdict: str, p_ai: float, p_splice: float) -> FinalDecision:
    """Backup verdict from the rules. The rules have no real probabilities, so we estimate them."""
    p_auth = max(0.0, min(1.0, 1.0 - max(p_ai, p_splice)))
    if rules_verdict == "Authentic":
        p_auth = max(p_auth, 0.90)
    elif rules_verdict == "Spliced":
        p_auth = min(p_auth, 0.15)
    elif rules_verdict == AI_VERDICT:
        p_auth = min(p_auth, 0.10)
    return FinalDecision(
        verdict=rules_verdict,
        headline=report.headline,
        detail=report.detail,
        p_authentic=p_auth,
        p_spliced=p_splice,
        p_ai_generated=p_ai,
    )
