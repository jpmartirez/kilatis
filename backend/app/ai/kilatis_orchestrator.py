from __future__ import annotations
import os
import sys
import io
import time
import base64
import logging
from typing import Optional, Tuple
import cv2
import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image, ImageOps, ImageFile
import pillow_heif

pillow_heif.register_heif_opener()
ImageFile.LOAD_TRUNCATED_IMAGES = True
Image.MAX_IMAGE_PIXELS = None

logger = logging.getLogger("kilatis.ai")

from app.ai import kilatis_decision as kd
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

# Add Branch 1 to sys.path for internal modules (branch2_model, branch2_data)
if B1_DIR not in sys.path:
    sys.path.insert(0, B1_DIR)


def get_device() -> str:
    return "cuda" if torch.cuda.is_available() else "cpu"


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


class KilatisOrchestrator:
    """
    Production dual-branch KILATIS forensic orchestrator.
    Branch 1: AI / Deepfake detection
    Branch 2: Splicing / Tamper localization
    Decision: 4-gate reliability matrix
    """
    def __init__(self):
        self.device = get_device()
        self.b1_model = None
        self.b2_model = None
        self.is_ready = False

    def load_all_models(self):
        """Pre-load both Branch 1 and Branch 2 models into memory/GPU."""
        print(f"[KILATIS AI] Initializing dual-branch models on device: {self.device}...")
        self._load_b1()
        self._load_b2()
        self.is_ready = (self.b1_model is not None and self.b2_model is not None)
        if self.is_ready:
            print("[KILATIS AI] [OK] All KILATIS dual-branch models loaded successfully!")
        else:
            print("[KILATIS AI] [WARN] One or more models operating in fallback mode.")

    def _load_b1(self):
        if self.b1_model is not None:
            return self.b1_model
        if not os.path.isfile(B1_CKPT):
            print(f"[KILATIS AI WARNING] Branch 1 checkpoint not found at {B1_CKPT}")
            return None
        try:
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
    def _run_b1_score(self, img_pil: Image.Image) -> Tuple[float, float, float, float, int, Optional[float], int, int]:
        m = self._load_b1()
        if m is None:
            return 0.05, 0.05, 0.05, 0.05, 0, None, 0, 0

        from branch2_data import _spatial, _frequency, _wavelet, SIZE
        from app.ai.transforms import extract_face_crops
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
        p_tile = float(p.mean())

        # 2. Face Detection & Face-Crop Tiling Path
        face_crops = extract_face_crops(a)
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

        return p_tile, float(p_s.mean()), float(p_f.mean()), float(p_w.mean()), len(tiles), p_face, n_faces, n_face_tiles

    @torch.no_grad()
    def _run_b2_score(self, temp_image_path: str) -> Tuple[float, float, Optional[np.ndarray]]:
        m = self._load_b2()
        if m is None:
            return 0.05, 0.05, None

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
            # Gate 0: Input Quality
            q = kd.input_quality(temp_image_path)
            orig_img = ImageOps.exif_transpose(Image.open(temp_image_path).convert("RGB"))

            # Branch 1: AI / Deepfake (with Spatial, Frequency, Wavelet auxiliary streams + Face detection)
            if q.ai_ok:
                p_tile, p_spatial, p_frequency, p_wavelet, n_tiles, p_face, n_faces, n_face_tiles = self._run_b1_score(orig_img)
                # Combine tile and face scores
                p_ai = max(p_tile, p_face) if p_face is not None else p_tile
            else:
                p_tile, p_spatial, p_frequency, p_wavelet, n_tiles, p_face, n_faces, n_face_tiles = 0.0, 0.0, 0.0, 0.0, 0, None, 0, 0
                p_ai = 0.0

            # Branch 2: Splicing & Tamper Localization (with Noiseprint consistency)
            if q.splice_ok:
                p_spl, noise_inconsistency, mask = self._run_b2_score(temp_image_path)
            else:
                p_spl, noise_inconsistency, mask = 0.0, 0.0, None

            # Decision Matrix Core
            has_mask = mask is not None and bool((mask > 0.5).any())
            rep = kd.evaluate(q, p_ai, p_spl, has_mask=has_mask)

            # Combine AI-generated and Deepfake into unified "AI-generated / deepfake"
            verdict = rep.verdict
            if verdict in ("AI-generated / deepfake", "AI-generated", "Deepfake"):
                verdict = "AI-generated / deepfake"
                rep.headline = "Forensic analysis indicates AI-generated / synthetic manipulation or deepfake."

            # Generate Heatmap Overlay ONLY if image is spliced / tampered
            mask_b64 = None
            if (verdict == "Spliced" or verdict == "AI-generated + spliced") and mask is not None:
                mask_b64 = generate_heatmap_base64(orig_img, mask)

            # Compute 3 Canonical Class Probabilities (Authentic, Traditional Spliced, AI-Generated / Deepfake)
            p_auth = max(0.0, min(1.0, 1.0 - max(p_ai, p_spl)))
            if verdict == "Authentic":
                p_auth = max(p_auth, 0.90)
            elif verdict == "Spliced":
                p_auth = min(p_auth, 0.15)
            elif verdict == "AI-generated / deepfake":
                p_auth = min(p_auth, 0.10)

            dt = time.time() - t0
            p_face_log = f"{p_face:.4f} ({n_faces} face(s), {n_face_tiles} tiles)" if p_face is not None else "None detected"
            print(
                f"[KILATIS AI] '{filename}' analyzed in {dt:.2f}s -> Verdict: {verdict}\n"
                f"             |-- P(Tiling) : {p_tile:.4f} ({n_tiles} tiles)\n"
                f"             |-- P(Face)   : {p_face_log}\n"
                f"             |-- P(Splice) : {p_spl:.4f}\n"
                f"             \\-- P(AI_Comb): {p_ai:.4f}"
            )

            return ImageAnalysisResult(
                filename=filename,
                verdict=verdict,
                headline=rep.headline,
                scores=DetectionScores(
                    p_ai=round(p_ai, 4),
                    p_splice=round(p_spl, 4)
                ),
                streams=StreamEvidence(
                    spatial_score=round(p_spatial, 4),
                    frequency_score=round(p_frequency, 4),
                    wavelet_score=round(p_wavelet, 4),
                    noise_score=round(p_spl, 4),
                    noise_inconsistency=round(noise_inconsistency, 4),
                ),
                class_probabilities=ClassProbabilities(
                    authentic=round(p_auth, 4),
                    traditional_spliced=round(p_spl, 4),
                    ai_deepfake=round(p_ai, 4),
                ),
                ai_axis=AxisDetail(
                    state=rep.ai.state.value if hasattr(rep.ai.state, "value") else str(rep.ai.state),
                    tier=rep.ai.tier.value if rep.ai.tier and hasattr(rep.ai.tier, "value") else (str(rep.ai.tier) if rep.ai.tier else None),
                    score=round(rep.ai.score, 4) if rep.ai.score is not None else None,
                    threshold=rep.ai.threshold,
                    demoted=rep.ai.demoted,
                    demote_reason=rep.ai.demote_reason,
                ),
                splice_axis=AxisDetail(
                    state=rep.splice.state.value if hasattr(rep.splice.state, "value") else str(rep.splice.state),
                    tier=rep.splice.tier.value if rep.splice.tier and hasattr(rep.splice.tier, "value") else (str(rep.splice.tier) if rep.splice.tier else None),
                    score=round(rep.splice.score, 4) if rep.splice.score is not None else None,
                    threshold=rep.splice.threshold,
                    demoted=rep.splice.demoted,
                    demote_reason=rep.splice.demote_reason,
                ),
                detail=rep.detail,
                has_tamper_mask=bool(has_mask),
                mask_base64=mask_b64,
                status="success"
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
                error=str(err)
            )


# Global singleton instance
_orchestrator_instance: Optional[KilatisOrchestrator] = None

def get_orchestrator() -> KilatisOrchestrator:
    global _orchestrator_instance
    if _orchestrator_instance is None:
        _orchestrator_instance = KilatisOrchestrator()
    return _orchestrator_instance
