from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.auth import UserCreate, UserLogin, Token
from app.schemas.user import UserResponse
from app.services.auth_service import (
    authenticate_user,
    create_user_token,
    register_user,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)

# Register
@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new trainer account.
    """
    try:
        return register_user(
            db=db,
            user_data=user_data,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        )

# Login
@router.post(
    "/login",
    response_model=Token,
)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate a user and return a JWT access token.
    """
    user = authenticate_user(
        db=db,
        login_data=login_data,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    return create_user_token(user)