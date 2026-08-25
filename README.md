# KILATIS: Dual-Branch Digital Image Forensics and Synthesis Detection System

![Project Status](https://img.shields.io/badge/Status-Thesis_Project-blue)
![Backend](https://img.shields.io/badge/Backend-FastAPI-009688)
![Frontend](https://img.shields.io/badge/Frontend-Next.js%2016%20%2B%20React%2019-black)
![Desktop](https://img.shields.io/badge/Desktop-Tauri%20v2%20%28Rust%29-24C8D8)
![AI Engine](https://img.shields.io/badge/AI%20Inference-PyTorch%20%2B%20TruFor-EE4C2C)
![Database](https://img.shields.io/badge/Database-PostgreSQL%20%28Neon%29-336791)

An integrated forensic image authentication platform engineered for multi-modal forgery detection, tamper localization, and automated forensic report generation.

---

## Abstract and Project Overview

The proliferation of generative adversarial networks (GANs), diffusion synthesis pipelines, and advanced digital editing tools has significantly degraded trust in digital image integrity. Traditional forensic methods often focus narrowly on either metadata analysis or handcrafted statistical anomalies, leaving them vulnerable to sophisticated AI synthesis and subtle compositing attacks.

KILATIS is a digital forensics system designed to detect, localize, and classify visual manipulations in questioned digital imagery. The system implements a dual-branch artificial intelligence architecture combined with a multi-gate evaluation matrix to evaluate authenticity across three canonical classifications:

- Authentic (unaltered digital capture)
- Spliced (localized insertion, compositing, or cut-and-paste manipulation)
- AI-Generated / Deepfake (synthetic whole-image generation or facial manipulation)

The platform is deployed as both a high-performance web interface and a native cross-platform desktop application via Tauri, offering real-time forensic inspection, dense anomaly heatmaps, and courtroom-ready forensic analysis reports.

---

## System Architecture

![KILATIS System Architecture](./docs/assets/kilatis_architecture.jpg)

The system is organized into four distinct architectural layers:

### 1. Client Presentation Tier
- Next.js and React User Interface: Structured case intake, batch evidence ingestion, drag-and-drop workspace, and interactive forensic inspection dashboard.
- Tauri Desktop Shell: Secure native desktop container executing with lightweight OS webviews, offline capability, and native OS file dialog integrations.
- Forensic Document Engine: Dynamic multi-page A4 document renderer powered by `@react-pdf/renderer` for standardized digital forensics documentation.

### 2. Application and Service Tier
- FastAPI REST Service: Asynchronous HTTP routing layer managing evidence dispatch, multi-threaded inference queues, and session persistence.
- Identity and Access Management: Role-based access control (Admin and Investigator roles) with JSON Web Token (JWT) authentication.
- Cloud Relational Persistence: Hosted Neon PostgreSQL database tracking case metadata, chronological audit logs, and historical analysis verdicts.

### 3. Dual-Branch Forensic Engine
- Branch 1 (AI and Deepfake Detection):
  - Spatial Stream: Convolutional feature extraction for texture and boundary inconsistencies.
  - Frequency Stream: Fast Fourier Transform (FFT) analysis to uncover spectral artifacts left by generative upsampling.
  - Wavelet Stream: Discrete Wavelet Transform (DWT) decomposition capturing high-frequency sub-band noise discrepancies.
  - Facial Region Extraction: OpenCV YuNet face detection module performing isolated facial crop analysis to isolate deepfake facial manipulations.
- Branch 2 (TruFor Splicing and Tamper Localization):
  - Noiseprint++ Sensor Noise Extraction: Physical photo-response non-uniformity (PRNU) residual analysis.
  - Transformer Feature Backbone: SegNeXt / MiT-B2 hierarchical vision transformer capturing long-range contextual discrepancies.
  - Dense Anomaly Decoder: Pixel-level segmentation decoder producing dense tampering probability maps without relying on coarse Grad-CAM gradients.

### 4. Decision Matrix and Output Generation
- Quality Gating: Evaluates resolution, format integrity, and noise adequacy before running compute pipelines.
- Multi-Axis Integration: Fuses global synthesis confidence scores with local anomaly probabilities.
- Heatmap Rendering: Generates a JET thermal colormap overlay blending localized tampering regions over the original image at 40% opacity.

---

## End-to-End Forensic Workflow

```
[Evidence Ingestion]
       │
       ▼
[Case Metadata Intake] ──> Case Number, Title, Investigator Identity, Case Notes
       │
       ▼
[Quality Gating] ─────────> Minimum resolution and compression artifact checks
       │
       ├─────────────────────────────────────────┐
       ▼                                         ▼
[Branch 1: AI / Deepfake]             [Branch 2: TruFor Splicing]
 ├─ YuNet Face Detection               ├─ Noiseprint++ Sensor Noise
 ├─ Spatial Feature Analysis           ├─ MiT-B2 Transformer Backbone
 ├─ FFT Frequency Decomposition        └─ Dense Anomaly Segmentation
 └─ DWT Wavelet Sub-bands                        │
       │                                         │
       └────────────────────┬────────────────────┘
                            │
                            ▼
               [4-Gate Evaluation Matrix]
                            │
       ┌────────────────────┼────────────────────┐
       ▼                    ▼                    ▼
[Authentic]             [Spliced]      [AI-Generated / Deepfake]
  (Green)                 (Red)                 (Rust)
                            │
                            ▼
              [Forensic JET Heatmap Overlay]
                            │
                            ▼
         [Interactive Results & Case Archival]
                            │
                            ▼
         [Automated PDF Export & Certification]
```

### Workflow Execution Stages

1. Case Intake: The investigator registers the case identifier, case title, examiner details, and evidence files.
2. Parallel Analysis: The backend runs multi-branch evaluation across GPU/CPU threads, analyzing physical sensor noise alongside frequency distributions.
3. Verification and Localization: For spliced imagery, the dense anomaly mask is rendered as a thermal localization heatmap.
4. Review and Certification: The investigator reviews the per-stream breakdown, inputs examiner conclusions, and exports a signed PDF report.
5. Case Completion: Session cleanup securely clears memory buffers and resets the workspace for subsequent intake operations.

---

## Technology Stack

### Backend and Machine Learning
- Programming Language: Python 3.10+
- Web Framework: FastAPI
- Machine Learning Framework: PyTorch, Torchvision, TIMM
- Computer Vision: OpenCV (cv2), Pillow, PyWavelets, NumPy, SciPy
- Object-Relational Mapping: SQLModel, SQLAlchemy, Alembic
- Database: PostgreSQL (Neon Cloud Platform)
- Environment and Package Management: UV, Pip

### Frontend and Desktop Client
- Core Framework: Next.js 16 (App Router), React 19
- Language: TypeScript
- Styling: Tailwind CSS, CSS Custom Properties
- PDF Generation: `@react-pdf/renderer`
- Desktop Application Framework: Tauri v2 (Rust 1.77+)
- State and Offline Storage: IndexedDB, SessionStorage

---

## Setup and Installation

### Prerequisites
- Node.js 20+ and npm
- Python 3.10+ (UV package manager recommended)
- Rust and Cargo 1.77+ (required for Tauri desktop build)
- PostgreSQL database instance

### 1. Backend Setup

```bash
cd backend
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uv pip install -r requirements.txt
```

Configure your environment variables in `backend/.env`:

```env
DATABASE_URL="postgresql://user:password@host/dbname"
SECRET_KEY="your-secret-key"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

Run the backend server:

```bash
uv run main.py
```

### 2. Frontend Web Setup

```bash
cd frontend
npm install
```

Configure your environment variables in `frontend/.env`:

```env
NEXT_PUBLIC_API_URL="http://127.0.0.1:8000"
```

Start the Next.js development server:

```bash
npm run dev
```

### 3. Tauri Desktop Application Setup

Run the desktop application in development mode:

```bash
cd frontend
npm run tauri dev
```

To compile a standalone production executable (`.exe`):

```bash
npm run tauri build
```

---

## License and Academic Notice

This project was developed as an academic thesis system for digital image forensics, anti-tampering verification, and generative AI detection. All analytical modules and report generators adhere to standard forensic documentation protocols.
