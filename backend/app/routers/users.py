from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.database import get_session
from app.models.user import User, UserRole, UserRead, InvestigatorCreate
from app.core.security import hash_password
from app.core.deps import get_current_admin

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.post("/investigator", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_investigator(
    payload: InvestigatorCreate,
    current_admin: User = Depends(get_current_admin),
    session: Session = Depends(get_session)
):
   
    # Check if username is already taken
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
    """
    Admin-only endpoint: Returns all investigator accounts created by the logged-in admin.
    """
    statement = select(User).where(
        User.role == UserRole.INVESTIGATOR,
        User.created_by_id == current_admin.id
    )
    investigators = session.exec(statement).all()
    return investigators
