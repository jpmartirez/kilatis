"""
Collecting the evidence both branches produced into one dictionary.

The meta-classifier does not read only two scores like the old rules. It reads
the full evidence: tile statistics, the three stream scores, face scores, and
facts about the tamper mask (how big it is, how strong, and whether it sits on a face).
"""
from __future__ import annotations

from typing import Optional

import numpy as np
from PIL import Image

from app.ai.branch1.detector import Branch1Result
from app.ai.branch1.faces import Box
from app.ai.branch2.detector import Branch2Result
from app.ai.decision.quality import Quality

# The PIL transpose that ImageOps.exif_transpose applies for each EXIF orientation value.
_EXIF_TRANSPOSE = {
    2: Image.Transpose.FLIP_LEFT_RIGHT,
    3: Image.Transpose.ROTATE_180,
    4: Image.Transpose.FLIP_TOP_BOTTOM,
    5: Image.Transpose.TRANSPOSE,
    6: Image.Transpose.ROTATE_270,
    7: Image.Transpose.TRANSVERSE,
    8: Image.Transpose.ROTATE_90,
}


def orient_mask_upright(mask: np.ndarray, image_path: str) -> np.ndarray:
    """Turn Branch 2's mask the same way as the upright image Branch 1 saw.

    TruFor reads the raw file and ignores the EXIF orientation tag, so on a
    sideways phone photo its mask is sideways too. Without this fix the heatmap
    and the "mask on a face" check would point at the wrong place.
    """
    with Image.open(image_path) as im:
        method = _EXIF_TRANSPOSE.get(im.getexif().get(274, 1))   # EXIF tag 274 = Orientation
    if method is None:
        return mask
    return np.asarray(Image.fromarray(mask.astype(np.float32)).transpose(method))


def mask_evidence(mask: Optional[np.ndarray], face_boxes: list[Box],
                  img_size: tuple[int, int]) -> tuple[float, float, float]:
    """Return (tampered area share, strongest mask value, share of the tampered area on a face)."""
    if mask is None:
        return 0.0, 0.0, 0.0
    hot = mask > 0.5
    area, peak, overlap = float(hot.mean()), float(mask.max()), 0.0
    if hot.any() and face_boxes:
        mh, mw = mask.shape
        w, h = img_size
        on_face = np.zeros_like(hot)
        for x1, y1, x2, y2 in face_boxes:            # scale face boxes from image pixels to mask pixels
            on_face[int(y1 * mh / h):int(np.ceil(y2 * mh / h)),
                    int(x1 * mw / w):int(np.ceil(x2 * mw / w))] = True
        overlap = float((hot & on_face).sum() / hot.sum())
    return area, peak, overlap


def build_evidence(quality: Quality, b1: Branch1Result, b2: Branch2Result,
                   upright_mask: Optional[np.ndarray], img_size: tuple[int, int]) -> dict:
    """All values the decision layer reads, with the names meta_classifier.feature_vector expects."""
    mask_area, mask_max, mask_face_overlap = mask_evidence(upright_mask, b1.face_boxes, img_size)
    return {
        # Gate 0
        "ai_ok": quality.ai_ok, "splice_ok": quality.splice_ok, "degrade": quality.degrade,
        # Branch 1
        "p_ai": b1.p_ai, "p_tile": b1.p_tile, "p_tile_max": b1.p_tile_max,
        "p_tile_std": b1.p_tile_std, "p_spatial": b1.p_spatial,
        "p_frequency": b1.p_frequency, "p_wavelet": b1.p_wavelet,
        "p_face": b1.p_face, "n_faces": b1.n_faces,
        # Branch 2
        "p_splice": b2.p_splice, "noise_inconsistency": b2.noise_inconsistency,
        "mask_area": mask_area, "mask_max": mask_max, "mask_face_overlap": mask_face_overlap,
    }
