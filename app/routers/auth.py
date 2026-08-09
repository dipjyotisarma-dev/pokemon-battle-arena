from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.auth import UserCreate, Token
from app.schemas.user import UserResponse
from app.services.auth_service import (
    authenticate_user,
    create_user_token,
    register_user,
)
from app.db.models import User
from app.dependencies.auth import (
    get_current_user,
    require_admin
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
    response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)):
    """
    Authenticate a user and return a JWT access token.
    """
    user = authenticate_user(
        db=db,
        username=form_data.username,
        password=form_data.password,
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



@router.get(
    "/me",
    response_model=UserResponse
)
def get_me(
    current_user: User = Depends(get_current_user)
):
    """
    Return the currently authenticated user.
    """
    return current_user