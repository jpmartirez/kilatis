from sqlmodel import create_engine, SQLModel, Session
from app.config import settings

db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg://", 1)
elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)

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
    from app.models import User, CaseSession  # noqa: F401
    try:
        SQLModel.metadata.create_all(engine)
        # Ensure new optional fields exist on existing case_sessions table
        from sqlalchemy import text
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE case_sessions ADD COLUMN IF NOT EXISTS case_date VARCHAR(255);"))
            conn.execute(text("ALTER TABLE case_sessions ADD COLUMN IF NOT EXISTS case_time VARCHAR(255);"))
            conn.execute(text("ALTER TABLE case_sessions ADD COLUMN IF NOT EXISTS case_location VARCHAR(255);"))
        print("Database tables and columns initialized successfully.")
    except Exception as e:
        print(f"WARNING: Could not connect to database on startup ({e}). Will retry on API request.")

def get_session():
    with Session(engine) as session:
        yield session
