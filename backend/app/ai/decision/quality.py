"""
Gate 0 - input quality check (runs BEFORE any model).

Some images cannot be judged fairly by one of the branches. Instead of letting
that branch guess, we mark it "not assessable" so it is left out of the decision.
"""
from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np
from PIL import Image

MIN_LONG_EDGE = 256      # smaller than one Branch 1 tile -> AI check is not reliable
GRAY_SPREAD_EPS = 1.0    # colour channels almost equal -> treat the image as grayscale


@dataclass
class Quality:
    ai_ok: bool = True        # Branch 1 may judge this image
    splice_ok: bool = True    # Branch 2 may judge this image
    degrade: bool = False     # judge it, but trust the result less (e.g. screenshots)
    notes: list[str] = field(default_factory=list)


def input_quality(path: str) -> Quality:
    q = Quality()
    im = Image.open(path)
    w, h = im.size
    exif = im.getexif()
    rgb = np.asarray(im.convert("RGB")).astype(np.float32)

    # Grayscale: TruFor's noise fingerprint needs colour, so skip Branch 2.
    spread = (np.mean(np.abs(rgb[..., 0] - rgb[..., 1]))
              + np.mean(np.abs(rgb[..., 1] - rgb[..., 2]))) / 2.0
    if spread < GRAY_SPREAD_EPS:
        q.splice_ok = False
        q.notes.append("near-grayscale input -> splice axis not assessable (DVMM 0.676 floor)")

    # Very small image: Branch 1 cannot cut proper 256x256 tiles, so skip it.
    if max(w, h) < MIN_LONG_EDGE:
        q.ai_ok = False
        q.notes.append(f"long edge {max(w, h)}px < {MIN_LONG_EDGE} -> AI tiling degenerate")

    # Screenshot: the original camera traces are mostly gone, so lower trust.
    software = str(exif.get(305, "")).lower()  # EXIF tag 305 = Software
    if "screenshot" in software or "screen shot" in software:
        q.degrade = True
        q.notes.append("EXIF marks screenshot -> forensic traces may be destroyed")

    return q
