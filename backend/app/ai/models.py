from __future__ import annotations
import torch
import torch.nn as nn
import torch.nn.functional as F

try:
    import timm
except ImportError:
    timm = None

EMBED_DIM = 256
NUM_CLASSES = 2


class StreamEncoder(nn.Module):
    def __init__(self, in_chans: int):
        super().__init__()
        if timm is None:
            raise ImportError("timm is not installed. Please install timm: uv add timm")
        self.net = timm.create_model(
            "efficientnet_b0",
            pretrained=True,
            in_chans=in_chans,
            num_classes=0,
            global_pool=""
        )
        self.proj = nn.Conv2d(1280, EMBED_DIM, kernel_size=1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        features = self.net.forward_features(x)
        return self.proj(features)


class CDAF(nn.Module):
    """Cross-Domain Attention Fusion for fusing Spatial, Frequency, and Wavelet streams."""
    def __init__(self, d: int = EMBED_DIM):
        super().__init__()
        self.q = nn.Linear(d, d)
        self.k = nn.Linear(d, d)
        self.v = nn.Linear(d, d)
        self.gs = nn.Linear(d, d)
        self.gf = nn.Linear(d, d)
        self.gw = nn.Linear(d, d)
        self.d = d

    def forward(self, Fs: torch.Tensor, Ff: torch.Tensor, Fw: torch.Tensor):
        fs = Fs.flatten(2).transpose(1, 2)
        ff = Ff.flatten(2).transpose(1, 2)
        fw = Fw.flatten(2).transpose(1, 2)
        kv = torch.cat([ff, fw], dim=1)

        Q, K, V = self.q(fs), self.k(kv), self.v(kv)
        attn = torch.softmax(Q @ K.transpose(1, 2) / (self.d ** 0.5), dim=-1)
        ctx = attn @ V

        gated = (
            torch.sigmoid(self.gs(fs)) * ctx
            + torch.sigmoid(self.gf(ff)).mean(1, keepdim=True)
            + torch.sigmoid(self.gw(fw)).mean(1, keepdim=True)
        )
        return gated, attn


class Block(nn.Module):
    def __init__(self, d: int = EMBED_DIM, heads: int = 8, mlp: int = 4):
        super().__init__()
        self.n1 = nn.LayerNorm(d)
        self.attn = nn.MultiheadAttention(d, heads, batch_first=True)
        self.n2 = nn.LayerNorm(d)
        self.mlp = nn.Sequential(
            nn.Linear(d, d * mlp),
            nn.GELU(),
            nn.Linear(d * mlp, d)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        h = self.n1(x)
        x = x + self.attn(h, h, h, need_weights=False)[0]
        return x + self.mlp(self.n2(x))


class Backbone(nn.Module):
    def __init__(self, d: int = EMBED_DIM, depth: int = 4):
        super().__init__()
        self.cls = nn.Parameter(torch.zeros(1, 1, d))
        self.blocks = nn.ModuleList([Block(d) for _ in range(depth)])
        self.norm = nn.LayerNorm(d)

    def forward(self, tokens: torch.Tensor) -> torch.Tensor:
        batch_size = tokens.size(0)
        x = torch.cat([self.cls.expand(batch_size, -1, -1), tokens], dim=1)
        for blk in self.blocks:
            x = blk(x)
        return self.norm(x)[:, 0]


class Branch2Net(nn.Module):
    """
    KILATIS Tri-Stream AI-Generated & Deepfake Detection Neural Network:
      - 3 EfficientNet-B0 encoders for Spatial, Frequency (Block-DCT), and Wavelet (DWT)
      - Cross-Domain Attention Fusion (CDAF)
      - Transformer Backbone
      - Classification Head
    """
    def __init__(self):
        super().__init__()
        self.enc_s = StreamEncoder(4)   # Spatial: RGB + Laplacian edge
        self.enc_f = StreamEncoder(3)   # Frequency: 3-channel Block-DCT
        self.enc_w = StreamEncoder(4)   # Wavelet: Haar DWT subbands (LL, LH, HL, HH)
        self.cdaf = CDAF()
        self.backbone = Backbone()
        self.head = nn.Linear(EMBED_DIM, NUM_CLASSES)

        self.aux_s = nn.Linear(EMBED_DIM, NUM_CLASSES)
        self.aux_f = nn.Linear(EMBED_DIM, NUM_CLASSES)
        self.aux_w = nn.Linear(EMBED_DIM, NUM_CLASSES)

    def forward(self, spatial: torch.Tensor, frequency: torch.Tensor, wavelet: torch.Tensor) -> dict:
        Fs = self.enc_s(spatial)
        Ff = self.enc_f(frequency)
        Fw = self.enc_w(wavelet)
        tokens, attn = self.cdaf(Fs, Ff, Fw)
        feat = self.backbone(tokens)
        return {
            "main": self.head(feat),
            "aux_s": self.aux_s(Fs.mean(dim=(2, 3))),
            "aux_f": self.aux_f(Ff.mean(dim=(2, 3))),
            "aux_w": self.aux_w(Fw.mean(dim=(2, 3))),
            "attn": attn,
        }
