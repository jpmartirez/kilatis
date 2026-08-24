import math
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select, func, col
import sqlalchemy as sa

from app.database import get_session
from app.models.user import User, UserRole
from app.models.session import (
    CaseSession,
    CaseSessionCreate,
    CaseSessionRead,
    PaginatedSessionsResponse,
)
from app.core.deps import get_current_user

router = APIRouter(prefix="/api/sessions", tags=["Case Sessions"])


@router.post("/save", response_model=CaseSessionRead, status_code=status.HTTP_201_CREATED)
def save_case_session(
    payload: CaseSessionCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Save an evaluated case session to history."""
    case_session = CaseSession(
        user_id=current_user.id,
        case_number=payload.case_number,
        case_title=payload.case_title,
        verdicts=payload.verdicts,
        total_images=payload.total_images,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    session.add(case_session)
    session.commit()
    session.refresh(case_session)
    return case_session


@router.get("/history", response_model=PaginatedSessionsResponse)
def get_session_history(
    search: Optional[str] = Query(None, description="Search across case number or case title"),
    verdict: Optional[str] = Query(None, description="Filter by verdict"),
    from_date: Optional[str] = Query(None, description="From timestamp (YYYY-MM-DD or ISO)"),
    to_date: Optional[str] = Query(None, description="To timestamp (YYYY-MM-DD or ISO)"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Fetch paginated history of case sessions for the authenticated user with search and filters."""
    # Base query filtered by user_id (or all for admin if desired, but user sees their cases)
    statement = select(CaseSession).where(CaseSession.user_id == current_user.id)

    # Search filter (case_number or case_title)
    if search and search.strip():
        term = f"%{search.strip()}%"
        statement = statement.where(
            sa.or_(
                col(CaseSession.case_number).ilike(term),
                col(CaseSession.case_title).ilike(term),
            )
        )

    # Date Range filter
    if from_date and from_date.strip():
        try:
            # Handle YYYY-MM-DD or ISO
            parsed_from = datetime.fromisoformat(from_date.strip().replace("Z", "+00:00"))
            if parsed_from.tzinfo is None:
                parsed_from = parsed_from.replace(tzinfo=timezone.utc)
            statement = statement.where(CaseSession.created_at >= parsed_from)
        except Exception:
            pass

    if to_date and to_date.strip():
        try:
            parsed_to = datetime.fromisoformat(to_date.strip().replace("Z", "+00:00"))
            if parsed_to.tzinfo is None:
                parsed_to = parsed_to.replace(tzinfo=timezone.utc)
            # If date only (midnight), extend to end of day
            if parsed_to.hour == 0 and parsed_to.minute == 0 and parsed_to.second == 0:
                parsed_to = parsed_to.replace(hour=23, minute=59, second=59)
            statement = statement.where(CaseSession.created_at <= parsed_to)
        except Exception:
            pass

    # Verdict filter (JSON array check)
    if verdict and verdict.strip() and verdict.strip().upper() != "ALL":
        target_v = verdict.strip().upper()
        # Cast JSON verdicts to text and search with ILIKE for database portability
        statement = statement.where(
            sa.cast(CaseSession.verdicts, sa.String).ilike(f"%{target_v}%")
        )

    # Count total matching rows
    count_statement = select(func.count()).select_from(statement.subquery())
    total = session.exec(count_statement).one()

    # Apply order by newest first and pagination
    statement = statement.order_by(col(CaseSession.created_at).desc())
    offset = (page - 1) * limit
    statement = statement.offset(offset).limit(limit)

    results = session.exec(statement).all()
    total_pages = math.ceil(total / limit) if total > 0 else 1

    return PaginatedSessionsResponse(
        items=[CaseSessionRead.model_validate(r) for r in results],
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
    )


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_case_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Delete a case session record."""
    statement = select(CaseSession).where(CaseSession.id == session_id)
    case_session = session.exec(statement).first()

    if not case_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case session not found"
        )

    if case_session.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this session"
        )

    session.delete(case_session)
    session.commit()
    return None
