from sqlmodel import create_engine, SQLModel, Session
from app.config import settings

# Fix postgres:// or postgresql:// URL prefix to use psycopg v3 dialect for Neon
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg://", 1)
elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)

# SQLite fallback compatibility for quick testing without live DB credentials
connect_args = {}
if "sqlite" in db_url:
    connect_args = {"check_same_thread": False}

engine = create_engine(
    db_url,
    echo=False,
    connect_args=connect_args,
    pool_pre_ping=True
)

def init_db():
    # Import all models so SQLModel.metadata is populated
    from app.models import User  # noqa: F401
    try:
        SQLModel.metadata.create_all(engine)
        print("Database tables initialized successfully.")
    except Exception as e:
        print(f"WARNING: Could not connect to database on startup ({e}). Will retry on API request.")

def get_session():
    with Session(engine) as session:
        yield session
