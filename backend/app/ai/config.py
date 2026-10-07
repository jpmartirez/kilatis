"""
Where every model file lives, and which device (GPU or CPU) the models run on.

All paths are in one place so that moving a weight file only needs a change here.
"""
import os

import torch

AI_DIR = os.path.dirname(os.path.abspath(__file__))

# Branch 1 - AI / deepfake detector (our own tri-stream network)
BRANCH1_DIR = os.path.join(AI_DIR, "branch1")
BRANCH1_WEIGHTS = os.path.join(BRANCH1_DIR, "model", "best.pt")
FACE_DETECTOR_MODEL = os.path.join(BRANCH1_DIR, "face_detection_yunet.onnx")

# Branch 2 - splicing detector (TruFor, loaded through the IMDLBenCo library)
BRANCH2_DIR = os.path.join(AI_DIR, "branch2")
BRANCH2_WEIGHTS = os.path.join(BRANCH2_DIR, "weights", "best_generalized_det.pth")
BRANCH2_NOISEPRINT = os.path.join(BRANCH2_DIR, "construction", "noiseprint.pth")
BRANCH2_MIT_B2 = os.path.join(BRANCH2_DIR, "construction", "mit_b2.pth")
BRANCH2_CONFIG = os.path.join(BRANCH2_DIR, "construction", "trufor.yaml")

# Decision layer - the trained meta-classifier (scikit-learn, saved with joblib)
DECIDER_PATH = os.path.join(AI_DIR, "weights", "decider.joblib")


def get_device() -> str:
    """Use the GPU when one is available, otherwise the CPU."""
    return "cuda" if torch.cuda.is_available() else "cpu"
