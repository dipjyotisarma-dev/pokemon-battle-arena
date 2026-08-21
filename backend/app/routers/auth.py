from fastapi import APIRouter, Depends, HTTPException, Response, status
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

from fastapi.responses import JSONResponse

# Login
@router.post(
    "/login",
    response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)):
    """
    Authenticate a user, return a JWT access token, and set an HttpOnly cookie.
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

    token = create_user_token(user)

    # Return JSONResponse directly with HttpOnly cookie attached
    json_response = JSONResponse(
        content={
            "access_token": token.access_token,
            "token_type": token.token_type,
        }
    )
    json_response.set_cookie(
        key="access_token",
        value=token.access_token,
        httponly=True,
        samesite="lax",
        path="/"
    )

    return json_response


# Logout
@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
)
def logout():
    """
    Clear the authentication cookie.
    """
    json_response = JSONResponse(content={"message": "Logged out successfully"})
    json_response.delete_cookie(
        key="access_token",
        path="/"
    )
    return json_response


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