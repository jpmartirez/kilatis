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
from app.core.deps import get_current_user, get_current_admin

router = APIRouter(prefix="/api/sessions", tags=["Case Sessions"])


def categorize_verdict(verdict: str) -> str:
    """Categorize forensic verdict string into standard summary buckets."""
    v = (verdict or "").strip().upper()
    if "AI" in v and "SPLIC" in v:
        return "ai_spliced"
    if "SPLIC" in v:
        return "spliced"
    if "AI" in v or "DEEPFAKE" in v or "SYNTHETIC" in v:
        return "ai_generated"
    if "MANUAL" in v or "REVIEW" in v:
        return "manual_review"
    if "AUTH" in v:
        return "authentic"
    return "manual_review"


@router.get("/stats/monthly")
def get_monthly_verdict_stats(
    month: Optional[str] = Query(None, description="Optional YYYY-MM filter"),
    current_admin: User = Depends(get_current_admin),
    session: Session = Depends(get_session),
):
    """
    Returns monthly aggregated verdict statistics for the admin dashboard.
    Enables tracking of verdicts per month and across custom month filters.
    """
    statement = select(CaseSession).order_by(col(CaseSession.created_at).desc())
    all_sessions = session.exec(statement).all()

    months_map: dict[str, dict] = {}
    current_m_key = datetime.now(timezone.utc).strftime("%Y-%m")
    current_m_label = datetime.now(timezone.utc).strftime("%B %Y")

    # Seed current month so the UI always has at least the current month baseline
    months_map[current_m_key] = {
        "month": current_m_key,
        "month_label": current_m_label,
        "total_cases": 0,
        "total_images": 0,
        "authentic": 0,
        "spliced": 0,
        "ai_generated": 0,
        "ai_spliced": 0,
        "manual_review": 0,
    }

    for s in all_sessions:
        if not s.created_at:
            continue
        m_key = s.created_at.strftime("%Y-%m")
        if m_key not in months_map:
            months_map[m_key] = {
                "month": m_key,
                "month_label": s.created_at.strftime("%B %Y"),
                "total_cases": 0,
                "total_images": 0,
                "authentic": 0,
                "spliced": 0,
                "ai_generated": 0,
                "ai_spliced": 0,
                "manual_review": 0,
            }

        m_stat = months_map[m_key]
        m_stat["total_cases"] += 1
        m_stat["total_images"] += (s.total_images or 1)

        v_list = s.verdicts if isinstance(s.verdicts, list) else []
        for v in v_list:
            cat = categorize_verdict(str(v))
            if cat in m_stat:
                m_stat[cat] += 1

    sorted_months = sorted(months_map.keys(), reverse=True)
    monthly_breakdown = [months_map[k] for k in sorted_months]

    # Filter by specific month if requested
    selected_month = month.strip() if month and month.strip() in months_map else None

    if selected_month and selected_month in months_map:
        target = months_map[selected_month]
        summary = {
            "total_cases": target["total_cases"],
            "total_images": target["total_images"],
            "authentic": target["authentic"],
            "spliced": target["spliced"],
            "ai_generated": target["ai_generated"],
            "ai_spliced": target["ai_spliced"],
            "manual_review": target["manual_review"],
        }
    else:
        summary = {
            "total_cases": sum(m["total_cases"] for m in monthly_breakdown),
            "total_images": sum(m["total_images"] for m in monthly_breakdown),
            "authentic": sum(m["authentic"] for m in monthly_breakdown),
            "spliced": sum(m["spliced"] for m in monthly_breakdown),
            "ai_generated": sum(m["ai_generated"] for m in monthly_breakdown),
            "ai_spliced": sum(m["ai_spliced"] for m in monthly_breakdown),
            "manual_review": sum(m["manual_review"] for m in monthly_breakdown),
        }

    return {
        "available_months": sorted_months,
        "selected_month": selected_month,
        "summary": summary,
        "monthly_breakdown": monthly_breakdown,
    }



def generate_next_case_number_util(session: Session) -> str:
    """
    Automated sequential case number generator for KILATIS digital image forensics.
    Format: KIL-YYYY-XXXX (e.g. KIL-2026-0001)
    """
    year = datetime.now(timezone.utc).year
    prefix = f"KIL-{year}-"

    # Query existing case numbers with current year prefix
    statement = select(CaseSession.case_number).where(
        col(CaseSession.case_number).startswith(prefix)
    )
    existing_numbers = set(session.exec(statement).all())

    # Find the next available sequential index
    index = len(existing_numbers) + 1
    candidate = f"{prefix}{index:04d}"
    while candidate in existing_numbers:
        index += 1
        candidate = f"{prefix}{index:04d}"

    return candidate


@router.get("/next-case-number")
def get_next_case_number(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Fetch the next automated sequential case number for the current calendar year."""
    return {"case_number": generate_next_case_number_util(session)}


@router.post("/save", response_model=CaseSessionRead, status_code=status.HTTP_201_CREATED)
def save_case_session(
    payload: CaseSessionCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Save an evaluated case session to history. Automates case_number if empty."""
    case_num = (payload.case_number or "").strip()
    if not case_num:
        case_num = generate_next_case_number_util(session)

    case_session = CaseSession(
        user_id=current_user.id,
        case_number=case_num,
        case_title=payload.case_title,
        case_date=payload.case_date,
        case_time=payload.case_time,
        case_location=payload.case_location,
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
