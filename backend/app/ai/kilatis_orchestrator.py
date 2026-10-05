from __future__ import annotations
import os
import sys
import time
import base64
import logging
from typing import List, Optional, Tuple
import cv2
import numpy as np
import torch
from PIL import Image, ImageOps, ImageFile
import pillow_heif

pillow_heif.register_heif_opener()
ImageFile.LOAD_TRUNCATED_IMAGES = True
Image.MAX_IMAGE_PIXELS = None

logger = logging.getLogger("kilatis.ai")

from app.ai import kilatis_decision as kd
from app.ai import meta_decision as md
from app.ai.transforms import extract_face_crops
from app.ai.schemas import (
    ImageAnalysisResult,
    DetectionScores,
    StreamEvidence,
    ClassProbabilities,
    AxisDetail,
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
B1_DIR = os.path.join(BASE_DIR, "branch1")
B2_DIR = os.path.join(BASE_DIR, "branch2")

B1_CKPT = os.path.join(B1_DIR, "model", "best.pt")
B2_WEIGHTS = os.path.join(B2_DIR, "weights", "best_generalized_det.pth")
B2_NOISEPRINT = os.path.join(B2_DIR, "construction", "noiseprint.pth")
B2_MITB2 = os.path.join(B2_DIR, "construction", "mit_b2.pth")
B2_CONFIG = os.path.join(B2_DIR, "construction", "trufor.yaml")
DECIDER_PATH = md.DEFAULT_DECIDER_PATH  # app/ai/weights/decider.joblib

# Add Branch 1 to sys.path for internal modules (branch2_model, branch2_data)
if B1_DIR not in sys.path:
    sys.path.insert(0, B1_DIR)

AI_VERDICT = "AI-generated / deepfake"


def get_device() -> str:
    return "cuda" if torch.cuda.is_available() else "cpu"


# PIL transpose that ImageOps.exif_transpose applies for each EXIF orientation value.
_EXIF_TRANSPOSE = {
    2: Image.Transpose.FLIP_LEFT_RIGHT,
    3: Image.Transpose.ROTATE_180,
    4: Image.Transpose.FLIP_TOP_BOTTOM,
    5: Image.Transpose.TRANSPOSE,
    6: Image.Transpose.ROTATE_270,
    7: Image.Transpose.TRANSVERSE,
    8: Image.Transpose.ROTATE_90,
}


def _orient_mask(mask: np.ndarray, image_path: str) -> np.ndarray:
    """Branch 2 reads the file without EXIF rotation; rotate its mask to Branch 1's (upright) view."""
    with Image.open(image_path) as im:
        method = _EXIF_TRANSPOSE.get(im.getexif().get(274, 1))
    if method is None:
        return mask
    return np.asarray(Image.fromarray(mask.astype(np.float32)).transpose(method))


def _mask_evidence(mask: Optional[np.ndarray], face_boxes: List[Tuple[int, int, int, int]],
                   img_size: Tuple[int, int]) -> Tuple[float, float, float]:
    """(tampered area fraction, peak mask value, share of tampered area inside a face box)."""
    if mask is None:
        return 0.0, 0.0, 0.0
    hot = mask > 0.5
    area, peak, overlap = float(hot.mean()), float(mask.max()), 0.0
    if hot.any() and face_boxes:
        mh, mw = mask.shape
        w, h = img_size
        on_face = np.zeros_like(hot)
        for x1, y1, x2, y2 in face_boxes:
            on_face[int(y1 * mh / h):int(np.ceil(y2 * mh / h)),
                    int(x1 * mw / w):int(np.ceil(x2 * mw / w))] = True
        overlap = float((hot & on_face).sum() / hot.sum())
    return area, peak, overlap


def generate_heatmap_base64(orig_img: Image.Image, mask: np.ndarray) -> str:
    """Generate JET heatmap overlay on original image and return as Base64 JPEG data URL."""
    w, h = orig_img.size
    mask_resized = cv2.resize(mask, (w, h), interpolation=cv2.INTER_LINEAR)
    mask_clamped = np.clip(mask_resized, 0.0, 1.0)

    heatmap = cv2.applyColorMap((mask_clamped * 255).astype(np.uint8), cv2.COLORMAP_JET)
    orig_cv = cv2.cvtColor(np.array(orig_img), cv2.COLOR_RGB2BGR)
    overlay = cv2.addWeighted(orig_cv, 0.6, heatmap, 0.4, 0)

    _, buffer = cv2.imencode(".jpg", overlay, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
    encoded = base64.b64encode(buffer).decode("utf-8")
    return f"data:image/jpeg;base64,{encoded}"


def _axis_detail(ax: kd.Axis) -> AxisDetail:
    return AxisDetail(
        state=ax.state.value if hasattr(ax.state, "value") else str(ax.state),
        tier=ax.tier.value if ax.tier and hasattr(ax.tier, "value") else (str(ax.tier) if ax.tier else None),
        score=round(ax.score, 4) if ax.score is not None else None,
        threshold=ax.threshold,
        demoted=ax.demoted,
        demote_reason=ax.demote_reason,
    )


class KilatisOrchestrator:
    """
    Production dual-branch KILATIS forensic orchestrator.
    Branch 1: AI / Deepfake detection (Spatial, Frequency, Wavelet streams + face crops)
    Branch 2: Splicing / Tamper localization (TruFor)
    Decision: learned meta-classifier (meta_decision.py + weights/decider.joblib);
              falls back to the 4-gate reliability matrix (kilatis_decision.py) if no decider exists.
              The rule-based verdict is always computed and returned for comparison.
    """
    def __init__(self):
        self.device = get_device()
        self.b1_model = None
        self.b2_model = None
        self.meta: Optional[md.MetaDecider] = None
        self._decider_checked = False
        self.is_ready = False

    @property
    def active_decider(self) -> str:
        return "learned" if self.meta is not None else "rules"

    def load_all_models(self):
        """Pre-load Branch 1, Branch 2 and the learned decision layer into memory/GPU."""
        print(f"[KILATIS AI] Initializing dual-branch models on device: {self.device}...")
        self._load_b1()
        self._load_b2()
        self._load_decider()
        self.is_ready = (self.b1_model is not None and self.b2_model is not None)
        if self.is_ready:
            print("[KILATIS AI] [OK] All KILATIS dual-branch models loaded successfully!")
        else:
            print("[KILATIS AI] [WARN] One or more models operating in fallback mode.")

    def _load_decider(self) -> Optional[md.MetaDecider]:
        """Learned decider if weights/decider.joblib exists, otherwise the rule-based gates.
        A decider saved by a different scikit-learn version raises a clear error (see MetaDecider.load)."""
        if self._decider_checked:
            return self.meta
        self._decider_checked = True
        if not os.path.isfile(DECIDER_PATH):
            print(f"[KILATIS AI] Decision layer: rule-based gates (no trained decider at {DECIDER_PATH})")
            return None
        self.meta = md.MetaDecider.load(DECIDER_PATH)
        print(f"[KILATIS AI] [OK] Decision layer: learned {self.meta.model_type} "
              f"(classes={self.meta.classes}, tau={self.meta.tau:.2f}, delta={self.meta.delta:.2f})")
        return self.meta

    def _load_b1(self):
        if self.b1_model is not None:
            return self.b1_model
        if not os.path.isfile(B1_CKPT):
            print(f"[KILATIS AI WARNING] Branch 1 checkpoint not found at {B1_CKPT}")
            return None
        try:
            # pyrefly: ignore [missing-import]
            from branch2_model import Branch2Net
            m = Branch2Net().to(self.device).eval()
            ck = torch.load(B1_CKPT, map_location=self.device)
            state = ck["model"] if isinstance(ck, dict) and "model" in ck else ck
            m.load_state_dict(state)
            self.b1_model = m
            print(f"[KILATIS AI] [OK] Branch 1 (AI/Deepfake) loaded on {self.device}")
            return m
        except Exception as err:
            print(f"[KILATIS AI ERROR] Failed to load Branch 1: {err}")
            return None

    def _load_b2(self):
        if self.b2_model is not None:
            return self.b2_model
        if not os.path.isfile(B2_WEIGHTS):
            print(f"[KILATIS AI WARNING] Branch 2 checkpoint not found at {B2_WEIGHTS}")
            return None
        try:
            from IMDLBenCo.model_zoo.trufor.trufor import Trufor
            m = Trufor(
                phase=2,
                np_pretrain_weights=B2_NOISEPRINT,
                mit_b2_pretrain_weights=B2_MITB2,
                config_path=B2_CONFIG
            )
            sd = torch.load(B2_WEIGHTS, map_location="cpu", weights_only=False)
            m.load_state_dict(sd.get("model", sd), strict=False)
            m.eval().to(self.device)
            self.b2_model = m
            print(f"[KILATIS AI] [OK] Branch 2 (TruFor Splicing) loaded on {self.device}")
            return m
        except Exception as err:
            print(f"[KILATIS AI ERROR] Failed to load Branch 2: {err}")
            return None

    def _b1_tiles(self, a: np.ndarray, tile: int = 256):
        h, w = a.shape[:2]
        if h < tile or w < tile:
            a = np.pad(a, ((0, max(0, tile - h)), (0, max(0, tile - w)), (0, 0)), mode="reflect")
            h, w = a.shape[:2]
        ys = list(range(0, h - tile + 1, tile)) or [0]
        xs = list(range(0, w - tile + 1, tile)) or [0]
        if ys[-1] != h - tile:
            ys.append(h - tile)
        if xs[-1] != w - tile:
            xs.append(w - tile)
        return [a[y:y + tile, x:x + tile, :] for y in ys for x in xs]

    @torch.no_grad()
    def _run_b1_score(self, img_pil: Image.Image) -> Optional[dict]:
        """Branch 1 evidence, or None when the model is not available (axis not assessable)."""
        m = self._load_b1()
        if m is None:
            return None

        # pyrefly: ignore [missing-import]
        from branch2_data import _spatial, _frequency, _wavelet, SIZE
        a = np.ascontiguousarray(np.array(img_pil, dtype=np.uint8))

        # 1. Whole-Image Tiling Path
        tiles = self._b1_tiles(a, SIZE)
        ps, ps_s, ps_f, ps_w = [], [], [], []

        for i in range(0, len(tiles), 32):
            b = tiles[i:i + 32]
            s = torch.stack([torch.from_numpy(_spatial(t)) for t in b]).to(self.device)
            f = torch.stack([torch.from_numpy(_frequency(t)) for t in b]).to(self.device)
            w = torch.stack([torch.from_numpy(_wavelet(t)) for t in b]).to(self.device)
            out = m(s, f, w)

            ps.append(torch.softmax(out["main"], 1)[:, 1].cpu().numpy())
            if "aux_s" in out:
                ps_s.append(torch.softmax(out["aux_s"], 1)[:, 1].cpu().numpy())
            if "aux_f" in out:
                ps_f.append(torch.softmax(out["aux_f"], 1)[:, 1].cpu().numpy())
            if "aux_w" in out:
                ps_w.append(torch.softmax(out["aux_w"], 1)[:, 1].cpu().numpy())

        p = np.concatenate(ps)
        p_s = np.concatenate(ps_s) if ps_s else p
        p_f = np.concatenate(ps_f) if ps_f else p
        p_w = np.concatenate(ps_w) if ps_w else p

        # 2. Face Detection & Face-Crop Tiling Path
        face_crops, face_boxes = extract_face_crops(a, return_boxes=True)
        p_face: Optional[float] = None
        n_faces = len(face_crops)
        n_face_tiles = 0

        if face_crops:
            face_tiles = []
            for fc in face_crops:
                face_tiles.extend(self._b1_tiles(fc, SIZE))
            n_face_tiles = len(face_tiles)
            if face_tiles:
                ps_face = []
                for i in range(0, len(face_tiles), 32):
                    b = face_tiles[i:i + 32]
                    s = torch.stack([torch.from_numpy(_spatial(t)) for t in b]).to(self.device)
                    f = torch.stack([torch.from_numpy(_frequency(t)) for t in b]).to(self.device)
                    w = torch.stack([torch.from_numpy(_wavelet(t)) for t in b]).to(self.device)
                    out = m(s, f, w)
                    ps_face.append(torch.softmax(out["main"], 1)[:, 1].cpu().numpy())
                if ps_face:
                    p_face = float(np.concatenate(ps_face).mean())

        return {
            "p_tile": float(p.mean()),
            "p_tile_max": float(p.max()),
            "p_tile_std": float(p.std()),
            "p_spatial": float(p_s.mean()),
            "p_frequency": float(p_f.mean()),
            "p_wavelet": float(p_w.mean()),
            "n_tiles": len(tiles),
            "p_face": p_face,
            "n_faces": n_faces,
            "n_face_tiles": n_face_tiles,
            "face_boxes": face_boxes,
        }

    @torch.no_grad()
    def _run_b2_score(self, temp_image_path: str) -> Optional[Tuple[float, float, Optional[np.ndarray]]]:
        """(p_splice, noise inconsistency, mask), or None when the model is not available."""
        m = self._load_b2()
        if m is None:
            return None

        import json
        import tempfile
        from IMDLBenCo.datasets import JsonDataset

        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump([[temp_image_path, "Negative"]], f)
            json_path = f.name

        try:
            ds = JsonDataset(
                json_path,
                is_padding=False,
                is_resizing=True,
                output_size=(512, 512),
                common_transforms=None,
                edge_width=7
            )
            x = ds[0]["image"].unsqueeze(0).to(self.device).float()
            out = m.model(x)
            o, c, d, n = out
            p_splice = float(torch.sigmoid(d.reshape(-1)[0]).item())
            mask = torch.softmax(o, 1)[:, -1][0].cpu().numpy()
            noise_inconsistency = float(torch.std(n).item()) if n is not None else p_splice
            return p_splice, noise_inconsistency, mask
        finally:
            if os.path.exists(json_path):
                os.remove(json_path)

    def evaluate_image_file(self, temp_image_path: str, filename: str) -> ImageAnalysisResult:
        """Run full dual-branch forensic pipeline and assemble decision report."""
        t0 = time.time()
        try:
            self._load_decider()

            # Gate 0: Input Quality
            q = kd.input_quality(temp_image_path)
            orig_img = ImageOps.exif_transpose(Image.open(temp_image_path).convert("RGB"))

            # Branch 1: AI / Deepfake (Spatial, Frequency, Wavelet streams + face crops)
            b1 = self._run_b1_score(orig_img) if q.ai_ok else None
            if q.ai_ok and b1 is None:
                q.ai_ok = False
                q.notes.append("Branch 1 model not available -> AI axis not assessable")
            if b1 is None:
                b1 = {"p_tile": 0.0, "p_tile_max": 0.0, "p_tile_std": 0.0, "p_spatial": 0.0,
                      "p_frequency": 0.0, "p_wavelet": 0.0, "n_tiles": 0, "p_face": None,
                      "n_faces": 0, "n_face_tiles": 0, "face_boxes": []}
            p_face = b1["p_face"]
            p_ai = max(b1["p_tile"], p_face) if p_face is not None else b1["p_tile"]

            # Branch 2: Splicing & Tamper Localization (with Noiseprint consistency)
            b2 = self._run_b2_score(temp_image_path) if q.splice_ok else None
            if q.splice_ok and b2 is None:
                q.splice_ok = False
                q.notes.append("Branch 2 model not available -> splice axis not assessable")
            p_spl, noise_inconsistency, mask = b2 if b2 is not None else (0.0, 0.0, None)

            # TruFor's mask follows the raw file; orig_img is EXIF-rotated, so rotate the mask to match.
            has_mask = mask is not None and bool((mask > 0.5).any())
            upright_mask = _orient_mask(mask, temp_image_path) if mask is not None else None
            mask_area, mask_max, mask_face_overlap = _mask_evidence(upright_mask, b1["face_boxes"], orig_img.size)

            evidence = {
                "ai_ok": q.ai_ok, "splice_ok": q.splice_ok, "degrade": q.degrade,
                "p_ai": p_ai, "p_tile": b1["p_tile"], "p_tile_max": b1["p_tile_max"],
                "p_tile_std": b1["p_tile_std"], "p_spatial": b1["p_spatial"],
                "p_frequency": b1["p_frequency"], "p_wavelet": b1["p_wavelet"],
                "p_face": p_face, "n_faces": b1["n_faces"],
                "p_splice": p_spl, "noise_inconsistency": noise_inconsistency,
                "mask_area": mask_area, "mask_max": mask_max, "mask_face_overlap": mask_face_overlap,
            }

            # Rule-based decision matrix (always computed: supplies the axis details and a comparison verdict)
            rep = kd.evaluate(q, p_ai, p_spl, has_mask=has_mask)
            rules_verdict = rep.verdict
            if rules_verdict in (AI_VERDICT, "AI-generated", "Deepfake"):
                rules_verdict = AI_VERDICT
                rep.headline = "Forensic analysis indicates AI-generated / synthetic manipulation or deepfake."

            confidence: Optional[str] = None
            reasons: List[str] = []
            if self.meta is not None:
                # Learned decision layer
                mrep = self.meta.decide(evidence)
                verdict, headline = mrep.verdict, mrep.headline
                confidence, reasons = mrep.confidence, mrep.reasons
                detail = list(mrep.detail) + [f"quality: {n}" for n in q.notes]
                if has_mask:
                    detail.append("localization mask available")
                p_auth = mrep.probs.get("authentic", 0.0)
                p_trad_splice = mrep.probs.get("spliced", 0.0)
                p_ai_deepfake = mrep.probs.get("ai_generated", 0.0)
            else:
                # Rule-based fallback (no trained decider)
                verdict, headline, detail = rules_verdict, rep.headline, rep.detail
                p_auth = max(0.0, min(1.0, 1.0 - max(p_ai, p_spl)))
                if verdict == "Authentic":
                    p_auth = max(p_auth, 0.90)
                elif verdict == "Spliced":
                    p_auth = min(p_auth, 0.15)
                elif verdict == AI_VERDICT:
                    p_auth = min(p_auth, 0.10)
                p_trad_splice, p_ai_deepfake = p_spl, p_ai

            # Heatmap overlay for spliced verdicts, or when the decider notes a pasted region
            mask_b64 = None
            shows_region = verdict in ("Spliced", "AI-generated + spliced") or \
                any("pasted region" in d for d in detail)
            if upright_mask is not None and shows_region:
                mask_b64 = generate_heatmap_base64(orig_img, upright_mask)

            conflicts = md.conflict_types(evidence)

            dt = time.time() - t0
            p_face_log = f"{p_face:.4f} ({b1['n_faces']} face(s), {b1['n_face_tiles']} tiles)" if p_face is not None else "None detected"
            print(
                f"[KILATIS AI] '{filename}' analyzed in {dt:.2f}s -> Verdict: {verdict} "
                f"({self.active_decider}, confidence: {confidence or 'n/a'}; rules: {rules_verdict})\n"
                f"             |-- P(Tiling) : {b1['p_tile']:.4f} ({b1['n_tiles']} tiles)\n"
                f"             |-- P(Face)   : {p_face_log}\n"
                f"             |-- P(Splice) : {p_spl:.4f}\n"
                f"             |-- P(AI_Comb): {p_ai:.4f}\n"
                f"             \\-- P(class)  : authentic={p_auth:.4f} spliced={p_trad_splice:.4f} ai={p_ai_deepfake:.4f}"
            )

            return ImageAnalysisResult(
                filename=filename,
                verdict=verdict,
                headline=headline,
                scores=DetectionScores(
                    p_ai=round(p_ai, 4),
                    p_splice=round(p_spl, 4)
                ),
                streams=StreamEvidence(
                    spatial_score=round(b1["p_spatial"], 4),
                    frequency_score=round(b1["p_frequency"], 4),
                    wavelet_score=round(b1["p_wavelet"], 4),
                    noise_score=round(p_spl, 4),
                    noise_inconsistency=round(noise_inconsistency, 4),
                ),
                class_probabilities=ClassProbabilities(
                    authentic=round(p_auth, 4),
                    traditional_spliced=round(p_trad_splice, 4),
                    ai_deepfake=round(p_ai_deepfake, 4),
                ),
                ai_axis=_axis_detail(rep.ai),
                splice_axis=_axis_detail(rep.splice),
                detail=detail,
                has_tamper_mask=bool(has_mask),
                mask_base64=mask_b64,
                status="success",
                decider=self.active_decider,
                confidence=confidence,
                reasons=reasons,
                rules_verdict=rules_verdict,
                conflicts=conflicts,
            )

        except Exception as err:
            import traceback
            trace_str = traceback.format_exc()
            print(f"[KILATIS AI ERROR] Failed to evaluate {filename}: {err}\n{trace_str}")
            return ImageAnalysisResult(
                filename=filename,
                verdict="Manual review",
                headline="Inference error encountered during analysis.",
                scores=DetectionScores(p_ai=0.0, p_splice=0.0),
                streams=StreamEvidence(
                    spatial_score=0.0,
                    frequency_score=0.0,
                    wavelet_score=0.0,
                    noise_score=0.0,
                    noise_inconsistency=0.0,
                ),
                class_probabilities=ClassProbabilities(
                    authentic=0.0,
                    traditional_spliced=0.0,
                    ai_deepfake=0.0,
                ),
                ai_axis=AxisDetail(state="not-assessable", threshold=kd.AI_THR),
                splice_axis=AxisDetail(state="not-assessable", threshold=kd.SPLICE_THR),
                detail=[f"Error: {str(err)}"],
                has_tamper_mask=False,
                mask_base64=None,
                status="error",
                error=str(err),
                decider=self.active_decider,
                confidence="manual review",
            )


# Global singleton instance
_orchestrator_instance: Optional[KilatisOrchestrator] = None

def get_orchestrator() -> KilatisOrchestrator:
    global _orchestrator_instance
    if _orchestrator_instance is None:
        _orchestrator_instance = KilatisOrchestrator()
    return _orchestrator_instance
