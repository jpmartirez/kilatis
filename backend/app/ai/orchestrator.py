
from __future__ import annotations

import os
import time
import traceback
from typing import Optional

from app.ai import image_io
from app.ai.branch1.detector import Branch1Detector, Branch1Result
from app.ai.branch2.detector import Branch2Detector, Branch2Result
from app.ai.config import DECIDER_PATH, get_device
from app.ai.decision import meta_classifier, quality as quality_check, verdict
from app.ai.decision.evidence import build_evidence, orient_mask_upright
from app.ai.response import build_error_result, build_result, generate_heatmap_base64, should_show_heatmap
from app.ai.schemas import ImageAnalysisResult


class KilatisOrchestrator:
    def __init__(self):
        self.device = get_device()
        self.branch1 = Branch1Detector(self.device)
        self.branch2 = Branch2Detector(self.device)
        self.meta: Optional[meta_classifier.MetaDecider] = None
        self._decider_checked = False
        self.is_ready = False

    @property
    def active_decider(self) -> str:
        """"learned" when the meta-classifier is loaded, otherwise "rules"."""
        return "learned" if self.meta is not None else "rules"

    # loading

    def load_all_models(self):
        """Load Branch 1, Branch 2 and the meta-classifier into memory (called once at startup)."""
        print(f"[KILATIS AI] Initializing dual-branch models on device: {self.device}...")
        self.branch1.load()
        self.branch2.load()
        self._load_decider()
        self.is_ready = self.branch1.model is not None and self.branch2.model is not None
        if self.is_ready:
            print("[KILATIS AI] [OK] All KILATIS dual-branch models loaded successfully!")
        else:
            print("[KILATIS AI] [WARN] One or more models operating in fallback mode.")

    def _load_decider(self) -> Optional[meta_classifier.MetaDecider]:
        """Load decider.joblib if it exists; without it the rules give the verdict.

        A decider saved with a different scikit-learn version stops the start-up with a
        clear error message, instead of silently giving wrong answers.
        """
        if self._decider_checked:
            return self.meta
        self._decider_checked = True
        if not os.path.isfile(DECIDER_PATH):
            print(f"[KILATIS AI] Decision layer: rule-based gates (no trained decider at {DECIDER_PATH})")
            return None
        self.meta = meta_classifier.MetaDecider.load(DECIDER_PATH)
        print(f"[KILATIS AI] [OK] Decision layer: learned {self.meta.model_type} "
              f"(classes={self.meta.classes}, tau={self.meta.tau:.2f}, delta={self.meta.delta:.2f})")
        return self.meta

    # analysis

    def evaluate_image_file(self, image_path: str, filename: str) -> ImageAnalysisResult:
        """Run the whole pipeline on one image file and return the API answer."""
        started = time.time()
        try:
            self._load_decider()

            # Step 1 - Gate 0: can each branch judge this image fairly?
            quality = quality_check.input_quality(image_path)
            image = image_io.open_upright_rgb(image_path)

            # Step 2 - Branch 1: AI / deepfake (skipped when Gate 0 says no)
            b1 = self.branch1.analyze(image) if quality.ai_ok else None
            if quality.ai_ok and b1 is None:
                quality.ai_ok = False
                quality.notes.append("Branch 1 model not available -> AI axis not assessable")
            b1 = b1 or Branch1Result()

            # Step 3 - Branch 2: splicing (skipped when Gate 0 says no)
            b2 = self.branch2.analyze(image_path) if quality.splice_ok else None
            if quality.splice_ok and b2 is None:
                quality.splice_ok = False
                quality.notes.append("Branch 2 model not available -> splice axis not assessable")
            b2 = b2 or Branch2Result()

            # Step 4 - collect all evidence (mask turned upright to match the image)
            upright_mask = orient_mask_upright(b2.mask, image_path) if b2.mask is not None else None
            evidence = build_evidence(quality, b1, b2, upright_mask, image.size)

            # Step 5 - rule-based cross-check (always runs)
            rules_report, rules_verdict = verdict.run_rules(quality, b1.p_ai, b2.p_splice, b2.has_mask)

            # Step 6 - final verdict: meta-classifier, or the rules if no decider is loaded
            if self.meta is not None:
                decision = verdict.decide_with_meta(self.meta, evidence, quality, b2.has_mask)
            else:
                decision = verdict.decide_with_rules(rules_report, rules_verdict, b1.p_ai, b2.p_splice)

            # Step 7 - build the answer (with a heatmap when a pasted region is reported)
            mask_b64 = None
            if upright_mask is not None and should_show_heatmap(decision.verdict, decision.detail):
                mask_b64 = generate_heatmap_base64(image, upright_mask)

            self._log_summary(filename, time.time() - started, decision, rules_verdict, b1, b2)
            return build_result(filename, decision, rules_report, rules_verdict, b1, b2, mask_b64,
                                self.active_decider, meta_classifier.conflict_types(evidence))

        except Exception as err:
            print(f"[KILATIS AI ERROR] Failed to evaluate {filename}: {err}\n{traceback.format_exc()}")
            return build_error_result(filename, err, self.active_decider)

    def _log_summary(self, filename: str, seconds: float, decision: verdict.FinalDecision,
                     rules_verdict: str, b1: Branch1Result, b2: Branch2Result) -> None:
        face = (f"{b1.p_face:.4f} ({b1.n_faces} face(s), {b1.n_face_tiles} tiles)"
                if b1.p_face is not None else "None detected")
        print(
            f"[KILATIS AI] '{filename}' analyzed in {seconds:.2f}s -> Verdict: {decision.verdict} "
            f"({self.active_decider}, confidence: {decision.confidence or 'n/a'}; rules: {rules_verdict})\n"
            f"             |-- P(Tiling) : {b1.p_tile:.4f} ({b1.n_tiles} tiles)\n"
            f"             |-- P(Face)   : {face}\n"
            f"             |-- P(Splice) : {b2.p_splice:.4f}\n"
            f"             |-- P(AI_Comb): {b1.p_ai:.4f}\n"
            f"             \\-- P(class)  : authentic={decision.p_authentic:.4f} "
            f"spliced={decision.p_spliced:.4f} ai={decision.p_ai_generated:.4f}"
        )


# One shared instance for the whole server.
_orchestrator_instance: Optional[KilatisOrchestrator] = None


def get_orchestrator() -> KilatisOrchestrator:
    global _orchestrator_instance
    if _orchestrator_instance is None:
        _orchestrator_instance = KilatisOrchestrator()
    return _orchestrator_instance
