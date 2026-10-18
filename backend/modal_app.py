import modal

app = modal.App("kilatis-backend")

image = (
    modal.Image.debian_slim(python_version="3.12")
    .apt_install("libgl1", "libglib2.0-0", "libcairo2-dev", "pkg-config", "build-essential")
    .pip_install(
        # Web & API
        "fastapi[standard]",
        "uvicorn",
        "python-multipart",
        # Database & Auth
        "sqlmodel",
        "psycopg[binary]",
        "pyjwt",
        "pwdlib[bcrypt]",
        "bcrypt",
        "python-dotenv",
        # PDF & Utilities
        "reportlab",
        "rich",
        "pyyaml",
        "pandas",
        "matplotlib",
        "svglib",
        "rlpycairo",
        # AI & Computer Vision Models
        "torch",
        "torchvision",
        "numpy>=2.5.2",
        "pillow",
        "pillow-heif",
        "timm",
        "PyWavelets",
        "scipy",
        "opencv-python-headless",
        # Learned decision layer (meta-classifier)
        "scikit-learn==1.9.0",  # MUST match the version used to save app/ai/weights/decider.joblib
        "joblib",
        # Runtime dependencies of IMDLBenCo / TruFor
        "albumentations>=2.0.8",
        "fvcore",
        "colorama",
    )
    # IMDLBenCo pins numpy<2 and albumentations==1.3.0; install it without its pins
    .pip_install("imdlbenco==0.1.45", extra_options="--no-deps")
    # albumentations checks PyPI for updates on every import (up to 2 s per cold start); turn it off
    .env({"NO_ALBUMENTATIONS_UPDATE": "1"})
    .add_local_dir("app", remote_path="/root/app")
    .add_local_file("main.py", remote_path="/root/main.py")
    .add_local_file(".env", remote_path="/root/.env")
)


# Normal (cost-saving) settings. For a defense or demo, keep a container warm WITHOUT
# redeploying:  uv run python scripts/defense_mode.py on   (and "off" afterwards).
# A new deploy resets the autoscaler back to these values.
@app.function(
    image=image,
    gpu="L4",
    scaledown_window=300,   # idle seconds before the GPU container shuts down (was 60)
    timeout=300,
)
# Let one container answer light requests (login, history, readiness) while an analysis runs,
# instead of starting a second GPU container. Analyses still run one at a time (orchestrator lock).
@modal.concurrent(max_inputs=8)
@modal.asgi_app()
def fastapi_app():
    import time
    started = time.time()
    from main import app as existing_fastapi_app
    print(f"[KILATIS] [TIMING] python imports: {time.time() - started:.2f}s")
    return existing_fastapi_app

# uv run modal deploy modal_app.py