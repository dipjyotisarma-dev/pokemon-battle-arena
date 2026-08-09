from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.security import verify_access_token
from app.db.database import get_db
from app.db.models import User


# OAuth2 Bearer Token
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login"
)


# Current User
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)) -> User:
    """
    Retrieve the currently authenticated user.
    """

    # Verify JWT
    payload = verify_access_token(token)

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