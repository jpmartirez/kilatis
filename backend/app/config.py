import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "Kilatis API"
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://neondb_owner:npg_secret@ep-cool-site-a5xyz.us-east-2.aws.neon.tech/neondb?sslmode=require"
    )
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "super-secret-jwt-key-kilatis-2026-change-in-prod")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")) # 24 hours

settings = Settings()
