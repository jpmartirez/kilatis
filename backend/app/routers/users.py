from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.database import get_session
from app.models.user import (
    User,
    UserRole,
    UserRead,
    InvestigatorCreate,
    InvestigatorResetPassword,
)
from app.core.security import hash_password
from app.core.deps import get_current_admin

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.post("/investigator", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_investigator(
    payload: InvestigatorCreate,
    current_admin: User = Depends(get_current_admin),
    session: Session = Depends(get_session)
):
    existing_user = session.exec(select(User).where(User.username == payload.username)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Username '{payload.username}' is already taken"
        )
    
    investigator = User(
        username=payload.username,
        password_hash=hash_password(payload.password),
        role=UserRole.INVESTIGATOR,
        created_by_id=current_admin.id
    )
    
    session.add(investigator)
    session.commit()
    session.refresh(investigator)
    
    return investigator

@router.get("/investigators", response_model=List[UserRead])
def list_my_investigators(
    current_admin: User = Depends(get_current_admin),
    session: Session = Depends(get_session)
):
    statement = select(User).where(
        User.role == UserRole.INVESTIGATOR,
        User.created_by_id == current_admin.id
    ).order_by(User.created_at.desc())
    investigators = session.exec(statement).all()
    return investigators

@router.put("/investigator/{user_id}/reset-password")
def reset_investigator_password(
    user_id: str,
    payload: InvestigatorResetPassword,
    current_admin: User = Depends(get_current_admin),
    session: Session = Depends(get_session)
):
    investigator = session.exec(
        select(User).where(
            User.id == user_id,
            User.role == UserRole.INVESTIGATOR,
            User.created_by_id == current_admin.id
        )
    ).first()

    if not investigator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investigator account not found"
        )
    
    if len(payload.new_password.strip()) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 4 characters long"
        )

    investigator.password_hash = hash_password(payload.new_password.strip())
    investigator.updated_at = datetime.now(timezone.utc)
    session.add(investigator)
    session.commit()
    return {"message": f"Password for {investigator.username} reset successfully"}

@router.delete("/investigator/{user_id}")
def delete_investigator(
    user_id: str,
    current_admin: User = Depends(get_current_admin),
    session: Session = Depends(get_session)
):
    investigator = session.exec(
        select(User).where(
            User.id == user_id,
            User.role == UserRole.INVESTIGATOR,
            User.created_by_id == current_admin.id
        )
    ).first()

    if not investigator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investigator account not found"
        )

    session.delete(investigator)
    session.commit()
    return {"message": f"Investigator account '{investigator.username}' deleted successfully"}

