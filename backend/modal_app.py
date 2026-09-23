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
        "numpy<2",
        "pillow",
        "pillow-heif",
        "timm",
        "PyWavelets",
        "scipy",
        "opencv-python-headless",
        "imdlbenco==0.1.45",
    )
    .add_local_dir("app", remote_path="/root/app")
    .add_local_file("main.py", remote_path="/root/main.py")
    .add_local_file(".env", remote_path="/root/.env")
)


@app.function(
    image=image,
    gpu="T4",
    scaledown_window=60,
    timeout=300,
)
@modal.asgi_app()
def fastapi_app():
    from main import app as existing_fastapi_app
    return existing_fastapi_app
