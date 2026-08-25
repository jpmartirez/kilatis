import uuid
from enum import Enum
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import SQLModel, Field

import sqlalchemy as sa

class UserRole(str, Enum):
    ADMIN = "admin"
    INVESTIGATOR = "investigator"

# Database Entity
class User(SQLModel, table=True):
    __tablename__ = "users"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True, index=True)
    username: str = Field(unique=True, index=True, nullable=False)
    password_hash: str = Field(nullable=False)
    role: UserRole = Field(
        default=UserRole.INVESTIGATOR,
        sa_type=sa.Enum(UserRole, name="Role", values_callable=lambda x: [e.value for e in x]),
        nullable=False
    )
    
    # Track which admin created this investigator account (for team management & future history tracking)
    created_by_id: Optional[str] = Field(default=None, foreign_key="users.id", nullable=True)
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)

# Schemas for API request & response
class UserCreate(SQLModel):
    username: str
    password: str
    role: UserRole = UserRole.INVESTIGATOR

class InvestigatorCreate(SQLModel):
    username: str
    password: str

class InvestigatorResetPassword(SQLModel):
    new_password: str


class UserRead(SQLModel):
    id: str
    username: str
    role: UserRole
    created_by_id: Optional[str] = None
    created_at: datetime

class LoginRequest(SQLModel):
    username: str
    password: str

class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
