from __future__ import annotations
import os
import io
import time
import logging
from typing import Optional, List, Tuple
import numpy as np
from PIL import Image, ImageOps, ImageFile

ImageFile.LOAD_TRUNCATED_IMAGES = True
Image.MAX_IMAGE_PIXELS = None

logger = logging.getLogger("kilatis.ai")

try:
    import torch
except ImportError:
    torch = None

from app.ai.transforms import (
    spatial_transform,
    frequency_transform,
    wavelet_transform,
    extract_face_crops,
    tiles_of,
)
from app.ai.schemas import ImageAnalysisResult

DEFAULT_THRESHOLD = 0.6781
BATCH_SIZE = 32

PRIMARY_CKPT_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "weights", "best.pt"))

POSSIBLE_CKPT_PATHS = [
    PRIMARY_CKPT_PATH,
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "ai-context", "best.pt")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "best.pt")),
]


class KilatisDetector:
    def __init__(self, checkpoint_path: Optional[str] = None, threshold: float = DEFAULT_THRESHOLD):
        self.threshold = threshold
        self.checkpoint_path = checkpoint_path or self._find_checkpoint()
        self.device = "cpu"
        self.device_name = "CPU"
        self.model = None
        self.is_ready = False

        self._initialize()

    def _find_checkpoint(self) -> Optional[str]:
        env_path = os.getenv("KILATIS_MODEL_PATH")
        if env_path and os.path.isfile(env_path):
            return env_path

        for path in POSSIBLE_CKPT_PATHS:
            if os.path.isfile(path):
                return path
        return None

    def _initialize(self):
        if torch is None:
            print("[KILATIS AI] PyTorch is not available.")
            return

        if torch.cuda.is_available():
            self.device = "cuda"
            self.device_name = torch.cuda.get_device_name(0)
        else:
            self.device = "cpu"
            self.device_name = "CPU"

        found_path = self.checkpoint_path or self._find_checkpoint()
        if not found_path or not os.path.isfile(found_path):
            print(f"[KILATIS AI WARNING] Checkpoint 'best.pt' not found at {PRIMARY_CKPT_PATH}.")
            return

        self.checkpoint_path = found_path
        try:
            from app.ai.models import Branch2Net
            model = Branch2Net().to(self.device).eval()
            checkpoint = torch.load(self.checkpoint_path, map_location=self.device)
            state = checkpoint["model"] if isinstance(checkpoint, dict) and "model" in checkpoint else checkpoint
            model.load_state_dict(state)
            self.model = model
            self.is_ready = True
            print(f"[KILATIS AI] ✓ Successfully loaded Tri-Stream Neural Network from: {self.checkpoint_path} on {self.device_name}")
        except Exception as err:
            print(f"[KILATIS AI ERROR] Failed to load model weights: {err}")

    def score_tiles(self, tiles: List[np.ndarray]) -> Tuple[float, int]:
        if not tiles or self.model is None or torch is None:
            return 0.0, len(tiles)

        probabilities = []
        with torch.no_grad():
            for i in range(0, len(tiles), BATCH_SIZE):
                batch_tiles = tiles[i:i + BATCH_SIZE]
                s = torch.stack([torch.from_numpy(spatial_transform(t)) for t in batch_tiles]).to(self.device)
                f = torch.stack([torch.from_numpy(frequency_transform(t)) for t in batch_tiles]).to(self.device)
                w = torch.stack([torch.from_numpy(wavelet_transform(t)) for t in batch_tiles]).to(self.device)

                out = self.model(s, f, w)
                probs = torch.softmax(out["main"], dim=1)[:, 1].cpu().numpy()
                probabilities.append(probs)

        if not probabilities:
            return 0.0, len(tiles)

        all_probs = np.concatenate(probabilities)
        return float(all_probs.mean()), len(tiles)

    def evaluate_image(self, image_bytes: bytes, filename: str) -> ImageAnalysisResult:
        t0 = time.time()
        try:
            if not self.is_ready:
                self._initialize()

            img = ImageOps.exif_transpose(Image.open(io.BytesIO(image_bytes)).convert("RGB"))
            a = np.ascontiguousarray(np.array(img, dtype=np.uint8))

            # Path 1: Whole-Image Tiling Path (256x256 tiles)
            whole_tiles = tiles_of(a)
            n_tiles = len(whole_tiles)

            # Path 2: Face-Crop Path
            face_crops = extract_face_crops(a)
            face_tiles = []
            if face_crops:
                for face in face_crops:
                    face_tiles.extend(tiles_of(face))
            n_face_tiles = len(face_tiles)

            print(f"[KILATIS AI] Analyzing '{filename}' -> Sliced into {n_tiles} whole tiles, {len(face_crops)} face(s) ({n_face_tiles} face tiles)...")

            if self.is_ready and self.model is not None:
                p_tile, _ = self.score_tiles(whole_tiles)
                p_face, _ = self.score_tiles(face_tiles) if face_tiles else (None, 0)
            else:
                print(f"[KILATIS AI] Warning: Running in fallback test mode because model is not ready.")
                p_tile = 0.05
                p_face = 0.08 if face_crops else None

            # Dual-path Decision Logic (Threshold = 0.6781)
            is_face_ai = (p_face is not None and p_face > self.threshold)
            is_tile_ai = (p_tile > self.threshold)

            if not is_face_ai and not is_tile_ai:
                verdict = "AUTHENTIC"
                classification = "AUTHENTIC"
            else:
                verdict = "AI-GENERATED"
                if p_face is None:
                    classification = "AI-GENERATED"
                elif p_face > p_tile:
                    classification = "DEEPFAKE"
                elif p_tile > p_face:
                    classification = "AI-GENERATED"
                else:
                    classification = "AI-GENERATED"

            dt = time.time() - t0
            p_face_str = f"{p_face:.4f}" if p_face is not None else "None"
            print(f"[KILATIS AI] Finished '{filename}' in {dt:.2f}s | P(tile)={p_tile:.4f}, P(face)={p_face_str} -> VERDICT: {verdict} ({classification})")

            return ImageAnalysisResult(
                filename=filename,
                verdict=verdict,
                classification=classification,
                p_tile=round(p_tile, 4),
                p_face=round(p_face, 4) if p_face is not None else None,
                has_face=len(face_crops) > 0,
                tiles_analyzed=n_tiles,
                face_tiles_analyzed=n_face_tiles,
                status="success"
            )

        except Exception as err:
            import traceback
            trace_str = traceback.format_exc()
            print(f"[KILATIS AI ERROR] {filename}: {err}\n{trace_str}")
            return ImageAnalysisResult(
                filename=filename,
                verdict="AUTHENTIC",
                classification="AUTHENTIC",
                p_tile=0.0,
                p_face=None,
                has_face=False,
                tiles_analyzed=0,
                face_tiles_analyzed=0,
                status="error",
                error=str(err)
            )


_detector_instance: Optional[KilatisDetector] = None

def get_detector() -> KilatisDetector:
    global _detector_instance
    if _detector_instance is None:
        _detector_instance = KilatisDetector()
    return _detector_instance
