import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlmodel import SQLModel, Field
import sqlalchemy as sa


class CaseSession(SQLModel, table=True):
    __tablename__ = "case_sessions"

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        index=True
    )
    user_id: str = Field(
        foreign_key="users.id",
        index=True,
        nullable=False
    )
    case_number: str = Field(
        index=True,
        nullable=False
    )
    case_title: str = Field(
        nullable=False
    )
    case_date: Optional[str] = Field(
        default=None,
        nullable=True
    )
    case_time: Optional[str] = Field(
        default=None,
        nullable=True
    )
    case_location: Optional[str] = Field(
        default=None,
        nullable=True
    )
    verdicts: List[str] = Field(
        default_factory=list,
        sa_type=sa.JSON,
        nullable=False
    )
    total_images: int = Field(
        default=1,
        nullable=False
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        index=True,
        nullable=False
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False
    )


class CaseSessionCreate(SQLModel):
    case_number: Optional[str] = None
    case_title: str
    case_date: Optional[str] = None
    case_time: Optional[str] = None
    case_location: Optional[str] = None
    verdicts: List[str]
    total_images: int = 1


class CaseSessionRead(SQLModel):
    id: str
    user_id: str
    case_number: str
    case_title: str
    case_date: Optional[str] = None
    case_time: Optional[str] = None
    case_location: Optional[str] = None
    verdicts: List[str]
    total_images: int
    created_at: datetime
    updated_at: datetime


class PaginatedSessionsResponse(SQLModel):
    items: List[CaseSessionRead]
    total: int
    page: int
    limit: int
    total_pages: int
