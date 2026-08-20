from __future__ import annotations
import os
import numpy as np
import cv2

try:
    import pywt
except ImportError:
    pywt = None

try:
    from scipy.fft import dctn
except ImportError:
    dctn = None

IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], np.float32)
IMAGENET_STD  = np.array([0.229, 0.224, 0.225], np.float32)
TILE_SIZE = 256

_FACE_CASCADE = None

def get_face_cascade():
    global _FACE_CASCADE
    if _FACE_CASCADE is None:
        try:
            cascade_cls = getattr(cv2, "CascadeClassifier", None)
            if cascade_cls is None:
                objdetect = getattr(cv2, "objdetect", None)
                if objdetect is not None:
                    cascade_cls = getattr(objdetect, "CascadeClassifier", None)

            if cascade_cls is not None:
                data_mod = getattr(cv2, "data", None)
                haarcascades = getattr(data_mod, "haarcascades", "") if data_mod else ""
                xml_path = os.path.join(haarcascades, "haarcascade_frontalface_default.xml")
                if os.path.isfile(xml_path):
                    _FACE_CASCADE = cascade_cls(xml_path)
        except Exception:
            _FACE_CASCADE = None
    return _FACE_CASCADE


def spatial_transform(a: np.ndarray) -> np.ndarray:
    """[4, 256, 256]: ImageNet-normalized RGB + standardized 2nd-derivative Laplacian edge map."""
    arr = np.ascontiguousarray(a, dtype=np.uint8)
    rgb = (arr.astype(np.float32) / 255.0 - IMAGENET_MEAN) / IMAGENET_STD
    gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY).astype(np.float32)
    lap = cv2.Laplacian(gray, cv2.CV_32F, ksize=3)
    lap = (lap - lap.mean()) / (lap.std() + 1e-6)
    out = np.concatenate([rgb.transpose(2, 0, 1), lap[None]], axis=0)
    return out.astype(np.float32)


def _block_dct_channel(ch: np.ndarray) -> np.ndarray:
    if dctn is None:
        raise ImportError("scipy is required for frequency transform. Run: uv add scipy")
    b = ch.reshape(32, 8, 32, 8).transpose(0, 2, 1, 3)
    d = dctn(b, axes=(-2, -1), norm="ortho")
    d[..., :2, :2] = 0.0
    d = d.transpose(0, 2, 1, 3).reshape(256, 256)
    return d


def frequency_transform(a: np.ndarray) -> np.ndarray:
    """[3, 256, 256]: 8x8 block-DCT log-magnitude, standardized per color channel."""
    arr = np.ascontiguousarray(a, dtype=np.uint8)
    channels = []
    for c in range(3):
        d = _block_dct_channel(arr[:, :, c].astype(np.float32))
        d = np.log1p(np.abs(d))
        d = (d - d.mean()) / (d.std() + 1e-6)
        channels.append(d)
    return np.stack(channels, 0).astype(np.float32)


def wavelet_transform(a: np.ndarray) -> np.ndarray:
    """[4, 256, 256]: 2D Haar Wavelet Decomposition (LL, LH, HL, HH subbands)."""
    if pywt is None:
        raise ImportError("PyWavelets is required for wavelet transform. Run: uv add pywavelets")
    arr = np.ascontiguousarray(a, dtype=np.uint8)
    gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY).astype(np.float32)
    LL, (LH, HL, HH) = pywt.dwt2(gray, "haar")
    subbands = []
    for s in (LL, LH, HL, HH):
        s = cv2.resize(s, (TILE_SIZE, TILE_SIZE), interpolation=cv2.INTER_NEAREST)
        s = (s - s.mean()) / (s.std() + 1e-6)
        subbands.append(s)
    return np.stack(subbands, 0).astype(np.float32)


def extract_face_crops(img_np: np.ndarray, margin: float = 0.15) -> list[np.ndarray]:
    """
    Detects facial regions with false-positive filtering and 15% boundary margin.
    """
    try:
        arr = np.ascontiguousarray(img_np, dtype=np.uint8)
        h_img, w_img = arr.shape[:2]

        face_cascade = get_face_cascade()
        if face_cascade is None:
            return []

        empty_fn = getattr(face_cascade, "empty", None)
        if empty_fn and empty_fn():
            return []

        gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)
        min_dim = max(100, int(min(h_img, w_img) * 0.12))

        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=8,
            minSize=(min_dim, min_dim)
        )

        if len(faces) == 0:
            return []

        crops = []
        for (x, y, w, h) in faces:
            aspect_ratio = w / float(h)
            if aspect_ratio < 0.75 or aspect_ratio > 1.35:
                continue

            mx = int(w * margin)
            my = int(h * margin)
            x1 = max(0, x - mx)
            y1 = max(0, y - my)
            x2 = min(w_img, x + w + mx)
            y2 = min(h_img, y + h + my)
            crops.append(arr[y1:y2, x1:x2, :])
        return crops
    except Exception:
        return []


def tiles_of(a: np.ndarray) -> list[np.ndarray]:
    """Slices image into native-resolution 256x256 patches with reflect-padding if undersized."""
    arr = np.ascontiguousarray(a, dtype=np.uint8)
    h, w = arr.shape[:2]
    if h < TILE_SIZE or w < TILE_SIZE:
        arr = np.pad(
            arr,
            ((0, max(0, TILE_SIZE - h)), (0, max(0, TILE_SIZE - w)), (0, 0)),
            mode="reflect"
        )
        h, w = arr.shape[:2]

    ys = list(range(0, h - TILE_SIZE + 1, TILE_SIZE)) or [0]
    xs = list(range(0, w - TILE_SIZE + 1, TILE_SIZE)) or [0]
    if ys[-1] != h - TILE_SIZE:
        ys.append(h - TILE_SIZE)
    if xs[-1] != w - TILE_SIZE:
        xs.append(w - TILE_SIZE)

    return [arr[y:y + TILE_SIZE, x:x + TILE_SIZE, :] for y in ys for x in xs]
