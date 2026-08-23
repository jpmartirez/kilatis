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

ImageFile.LOAD_TRUNCATED_IMAGES = True
Image.MAX_IMAGE_PIXELS = None

logger = logging.getLogger("kilatis.ai")

from app.ai import kilatis_decision as kd
from app.ai.schemas import (
    ImageAnalysisResult,
    DetectionScores,
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
            print("[KILATIS AI] ✓ All KILATIS dual-branch models loaded successfully!")
        else:
            print("[KILATIS AI] ⚠ One or more models operating in fallback mode.")

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
            print(f"[KILATIS AI] ✓ Branch 1 (AI/Deepfake) loaded on {self.device}")
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
            print(f"[KILATIS AI] ✓ Branch 2 (TruFor Splicing) loaded on {self.device}")
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
    def _run_b1_score(self, img_pil: Image.Image) -> Tuple[float, int]:
        m = self._load_b1()
        if m is None:
            return 0.05, 0

        from branch2_data import _spatial, _frequency, _wavelet, SIZE
        a = np.ascontiguousarray(np.array(img_pil, dtype=np.uint8))
        tiles = self._b1_tiles(a, SIZE)
        ps = []
        for i in range(0, len(tiles), 32):
            b = tiles[i:i + 32]
            s = torch.stack([torch.from_numpy(_spatial(t)) for t in b]).to(self.device)
            f = torch.stack([torch.from_numpy(_frequency(t)) for t in b]).to(self.device)
            w = torch.stack([torch.from_numpy(_wavelet(t)) for t in b]).to(self.device)
            out = m(s, f, w)
            ps.append(torch.softmax(out["main"], 1)[:, 1].cpu().numpy())
        p = np.concatenate(ps)
        return float(p.mean()), len(tiles)

    @torch.no_grad()
    def _run_b2_score(self, temp_image_path: str) -> Tuple[float, Optional[np.ndarray]]:
        m = self._load_b2()
        if m is None:
            return 0.05, None

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
            return p_splice, mask
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

            # Branch 1: AI / Deepfake
            p_ai = self._run_b1_score(orig_img)[0] if q.ai_ok else 0.0

            # Branch 2: Splicing & Tamper Localization
            p_spl, mask = self._run_b2_score(temp_image_path) if q.splice_ok else (0.0, None)

            # Decision Matrix Core
            has_mask = mask is not None and bool((mask > 0.5).any())
            rep = kd.evaluate(q, p_ai, p_spl, has_mask=has_mask)

            # Generate Heatmap Overlay ONLY if image is spliced / tampered
            mask_b64 = None
            if (rep.verdict == "Spliced" or rep.verdict == "AI-generated + spliced") and mask is not None:
                mask_b64 = generate_heatmap_base64(orig_img, mask)

            dt = time.time() - t0
            print(f"[KILATIS AI] '{filename}' analyzed in {dt:.2f}s -> Verdict: {rep.verdict} | P(AI)={p_ai:.4f} | P(Splice)={p_spl:.4f}")

            return ImageAnalysisResult(
                filename=filename,
                verdict=rep.verdict,
                headline=rep.headline,
                scores=DetectionScores(
                    p_ai=round(p_ai, 4),
                    p_splice=round(p_spl, 4)
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
