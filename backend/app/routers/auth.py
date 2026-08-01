from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.database import get_session
from app.models.user import User, UserRole, UserRead, LoginRequest, Token, UserCreate
from app.core.security import verify_password, hash_password, create_access_token
from app.core.deps import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(payload: LoginRequest, session: Session = Depends(get_session)):
    """Authenticate user and return JWT access token."""
    statement = select(User).where(User.username == payload.username)
    user = session.exec(statement).first()
    
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    access_token = create_access_token(
        data={"sub": user.id, "username": user.username, "role": user.role}
    )
    
    user_read = UserRead.model_validate(user)
    return Token(access_token=access_token, token_type="bearer", user=user_read)

@router.get("/me", response_model=UserRead)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Fetch profile of currently authenticated user."""
    return current_user

@router.post("/seed-admin", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def seed_admin(payload: UserCreate, session: Session = Depends(get_session)):
    """
    Initial seed endpoint to create the root Admin account.
    Fails if an admin with the same username already exists.
    """
    existing_user = session.exec(select(User).where(User.username == payload.username)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User '{payload.username}' already exists"
        )
    
    admin_user = User(
        username=payload.username,
        password_hash=hash_password(payload.password),
        role=UserRole.ADMIN
    )
    
    session.add(admin_user)
    session.commit()
    session.refresh(admin_user)
    return admin_user
