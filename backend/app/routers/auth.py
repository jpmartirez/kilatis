from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.database import get_session
from app.models.user import User, UserRead, LoginRequest, Token
from app.core.security import verify_password, create_access_token
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

