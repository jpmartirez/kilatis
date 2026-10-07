
from __future__ import annotations

import json
import os
import tempfile
from dataclasses import dataclass
from typing import Optional

import numpy as np
import torch

from app.ai.config import BRANCH2_CONFIG, BRANCH2_MIT_B2, BRANCH2_NOISEPRINT, BRANCH2_WEIGHTS

MASK_SIZE = (512, 512)   # TruFor reads a resized 512x512 copy of the image


@dataclass
class Branch2Result:
    p_splice: float = 0.0
    noise_inconsistency: float = 0.0
    mask: Optional[np.ndarray] = None   # in the raw file's direction (EXIF rotation NOT applied)

    @property
    def has_mask(self) -> bool:
        """True when at least one pixel of the mask is more likely tampered than not."""
        return self.mask is not None and bool((self.mask > 0.5).any())


class Branch2Detector:
    def __init__(self, device: str):
        self.device = device
        self.model = None

    def load(self):
        """Build TruFor and load the trained weights. Returns None if that fails."""
        if self.model is not None:
            return self.model
        if not os.path.isfile(BRANCH2_WEIGHTS):
            print(f"[KILATIS AI WARNING] Branch 2 checkpoint not found at {BRANCH2_WEIGHTS}")
            return None
        try:
            from IMDLBenCo.model_zoo.trufor.trufor import Trufor
            model = Trufor(
                phase=2,
                np_pretrain_weights=BRANCH2_NOISEPRINT,
                mit_b2_pretrain_weights=BRANCH2_MIT_B2,
                config_path=BRANCH2_CONFIG,
            )
            state = torch.load(BRANCH2_WEIGHTS, map_location="cpu", weights_only=False)
            model.load_state_dict(state.get("model", state), strict=False)
            model.eval().to(self.device)
            self.model = model
            print(f"[KILATIS AI] [OK] Branch 2 (TruFor Splicing) loaded on {self.device}")
            return model
        except Exception as err:
            print(f"[KILATIS AI ERROR] Failed to load Branch 2: {err}")
            return None

    @staticmethod
    def _read_like_training(image_path: str) -> torch.Tensor:
        """Prepare the image exactly as IMDLBenCo did during training (resize to 512x512).

        IMDLBenCo's loader only reads images listed in a JSON file, so we write a
        one-line list to a temporary file and delete it afterwards.
        """
        from IMDLBenCo.datasets import JsonDataset

        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump([[image_path, "Negative"]], f)
            json_path = f.name
        try:
            ds = JsonDataset(json_path, is_padding=False, is_resizing=True,
                             output_size=MASK_SIZE, common_transforms=None, edge_width=7)
            return ds[0]["image"]
        finally:
            if os.path.exists(json_path):
                os.remove(json_path)

    @torch.no_grad()
    def analyze(self, image_path: str) -> Optional[Branch2Result]:
        """Score one image file. Returns None when the model is not available."""
        model = self.load()
        if model is None:
            return None

        x = self._read_like_training(image_path).unsqueeze(0).to(self.device).float()
        mask_logits, _confidence, detection, noiseprint = model.model(x)

        p_splice = float(torch.sigmoid(detection.reshape(-1)[0]).item())
        mask = torch.softmax(mask_logits, 1)[:, -1][0].cpu().numpy()
        noise_inconsistency = float(torch.std(noiseprint).item()) if noiseprint is not None else p_splice
        return Branch2Result(p_splice, noise_inconsistency, mask)
