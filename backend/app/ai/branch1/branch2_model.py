"""
branch2_model.py
================
Paper-faithful Branch 2: three EfficientNet-B0 encoders (spatial / frequency /
wavelet) -> CDAF cross-domain fusion -> transformer backbone -> classifier,
with the full multi-task loss (3 per-stream aux CE + fusion KL + main CE).

Honest note on the "Swin" backbone
-----------------------------------
The fused representation is 64 tokens (8x8) x 256 dim. At that resolution Swin's
shifted windows (window >= grid) collapse to plain global attention, so we use a
compact pre-norm Transformer encoder as the backbone. It plays the exact role
the paper assigns Swin ("hierarchical global reasoning" over fused features) and
is far more robust than bending timm's fixed-resolution Swin onto a feature map.
If you specifically want timm Swin, feed it an image-shaped fused map instead;
ask and I'll wire that variant.

Deps: pip install timm
"""
from __future__ import annotations
import torch
import torch.nn as nn
import torch.nn.functional as F
import timm

D = 256          # unified embedding dim
N_CLASSES = 2    # authentic vs ai_generated


# ---------- per-stream EfficientNet encoder ---------------------------------
class StreamEncoder(nn.Module):
    def __init__(self, in_chans: int):
        super().__init__()
        # unpooled feature map: [B,1280,8,8] at 256 input
        self.net = timm.create_model("efficientnet_b0", pretrained=True,
                                     in_chans=in_chans, num_classes=0,
                                     global_pool="")
        self.proj = nn.Conv2d(1280, D, kernel_size=1)   # -> [B,256,8,8]

    def forward(self, x):
        f = self.net.forward_features(x)                # [B,1280,8,8]
        return self.proj(f)                             # [B,256,8,8]


# ---------- CDAF: spatial queries (freq + wavelet) --------------------------
class CDAF(nn.Module):
    def __init__(self, d=D):
        super().__init__()
        self.q = nn.Linear(d, d); self.k = nn.Linear(d, d); self.v = nn.Linear(d, d)
        self.gs = nn.Linear(d, d); self.gf = nn.Linear(d, d); self.gw = nn.Linear(d, d)
        self.d = d

    def forward(self, Fs, Ff, Fw):
        B, C, H, W = Fs.shape
        fs = Fs.flatten(2).transpose(1, 2)              # [B,64,256]
        ff = Ff.flatten(2).transpose(1, 2)
        fw = Fw.flatten(2).transpose(1, 2)
        kv = torch.cat([ff, fw], dim=1)                 # [B,128,256]
        Q, K, V = self.q(fs), self.k(kv), self.v(kv)
        attn = torch.softmax(Q @ K.transpose(1, 2) / self.d ** 0.5, dim=-1)  # [B,64,128]
        ctx = attn @ V                                  # [B,64,256]
        # sigmoid-gated fusion (paper eq.5), gate the three contributions
        gated = (torch.sigmoid(self.gs(fs)) * ctx
                 + torch.sigmoid(self.gf(ff)).mean(1, keepdim=True)
                 + torch.sigmoid(self.gw(fw)).mean(1, keepdim=True))
        return gated, attn                              # tokens [B,64,256], attn for KL


# ---------- transformer backbone (Swin stand-in at 8x8) ---------------------
class Block(nn.Module):
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
    def __init__(self, d=D, depth=4):
        super().__init__()
        self.cls = nn.Parameter(torch.zeros(1, 1, d))
        self.blocks = nn.ModuleList([Block(d) for _ in range(depth)])
        self.norm = nn.LayerNorm(d)

    def forward(self, tokens):                          # [B,64,256]
        B = tokens.size(0)
        x = torch.cat([self.cls.expand(B, -1, -1), tokens], dim=1)  # prepend CLS
        for blk in self.blocks:
            x = blk(x)
        return self.norm(x)[:, 0]                        # CLS -> [B,256]


# ---------- full model ------------------------------------------------------
class Branch2Net(nn.Module):
    def __init__(self):
        super().__init__()
        self.enc_s = StreamEncoder(4)    # spatial: RGB+Laplacian
        self.enc_f = StreamEncoder(3)    # frequency
        self.enc_w = StreamEncoder(4)    # wavelet subbands
        self.cdaf = CDAF()
        self.backbone = Backbone()
        self.head = nn.Linear(D, N_CLASSES)                     # main classifier
        # per-stream auxiliary heads (paper's L_spatial/freq/wavelet)
        self.aux_s = nn.Linear(D, N_CLASSES)
        self.aux_f = nn.Linear(D, N_CLASSES)
        self.aux_w = nn.Linear(D, N_CLASSES)

    def forward(self, spatial, frequency, wavelet):
        Fs, Ff, Fw = self.enc_s(spatial), self.enc_f(frequency), self.enc_w(wavelet)
        tokens, attn = self.cdaf(Fs, Ff, Fw)
        feat = self.backbone(tokens)
        out = {
            "main": self.head(feat),
            "aux_s": self.aux_s(Fs.mean(dim=(2, 3))),
            "aux_f": self.aux_f(Ff.mean(dim=(2, 3))),
            "aux_w": self.aux_w(Fw.mean(dim=(2, 3))),
            "attn": attn,
        }
        return out


# ---------- multi-task loss (paper eq., defaults from sec 4.2) --------------
class Branch2Loss(nn.Module):
    def __init__(self, l1=0.3, l2=0.3, l3=0.3, l4=0.2, l5=1.0, smooth=0.1):
        super().__init__()
        self.ce = nn.CrossEntropyLoss(label_smoothing=smooth)
        self.l1, self.l2, self.l3, self.l4, self.l5 = l1, l2, l3, l4, l5

    def forward(self, out, y):
        L_spatial = self.ce(out["aux_s"], y)
        L_freq    = self.ce(out["aux_f"], y)
        L_wavelet = self.ce(out["aux_w"], y)
        L_cls     = self.ce(out["main"], y)
        # L_fusion = KL(mean fusion attention || uniform)
        p = out["attn"].mean(dim=(0, 1))                # [128]
        p = p / (p.sum() + 1e-8)
        u = torch.full_like(p, 1.0 / p.numel())
        L_fusion = (p * (p.add(1e-8).log() - u.log())).sum()
        total = (self.l1 * L_spatial + self.l2 * L_freq + self.l3 * L_wavelet
                 + self.l4 * L_fusion + self.l5 * L_cls)
        return total, {"cls": L_cls.item(), "spatial": L_spatial.item(),
                       "freq": L_freq.item(), "wavelet": L_wavelet.item(),
                       "fusion": L_fusion.item()}


if __name__ == "__main__":
    m = Branch2Net()
    s = torch.randn(2, 4, 256, 256); f = torch.randn(2, 3, 256, 256); w = torch.randn(2, 4, 256, 256)
    o = m(s, f, w)
    loss, parts = Branch2Loss()(o, torch.tensor([0, 1]))
    print("main logits", tuple(o["main"].shape), "loss", round(loss.item(), 4), parts)
    n = sum(p.numel() for p in m.parameters()) / 1e6
    print(f"params: {n:.1f}M")
