"""
kilatis_labels.py
=================
THE canonical label taxonomy for the KILATIS multi-forgery pipeline.

Lock this first. Every dataset-prep script, every branch, and the fusion head
imports its class names and the boundary rule from HERE — so the definition
lives in exactly one place and cannot silently drift.

The single most important rule (build spec 4.4):
    - ai_generated  = the WHOLE image was synthesized (GAN / diffusion).
    - deepfake      = a manipulated FACE inside an otherwise real photo.
A face-swap is ALWAYS 'deepfake', NEVER 'ai_generated'. This is enforced by
resolve_final_label() below so a mislabel is impossible if you route through it.
"""

from __future__ import annotations
from enum import IntEnum


# --------------------------------------------------------------------------- #
# 1. The canonical classes (the fusion head's output space)
# --------------------------------------------------------------------------- #
class Cls(IntEnum):
    AUTHENTIC   = 0
    SPLICED     = 1   # region pasted from a different image
    COPYMOVE    = 2   # region cloned from within the same image
    INPAINTED   = 3   # region removed/filled (incl. AI inpainting of a real photo)
    AI_GENERATED = 4  # entire image synthesized
    DEEPFAKE    = 5   # face-swap / reenactment on a real photo


ID_TO_NAME = {c.value: c.name.lower() for c in Cls}
NAME_TO_ID = {v: k for k, v in ID_TO_NAME.items()}

# Which classes each branch is responsible for producing evidence about.
BRANCH1_CLASSES = {Cls.AUTHENTIC, Cls.SPLICED, Cls.COPYMOVE, Cls.INPAINTED}  # + mask
BRANCH2_CLASSES = {Cls.AUTHENTIC, Cls.AI_GENERATED}                          # whole-synthetic
BRANCH3_CLASSES = {Cls.AUTHENTIC, Cls.DEEPFAKE}                              # manipulated face

# Classes that carry a pixel-level ground-truth mask (Branch 1 supervision).
MASK_CLASSES = {Cls.SPLICED, Cls.COPYMOVE, Cls.INPAINTED}


# --------------------------------------------------------------------------- #
# 2. The boundary rule — resolve a final label from raw evidence
# --------------------------------------------------------------------------- #
def resolve_final_label(
    *,
    whole_image_synthetic: bool,
    face_manipulated: bool,
    edit_type: str | None = None,
) -> Cls:
    """
    Turn raw dataset facts into ONE canonical label, enforcing the
    ai_generated vs deepfake boundary so it can never be mislabeled.

    Args:
        whole_image_synthetic: the entire image was generated (GAN/diffusion).
        face_manipulated:      a face region was swapped/reenacted on a real photo.
        edit_type:             one of {'spliced','copymove','inpainted'} for
                               classic edits, else None.

    Priority (most specific wins):
        face swap  ->  DEEPFAKE       (even though a face-swap is 'AI', it is
                                       NOT whole-image synthesis)
        whole synth->  AI_GENERATED
        edit       ->  SPLICED/COPYMOVE/INPAINTED
        otherwise  ->  AUTHENTIC
    """
    if face_manipulated:
        return Cls.DEEPFAKE
    if whole_image_synthetic:
        return Cls.AI_GENERATED
    if edit_type is not None:
        key = edit_type.strip().lower()
        if key not in NAME_TO_ID:
            raise ValueError(f"unknown edit_type {edit_type!r}; "
                             f"expected one of spliced/copymove/inpainted")
        cls = Cls(NAME_TO_ID[key])
        if cls not in MASK_CLASSES:
            raise ValueError(f"{key!r} is not a classic-edit class")
        return cls
    return Cls.AUTHENTIC


# --------------------------------------------------------------------------- #
# 3. Per-branch binary target derivation (used when training each branch)
# --------------------------------------------------------------------------- #
def branch1_target(final: Cls) -> int:
    """1 if this sample is a classic edit Branch 1 should localize, else 0."""
    return int(final in MASK_CLASSES)


def branch2_target(final: Cls) -> int:
    """1 if whole-image AI. NOTE: deepfakes are 0 here — they belong to B3."""
    return int(final == Cls.AI_GENERATED)


def branch3_target(final: Cls) -> int:
    """1 if face-swap deepfake, else 0."""
    return int(final == Cls.DEEPFAKE)


# --------------------------------------------------------------------------- #
# 4. Self-check — run `python kilatis_labels.py` to verify the boundary holds
# --------------------------------------------------------------------------- #
if __name__ == "__main__":
    # a face-swap must resolve to DEEPFAKE, never AI_GENERATED
    fs = resolve_final_label(whole_image_synthetic=True, face_manipulated=True)
    assert fs is Cls.DEEPFAKE, "boundary violated: face-swap leaked into AI"
    assert branch2_target(fs) == 0, "deepfake must be negative for Branch 2"
    assert branch3_target(fs) == 1, "deepfake must be positive for Branch 3"

    # a fully generated landscape (no face) must be AI_GENERATED
    ai = resolve_final_label(whole_image_synthetic=True, face_manipulated=False)
    assert ai is Cls.AI_GENERATED

    # a spliced real photo
    sp = resolve_final_label(whole_image_synthetic=False, face_manipulated=False,
                             edit_type="spliced")
    assert sp is Cls.SPLICED and branch1_target(sp) == 1

    # clean photo
    au = resolve_final_label(whole_image_synthetic=False, face_manipulated=False)
    assert au is Cls.AUTHENTIC

    print("labels OK:", ID_TO_NAME)
    print("boundary rule verified: face-swap -> DEEPFAKE, whole-synth -> AI_GENERATED")
