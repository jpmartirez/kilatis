
from __future__ import annotations

import cv2
import numpy as np
import pywt
from scipy.fft import dctn

TILE_SIZE = 256
IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], np.float32)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], np.float32)


def make_tiles(a: np.ndarray, tile: int = TILE_SIZE) -> list[np.ndarray]:
    """Cut an H x W x 3 image into tile x tile pieces that cover all of it.

    Small images are mirror-padded up to one tile. The last row / column of tiles
    is moved back so it ends exactly at the image edge (tiles may overlap a little).
    """
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


def spatial_stream(a: np.ndarray) -> np.ndarray:
    """[4, 256, 256]: ImageNet-normalised RGB + standardised Laplacian edge map."""
    rgb = (a.astype(np.float32) / 255.0 - IMAGENET_MEAN) / IMAGENET_STD
    gray = cv2.cvtColor(a, cv2.COLOR_RGB2GRAY).astype(np.float32)
    lap = cv2.Laplacian(gray, cv2.CV_32F, ksize=3)
    lap = (lap - lap.mean()) / (lap.std() + 1e-6)
    out = np.concatenate([rgb.transpose(2, 0, 1), lap[None]], axis=0)
    return out.astype(np.float32)


def _block_dct_channel(ch: np.ndarray) -> np.ndarray:
    """DCT of every 8x8 block of one colour channel, with the lowest frequencies removed."""
    b = ch.reshape(32, 8, 32, 8).transpose(0, 2, 1, 3)
    d = dctn(b, axes=(-2, -1), norm="ortho")
    d[..., :2, :2] = 0.0
    return d.transpose(0, 2, 1, 3).reshape(256, 256)


def frequency_stream(a: np.ndarray) -> np.ndarray:
    """[3, 256, 256]: per-channel block DCT, log-magnitude, standardised per channel."""
    chans = []
    for c in range(3):
        d = _block_dct_channel(a[:, :, c].astype(np.float32))
        d = np.log1p(np.abs(d))
        d = (d - d.mean()) / (d.std() + 1e-6)
        chans.append(d)
    return np.stack(chans, 0).astype(np.float32)


def wavelet_stream(a: np.ndarray) -> np.ndarray:
    """[4, 256, 256]: Haar wavelet sub-bands (LL, LH, HL, HH) of brightness, each resized to 256."""
    gray = cv2.cvtColor(a, cv2.COLOR_RGB2GRAY).astype(np.float32)
    LL, (LH, HL, HH) = pywt.dwt2(gray, "haar")
    subs = []
    for s in (LL, LH, HL, HH):
        s = cv2.resize(s, (TILE_SIZE, TILE_SIZE), interpolation=cv2.INTER_NEAREST)
        s = (s - s.mean()) / (s.std() + 1e-6)
        subs.append(s)
    return np.stack(subs, 0).astype(np.float32)
