
from __future__ import annotations
import numpy as np
import pandas as pd
import cv2
import pywt
from scipy.fft import dctn
import torch
from torch.utils.data import Dataset, DataLoader
from PIL import Image, ImageFile
ImageFile.LOAD_TRUNCATED_IMAGES = True
Image.MAX_IMAGE_PIXELS = None          
import io
from kilatis_labels import Cls, branch2_target

IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], np.float32)
IMAGENET_STD  = np.array([0.229, 0.224, 0.225], np.float32)
SIZE = 256

# how often laundering fires during training (per sample)
LAUNDER_PROB = 0.6


#  domain transforms (numpy, run in worker processes) 
def _to_256_rgb(path: str, train: bool, rng: np.random.Generator) -> np.ndarray:
    """Load -> HxWx3 uint8 -> 256x256 via crop (reflect-pad if small)."""
    img = Image.open(path).convert("RGB")
    a = np.asarray(img)
    h, w = a.shape[:2]
    if h < SIZE or w < SIZE:
        ph, pw = max(0, SIZE - h), max(0, SIZE - w)
        a = np.pad(a, ((0, ph), (0, pw), (0, 0)), mode="reflect")
        h, w = a.shape[:2]
    if train:
        y = int(rng.integers(0, h - SIZE + 1)); x = int(rng.integers(0, w - SIZE + 1))
    else:
        y = (h - SIZE) // 2; x = (w - SIZE) // 2
    return a[y:y + SIZE, x:x + SIZE, :]


def _launder(a: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    """Simulate real-world laundering (Messenger / web / screenshot):
    down/up resize + aggressive JPEG + occasional double compression.
    Applied to BOTH classes so it can't become a class tell."""
    out = a
    # 1) down/up resize (resampling loss, like a re-share)
    if rng.random() < 0.6:
        s = float(rng.uniform(0.5, 0.9))
        h, w = out.shape[:2]
        small = cv2.resize(out, (max(1, int(w*s)), max(1, int(h*s))), interpolation=cv2.INTER_AREA)
        out = cv2.resize(small, (w, h), interpolation=cv2.INTER_LINEAR)
    # 2) aggressive JPEG re-encode
    q = int(rng.integers(60, 91))
    ok, buf = cv2.imencode(".jpg", out[:, :, ::-1], [int(cv2.IMWRITE_JPEG_QUALITY), q])
    if ok:
        out = cv2.imdecode(buf, cv2.IMREAD_COLOR)[:, :, ::-1]
    # 3) occasional second compression (double-JPEG, like re-shared images)
    if rng.random() < 0.4:
        q2 = int(rng.integers(60, 91))
        ok, buf = cv2.imencode(".jpg", out[:, :, ::-1], [int(cv2.IMWRITE_JPEG_QUALITY), q2])
        if ok:
            out = cv2.imdecode(buf, cv2.IMREAD_COLOR)[:, :, ::-1]
    return np.ascontiguousarray(out)


def _spatial(a: np.ndarray) -> np.ndarray:
    """[4,256,256]: ImageNet-normed RGB + standardized Laplacian edge map."""
    rgb = (a.astype(np.float32) / 255.0 - IMAGENET_MEAN) / IMAGENET_STD
    gray = cv2.cvtColor(a, cv2.COLOR_RGB2GRAY).astype(np.float32)
    lap = cv2.Laplacian(gray, cv2.CV_32F, ksize=3)
    lap = (lap - lap.mean()) / (lap.std() + 1e-6)
    out = np.concatenate([rgb.transpose(2, 0, 1), lap[None]], axis=0)
    return out.astype(np.float32)


def _block_dct_channel(ch: np.ndarray) -> np.ndarray:
    b = ch.reshape(32, 8, 32, 8).transpose(0, 2, 1, 3)
    d = dctn(b, axes=(-2, -1), norm="ortho")
    d[..., :2, :2] = 0.0
    d = d.transpose(0, 2, 1, 3).reshape(256, 256)
    return d


def _frequency(a: np.ndarray) -> np.ndarray:
    """[3,256,256]: per-channel block DCT, log-magnitude, per-channel standardized."""
    chans = []
    for c in range(3):
        d = _block_dct_channel(a[:, :, c].astype(np.float32))
        d = np.log1p(np.abs(d))
        d = (d - d.mean()) / (d.std() + 1e-6)
        chans.append(d)
    return np.stack(chans, 0).astype(np.float32)


def _wavelet(a: np.ndarray) -> np.ndarray:
    """[4,256,256]: Haar DWT subbands on luminance, each upsampled to 256."""
    gray = cv2.cvtColor(a, cv2.COLOR_RGB2GRAY).astype(np.float32)
    LL, (LH, HL, HH) = pywt.dwt2(gray, "haar")
    subs = []
    for s in (LL, LH, HL, HH):
        s = cv2.resize(s, (SIZE, SIZE), interpolation=cv2.INTER_NEAREST)
        s = (s - s.mean()) / (s.std() + 1e-6)
        subs.append(s)
    return np.stack(subs, 0).astype(np.float32)


#  Dataset 
class Branch2Dataset(Dataset):
    def __init__(self, csv_path: str, train: bool = True, launder: bool = True):
        self.df = pd.read_csv(csv_path)
        assert {"path", "label_id"} <= set(self.df.columns), \
            "CSV needs path,label_id (run the folder-prep which adds label_id)"
        self.train = train
        self.launder = launder and train

    def __len__(self):
        return len(self.df)

    def __getitem__(self, i):
        row = self.df.iloc[i]
        rng = np.random.default_rng()
        a = _to_256_rgb(row["path"], self.train, rng)
        if self.train:
            if rng.random() < 0.5:                       # hflip
                a = a[:, ::-1, :].copy()
            if self.launder and rng.random() < LAUNDER_PROB:
                a = _launder(a, rng)                      # equal to both classes
        y = branch2_target(Cls(int(row["label_id"])))
        return {
            "spatial":   torch.from_numpy(_spatial(a)),
            "frequency": torch.from_numpy(_frequency(a)),
            "wavelet":   torch.from_numpy(_wavelet(a)),
            "label":     torch.tensor(y, dtype=torch.long),
        }


def make_loader(csv_path: str, batch: int, train: bool,
                workers: int = 2, launder: bool = True,
                balance: bool = False) -> DataLoader:
    ds = Branch2Dataset(csv_path, train=train, launder=launder)
    sampler = None
    if train and balance:
        y = pd.read_csv(csv_path)["label_id"].map(
            lambda v: branch2_target(Cls(int(v)))).to_numpy()
        counts = np.bincount(y, minlength=2).astype(np.float64)
        weights = (1.0 / np.maximum(counts, 1))[y]
        sampler = torch.utils.data.WeightedRandomSampler(
            torch.as_tensor(weights, dtype=torch.double), len(weights), replacement=True)
        print(f"[loader] class counts {counts.tolist()} -> balanced sampler on")
    return DataLoader(ds, batch_size=batch,
                      shuffle=(train and sampler is None), sampler=sampler,
                      num_workers=workers, pin_memory=True,
                      drop_last=train, persistent_workers=workers > 0)


if __name__ == "__main__":
    dl = make_loader("splits/branch2_val.csv",
                     batch=4, train=False, workers=0)
    b = next(iter(dl))
    for k in ("spatial", "frequency", "wavelet"):
        print(k, tuple(b[k].shape))
    print("labels", b["label"].tolist())
