
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

import numpy as np

from app.ai.config import DECIDER_PATH
from app.ai.decision.rules import AI_THR, SPLICE_THR

DEFAULT_DECIDER_PATH = DECIDER_PATH

# Order matters: the trained model expects exactly this order.
FEATURE_NAMES = [
    # Branch 1 — AI / deepfake
    "ai_ok", "p_ai", "p_tile", "p_tile_max", "p_tile_std",
    "p_spatial", "p_frequency", "p_wavelet", "stream_spread",
    "has_face", "p_face", "face_minus_tile", "n_faces",
    # Branch 2 — splicing
    "splice_ok", "p_splice", "noise_inconsistency", "mask_area", "mask_max",
    # Both branches
    "mask_face_overlap",
    # Gate 0 — input quality
    "is_screenshot",
]

FEATURE_LABELS = {
    "ai_ok": "AI branch could assess the image",
    "p_ai": "AI score used by the old rules",
    "p_tile": "Whole-image AI score",
    "p_tile_max": "Highest single-tile AI score",
    "p_tile_std": "Spread of tile AI scores",
    "p_spatial": "Spatial stream AI score",
    "p_frequency": "Frequency (DCT) stream AI score",
    "p_wavelet": "Wavelet stream AI score",
    "stream_spread": "Disagreement between AI streams",
    "has_face": "Face present",
    "p_face": "Face-region AI score",
    "face_minus_tile": "Face score minus whole-image score",
    "n_faces": "Number of faces",
    "splice_ok": "Splice branch could assess the image",
    "p_splice": "Splice detection score",
    "noise_inconsistency": "Noise inconsistency",
    "mask_area": "Tampered area (fraction of image)",
    "mask_max": "Peak tamper-mask value",
    "mask_face_overlap": "Share of tampered area lying on a face",
    "is_screenshot": "Screenshot input",
}

# Deepfakes are AI-generated content, so they share one class and one verdict.
CLASSES = ["authentic", "spliced", "ai_generated"]

CLASS_TITLES = {
    "authentic": "Authentic",
    "spliced": "Spliced",
    "ai_generated": "AI-generated / deepfake",
}

CLASS_HEADLINES = {
    "authentic": "No AI generation and no splice detected.",
    "spliced": "Real capture with a foreign region grafted in (see mask).",
    "ai_generated": "Image is AI-generated or contains an AI-manipulated (deepfake) face.",
}

HIGH_CONF, MODERATE_CONF = 0.85, 0.70
CONFIDENCE_STEPS = ["high", "moderate", "low", "manual review"]

# Conflict-case definition (manuscript Section 7.3).
NEAR_CUTOFF = 0.05
STREAM_DISAGREE = 0.40
FACE_TILE_DISAGREE = 0.40


def feature_vector(ev: dict) -> np.ndarray:
    """Turn the orchestrator's evidence dict into the model's input row."""
    ai_ok, splice_ok = bool(ev["ai_ok"]), bool(ev["splice_ok"])
    p_face = ev.get("p_face")
    has_face = ai_ok and p_face is not None
    p_tile = ev["p_tile"] if ai_ok else 0.0
    streams = [ev["p_spatial"], ev["p_frequency"], ev["p_wavelet"]] if ai_ok else [0.0, 0.0, 0.0]

    values = {
        "ai_ok": float(ai_ok),
        "p_ai": ev["p_ai"] if ai_ok else 0.0,
        "p_tile": p_tile,
        "p_tile_max": ev["p_tile_max"] if ai_ok else 0.0,
        "p_tile_std": ev["p_tile_std"] if ai_ok else 0.0,
        "p_spatial": streams[0],
        "p_frequency": streams[1],
        "p_wavelet": streams[2],
        "stream_spread": max(streams) - min(streams),
        "has_face": float(has_face),
        "p_face": p_face if has_face else p_tile,      # no face -> neutral value
        "face_minus_tile": (p_face - p_tile) if has_face else 0.0,
        "n_faces": float(min(ev.get("n_faces", 0), 5)) if ai_ok else 0.0,
        "splice_ok": float(splice_ok),
        "p_splice": ev["p_splice"] if splice_ok else 0.0,
        "noise_inconsistency": ev["noise_inconsistency"] if splice_ok else 0.0,
        "mask_area": ev["mask_area"] if splice_ok else 0.0,
        "mask_max": ev["mask_max"] if splice_ok else 0.0,
        "mask_face_overlap": ev["mask_face_overlap"] if splice_ok else 0.0,
        "is_screenshot": float(bool(ev.get("degrade", False))),
    }
    return np.array([float(values[n]) for n in FEATURE_NAMES], dtype=np.float64)


def conflict_types(ev: dict) -> list[str]:
    """Which 'hard case' types this image belongs to (empty list = no conflict)."""
    out: list[str] = []
    ai_ok, splice_ok = bool(ev["ai_ok"]), bool(ev["splice_ok"])
    if ai_ok and splice_ok and ev["p_ai"] >= AI_THR and ev["p_splice"] >= SPLICE_THR:
        out.append("both_positive")
    if (ai_ok and abs(ev["p_ai"] - AI_THR) <= NEAR_CUTOFF) or \
       (splice_ok and abs(ev["p_splice"] - SPLICE_THR) <= NEAR_CUTOFF):
        out.append("near_cutoff")
    if ai_ok:
        streams = [ev["p_spatial"], ev["p_frequency"], ev["p_wavelet"]]
        if max(streams) - min(streams) > STREAM_DISAGREE:
            out.append("streams_disagree")
        if ev.get("p_face") is not None and abs(ev["p_face"] - ev["p_tile"]) > FACE_TILE_DISAGREE:
            out.append("face_vs_tile")
    return out


@dataclass
class MetaReport:
    verdict: str
    headline: str
    confidence: str                      # high / moderate / low / manual review
    top_class: Optional[str]
    top_prob: float
    probs: dict[str, float] = field(default_factory=dict)
    reasons: list[str] = field(default_factory=list)
    detail: list[str] = field(default_factory=list)


class MetaDecider:
    """Wraps a trained bundle saved by train_decider.py."""

    def __init__(self, bundle: dict):
        if list(bundle["feature_names"]) != FEATURE_NAMES:
            raise ValueError("decider was trained on a different feature list; "
                             "re-run collect_features.py and train_decider.py")
        self.model = bundle["model"]
        self.classes: list[str] = [str(c) for c in bundle["classes"]]
        if "deepfake" in self.classes:
            raise ValueError("this decider was trained with a separate 'deepfake' class; deepfakes are now "
                             "part of 'ai_generated'. Re-run meta_classifier/train_decider.py to retrain it.")
        self.reference = np.asarray(bundle["reference"], dtype=np.float64)
        self.tau = float(bundle["tau"])
        self.delta = float(bundle["delta"])
        self.model_type = bundle.get("model_type", "?")
        self.path = bundle.get("_path", "")

    @classmethod
    def load(cls, path: Optional[str] = None) -> "MetaDecider":
        import joblib
        path = path or DEFAULT_DECIDER_PATH
        bundle = joblib.load(path)
        bundle["_path"] = path
        decider = cls(bundle)
        # A model saved by a different scikit-learn version can load fine but crash when predicting.
        try:
            decider.predict_proba(decider.reference[None])
        except Exception as err:
            import sklearn
            raise RuntimeError(
                f"The trained decider at {path} was made with scikit-learn {bundle.get('sklearn_version', '?')}, "
                f"but this computer has {sklearn.__version__}, and it cannot run here ({type(err).__name__}: {err}). "
                "Retrain it on this computer: python meta_classifier/train_decider.py") from err
        return decider

    def title(self, c: str) -> str:
        return CLASS_TITLES.get(c, c)

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        return self.model.predict_proba(X)

    def _reasons(self, x: np.ndarray, k: int, n: int = 3) -> list[str]:
        """Evidence that raised P(class k) the most: swap each value for a typical
        (training-median) value and measure how much the probability drops."""
        base = self.predict_proba(x[None])[0, k]
        X = np.repeat(x[None], len(x), axis=0)
        X[np.arange(len(x)), np.arange(len(x))] = self.reference
        gain = base - self.predict_proba(X)[:, k]
        reasons = []
        for i in np.argsort(-gain)[:n]:
            if gain[i] < 0.005:
                break
            name = FEATURE_NAMES[i]
            reasons.append(f"{FEATURE_LABELS[name]} = {x[i]:.2f} "
                           f"(+{gain[i] * 100:.0f} pts toward {self.title(self.classes[k])})")
        return reasons

    def decide(self, ev: dict) -> MetaReport:
        ai_ok, splice_ok = bool(ev["ai_ok"]), bool(ev["splice_ok"])

        # Step 4a — nothing to decide on.
        if not ai_ok and not splice_ok:
            return MetaReport("Manual review", "Neither branch could assess this image.",
                              "manual review", None, 0.0)

        # Step 2 — class probabilities.
        x = feature_vector(ev)
        p = self.predict_proba(x[None])[0]
        order = np.argsort(-p)
        k, k2 = int(order[0]), int(order[1]) if len(order) > 1 else int(order[0])
        top, second = float(p[k]), float(p[k2]) if k2 != k else 0.0
        probs = {c: round(float(v), 4) for c, v in zip(self.classes, p)}
        top_class = self.classes[k]
        reasons = self._reasons(x, k)
        detail: list[str] = []

        # Step 3 — confidence check.
        if top < self.tau or (top - second) < self.delta:
            headline = (f"Not confident enough: {self.title(top_class)} {top:.2f} "
                        f"vs {self.title(self.classes[k2])} {second:.2f}.")
            return MetaReport("Manual review", headline, "manual review", top_class, top,
                              probs, reasons, detail)

        level = "high" if top >= HIGH_CONF else "moderate" if top >= MODERATE_CONF else "low"

        # Step 4b — poor input or a missing branch lowers confidence one level.
        if ev.get("degrade") or not ai_ok or not splice_ok:
            level = CONFIDENCE_STEPS[CONFIDENCE_STEPS.index(level) + 1]
            detail.append("confidence lowered one level: input quality issue or a branch not assessable")
            if level == "manual review":
                headline = f"Leaning {self.title(top_class)} ({top:.2f}), but input quality is too poor to confirm."
                return MetaReport("Manual review", headline, level, top_class, top, probs, reasons, detail)

        # Secondary findings the main verdict does not cover.
        if top_class == "ai_generated" and splice_ok and ev["p_splice"] >= SPLICE_THR:
            detail.append(f"secondary note: a possible pasted region is also marked "
                          f"(splice score {ev['p_splice']:.2f}, see mask)")
        if top_class == "spliced" and ai_ok and ev["p_ai"] >= AI_THR:
            detail.append(f"secondary note: AI signal also present (AI score {ev['p_ai']:.2f}); "
                          f"the pasted region may itself be AI-generated")

        return MetaReport(self.title(top_class), CLASS_HEADLINES.get(top_class, ""), level,
                          top_class, top, probs, reasons, detail)
