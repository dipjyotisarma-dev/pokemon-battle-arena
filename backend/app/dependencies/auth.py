from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.security import verify_access_token
from app.db.database import get_db
from app.db.models import User


# OAuth2 Bearer Token (auto_error=False allows falling back to cookie authentication)
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login",
    auto_error=False,
)


# Current User
def get_current_user(
    request: Request,
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Retrieve the currently authenticated user from either
    the Authorization header or the access_token HttpOnly cookie.
    """
    auth_token = token
    if not auth_token and request:
        auth_token = request.cookies.get("access_token")

    if not auth_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required.",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    # Verify JWT
    payload = verify_access_token(auth_token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    # Extract user ID
    user_id = payload.get("sub")

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    # Convert user ID
    try:
        user_id = int(user_id)

    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    # Retrieve user from database
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    # Verify user exists
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with token does not exist.",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    return user


# Admin Authorization
def require_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Allow access only to administrators.
    """

    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required.",
        )

    return current_user


# Trainer Authorization
def require_trainer(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Allow access only to trainers.
    """
    if current_user.role != "trainer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Trainer privileges required.",
        )

    return current_user