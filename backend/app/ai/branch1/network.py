"""
Branch 1 neural network: the tri-stream AI / deepfake detector.

Three EfficientNet-B0 encoders read three views of the same 256x256 tile
(spatial, frequency, wavelet). A cross-domain attention block (CDAF) mixes them,
a small transformer reads the mixed tokens, and a linear head gives 2 classes:
index 0 = real, index 1 = AI-generated.

The training kit calls this class "Branch2Net" (there the AI detector was the
second branch). Only the class name is different here; the layers and their
names are the same, so the trained weights in branch1/model/best.pt load as-is.
"""
from __future__ import annotations

import timm
import torch
import torch.nn as nn

D = 256          # width of every token / feature vector
N_CLASSES = 2    # real vs AI-generated


class StreamEncoder(nn.Module):
    """EfficientNet-B0 feature extractor for one stream, projected to D channels."""

    def __init__(self, in_chans: int):
        super().__init__()
        # pretrained=False: every weight is replaced by best.pt right after building,
        # so downloading the ImageNet weights at startup would be wasted work.
        self.net = timm.create_model("efficientnet_b0", pretrained=False,
                                     in_chans=in_chans, num_classes=0,
                                     global_pool="")
        self.proj = nn.Conv2d(1280, D, kernel_size=1)

    def forward(self, x):
        return self.proj(self.net.forward_features(x))   # [B, D, 8, 8]


class CDAF(nn.Module):
    """Cross-domain attention fusion: spatial tokens ask questions to the frequency + wavelet tokens."""

    def __init__(self, d=D):
        super().__init__()
        self.q = nn.Linear(d, d); self.k = nn.Linear(d, d); self.v = nn.Linear(d, d)
        self.gs = nn.Linear(d, d); self.gf = nn.Linear(d, d); self.gw = nn.Linear(d, d)
        self.d = d

    def forward(self, Fs, Ff, Fw):
        fs = Fs.flatten(2).transpose(1, 2)               # [B, 64, D]
        ff = Ff.flatten(2).transpose(1, 2)
        fw = Fw.flatten(2).transpose(1, 2)
        kv = torch.cat([ff, fw], dim=1)
        Q, K, V = self.q(fs), self.k(kv), self.v(kv)
        attn = torch.softmax(Q @ K.transpose(1, 2) / self.d ** 0.5, dim=-1)
        ctx = attn @ V
        gated = (torch.sigmoid(self.gs(fs)) * ctx
                 + torch.sigmoid(self.gf(ff)).mean(1, keepdim=True)
                 + torch.sigmoid(self.gw(fw)).mean(1, keepdim=True))
        return gated, attn


class Block(nn.Module):
    """One transformer block (attention + MLP)."""

    def __init__(self, d=D, heads=8, mlp=4):
        super().__init__()
        self.n1 = nn.LayerNorm(d)
        self.attn = nn.MultiheadAttention(d, heads, batch_first=True)
        self.n2 = nn.LayerNorm(d)
        self.mlp = nn.Sequential(nn.Linear(d, d * mlp), nn.GELU(), nn.Linear(d * mlp, d))

    def forward(self, x):
        h = self.n1(x); x = x + self.attn(h, h, h, need_weights=False)[0]
        return x + self.mlp(self.n2(x))


class Backbone(nn.Module):
    """Small transformer over the fused tokens; returns the [CLS] summary vector."""

    def __init__(self, d=D, depth=4):
        super().__init__()
        self.cls = nn.Parameter(torch.zeros(1, 1, d))
        self.blocks = nn.ModuleList([Block(d) for _ in range(depth)])
        self.norm = nn.LayerNorm(d)

    def forward(self, tokens):
        B = tokens.size(0)
        x = torch.cat([self.cls.expand(B, -1, -1), tokens], dim=1)
        for blk in self.blocks:
            x = blk(x)
        return self.norm(x)[:, 0]


class Branch1Net(nn.Module):
    """Full Branch 1 model. Returns logits for the fused head and for each stream on its own."""

    def __init__(self):
        super().__init__()
        self.enc_s = StreamEncoder(4)    # spatial: RGB + Laplacian edges
        self.enc_f = StreamEncoder(3)    # frequency: block DCT
        self.enc_w = StreamEncoder(4)    # wavelet: Haar sub-bands
        self.cdaf = CDAF()
        self.backbone = Backbone()
        self.head = nn.Linear(D, N_CLASSES)   # main (fused) classifier
        self.aux_s = nn.Linear(D, N_CLASSES)  # spatial stream alone
        self.aux_f = nn.Linear(D, N_CLASSES)  # frequency stream alone
        self.aux_w = nn.Linear(D, N_CLASSES)  # wavelet stream alone

    def forward(self, spatial, frequency, wavelet):
        Fs, Ff, Fw = self.enc_s(spatial), self.enc_f(frequency), self.enc_w(wavelet)
        tokens, attn = self.cdaf(Fs, Ff, Fw)
        feat = self.backbone(tokens)
        return {
            "main": self.head(feat),
            "aux_s": self.aux_s(Fs.mean(dim=(2, 3))),
            "aux_f": self.aux_f(Ff.mean(dim=(2, 3))),
            "aux_w": self.aux_w(Fw.mean(dim=(2, 3))),
            "attn": attn,
        }
