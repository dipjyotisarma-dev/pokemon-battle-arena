from sqlalchemy.orm import Session
from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.db.models import User
from app.schemas.auth import Token, UserCreate, UserLogin
from app.schemas.user import UserResponse


def register_user(db: Session, user_data: UserCreate) -> UserResponse:
    """
    Register a new trainer.
    """

    # Check username uniqueness
    existing_username = (
        db.query(User)
        .filter(User.username == user_data.username)
        .first()
    )
    if existing_username:
        raise ValueError("Username already registered.")

    # Check email uniqueness
    existing_email = (
        db.query(User)
        .filter(User.email == user_data.email)
        .first()
    )
    if existing_email:
        raise ValueError("Email already registered.")


    # Hash password
    hashed_password = hash_password(
        user_data.password
    )

    # Create user
    user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hashed_password,
        role="trainer",
    )

    # Save user
    try:
        db.add(user)
        db.commit()
        db.refresh(user)

    except Exception:
        db.rollback()
        raise

    # Return public user data
    return UserResponse.model_validate(user)


def authenticate_user(db: Session, login_data: UserLogin) -> User | None:
    """
    Authenticate a user using username and password.

    Returns:
        User object if credentials are valid.
        None if authentication fails.
    """

    # Find user by username
    user = (
        db.query(User)
        .filter(User.username == login_data.username)
        .first()
    )
    if not user:
        return None

    # Verify password
    password_valid = verify_password(
        login_data.password,
        user.password_hash
    )
    if not password_valid:
        return None

    return user


def create_user_token(user: User) -> Token:
    """
    Create an access token for an authenticated user.
    """
    token_data = {
        "sub": str(user.id),
        "role": user.role,
    }

    access_token = create_access_token(
        token_data
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
    )