"""
Finding faces, so Branch 1 can also check the face area on its own.

A deepfake often changes only the face. On a large photo the face is a small part
of the whole picture, so its signal can get lost in the average over all tiles.
Checking face crops separately fixes that.
"""
from __future__ import annotations

import os

import cv2
import numpy as np

from app.ai.config import FACE_DETECTOR_MODEL

Box = tuple[int, int, int, int]   # (x1, y1, x2, y2) in pixels


def find_faces(img: np.ndarray, margin: float = 0.15) -> tuple[list[np.ndarray], list[Box]]:
    """Detect faces with OpenCV's YuNet model.

    Returns (face crops, face boxes). Each box is widened by `margin` on every side
    so the crop also includes the face edges, where blending marks often appear.
    Returns two empty lists when no face is found or the detector cannot run.
    """
    crops: list[np.ndarray] = []
    boxes: list[Box] = []
    try:
        arr = np.ascontiguousarray(img, dtype=np.uint8)
        h_img, w_img = arr.shape[:2]

        if not os.path.isfile(FACE_DETECTOR_MODEL):
            print(f"[FACE] YuNet model not found at {FACE_DETECTOR_MODEL}")
            return crops, boxes

        detector = cv2.FaceDetectorYN.create(
            FACE_DETECTOR_MODEL, "", (w_img, h_img),
            score_threshold=0.5, nms_threshold=0.3, top_k=10
        )
        _, faces = detector.detect(arr)
        if faces is None or len(faces) == 0:
            return crops, boxes

        for f in faces:
            x, y, fw, fh = int(f[0]), int(f[1]), int(f[2]), int(f[3])
            conf = float(f[14]) if len(f) > 14 else float(f[-1])
            if conf < 0.5:                                   # weak detection
                continue
            aspect_ratio = fw / float(fh) if fh > 0 else 0
            if aspect_ratio < 0.5 or aspect_ratio > 2.0:     # not face-shaped
                continue

            mx, my = int(fw * margin), int(fh * margin)
            x1, y1 = max(0, x - mx), max(0, y - my)
            x2, y2 = min(w_img, x + fw + mx), min(h_img, y + fh + my)

            crop = arr[y1:y2, x1:x2, :]
            if crop.size > 0:
                crops.append(crop)
                boxes.append((x1, y1, x2, y2))

        print(f"[FACE] Detected {len(crops)} face(s) in {w_img}x{h_img} image")
        return crops, boxes
    except Exception as e:
        print(f"[FACE] Error: {e}")
        return [], []
