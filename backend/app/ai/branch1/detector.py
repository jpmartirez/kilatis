"""
Branch 1 detector: "Was this image (or the face in it) made by AI?"

Steps for one image:
  1. Cut the whole image into 256x256 tiles and score every tile.
  2. Find faces, cut each face into tiles, and score those too.
  3. Return the average scores (plus a few extra numbers the decision layer uses).
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Optional

import numpy as np
import torch
from PIL import Image

from app.ai.branch1.faces import Box, find_faces
from app.ai.branch1.network import Branch1Net
from app.ai.branch1.streams import (
    TILE_SIZE, frequency_stream, make_tiles, spatial_stream, wavelet_stream,
)
from app.ai.config import BRANCH1_WEIGHTS

BATCH_SIZE = 32   # tiles sent to the network at once


@dataclass
class Branch1Result:
    """Everything Branch 1 found in one image. All scores are P(AI) between 0 and 1."""
    p_tile: float = 0.0          # average over all whole-image tiles
    p_tile_max: float = 0.0      # the most suspicious single tile
    p_tile_std: float = 0.0      # how much the tiles disagree
    p_spatial: float = 0.0       # spatial stream alone
    p_frequency: float = 0.0     # frequency stream alone
    p_wavelet: float = 0.0       # wavelet stream alone
    n_tiles: int = 0
    p_face: Optional[float] = None   # average over face tiles (None = no face found)
    n_faces: int = 0
    n_face_tiles: int = 0
    face_boxes: list[Box] = field(default_factory=list)

    @property
    def p_ai(self) -> float:
        """The AI score the rules use: the higher of the whole-image and the face score."""
        return max(self.p_tile, self.p_face) if self.p_face is not None else self.p_tile


class Branch1Detector:
    def __init__(self, device: str):
        self.device = device
        self.model: Optional[Branch1Net] = None

    def load(self) -> Optional[Branch1Net]:
        """Build the network and load the trained weights. Returns None if that fails."""
        if self.model is not None:
            return self.model
        if not os.path.isfile(BRANCH1_WEIGHTS):
            print(f"[KILATIS AI WARNING] Branch 1 checkpoint not found at {BRANCH1_WEIGHTS}")
            return None
        try:
            model = Branch1Net().to(self.device).eval()
            ckpt = torch.load(BRANCH1_WEIGHTS, map_location=self.device)
            state = ckpt["model"] if isinstance(ckpt, dict) and "model" in ckpt else ckpt
            model.load_state_dict(state)
            self.model = model
            print(f"[KILATIS AI] [OK] Branch 1 (AI/Deepfake) loaded on {self.device}")
            return model
        except Exception as err:
            print(f"[KILATIS AI ERROR] Failed to load Branch 1: {err}")
            return None

    @torch.no_grad()
    def _score_tiles(self, model: Branch1Net, tiles: list[np.ndarray]) -> dict[str, np.ndarray]:
        """Run the network on tiles in batches. Returns P(AI) per tile for every output head."""
        probs: dict[str, list[np.ndarray]] = {}
        for i in range(0, len(tiles), BATCH_SIZE):
            batch = tiles[i:i + BATCH_SIZE]
            s = torch.stack([torch.from_numpy(spatial_stream(t)) for t in batch]).to(self.device)
            f = torch.stack([torch.from_numpy(frequency_stream(t)) for t in batch]).to(self.device)
            w = torch.stack([torch.from_numpy(wavelet_stream(t)) for t in batch]).to(self.device)
            out = model(s, f, w)
            for head in ("main", "aux_s", "aux_f", "aux_w"):
                if head in out:
                    probs.setdefault(head, []).append(torch.softmax(out[head], 1)[:, 1].cpu().numpy())
        return {head: np.concatenate(parts) for head, parts in probs.items()}

    def analyze(self, image: Image.Image) -> Optional[Branch1Result]:
        """Score one upright RGB image. Returns None when the model is not available."""
        model = self.load()
        if model is None:
            return None
        a = np.ascontiguousarray(np.array(image, dtype=np.uint8))

        # 1. Whole image
        tiles = make_tiles(a, TILE_SIZE)
        whole = self._score_tiles(model, tiles)
        p = whole["main"]

        # 2. Faces
        face_crops, face_boxes = find_faces(a)
        face_tiles = [t for crop in face_crops for t in make_tiles(crop, TILE_SIZE)]
        p_face = float(self._score_tiles(model, face_tiles)["main"].mean()) if face_tiles else None

        return Branch1Result(
            p_tile=float(p.mean()),
            p_tile_max=float(p.max()),
            p_tile_std=float(p.std()),
            p_spatial=float(whole.get("aux_s", p).mean()),
            p_frequency=float(whole.get("aux_f", p).mean()),
            p_wavelet=float(whole.get("aux_w", p).mean()),
            n_tiles=len(tiles),
            p_face=p_face,
            n_faces=len(face_crops),
            n_face_tiles=len(face_tiles),
            face_boxes=face_boxes,
        )
