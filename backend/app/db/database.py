from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# SQLAlchemy Engine
if settings.DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=1800,
    )


# Session Factory
SessionLocal = sessionmaker(autocommit = False, autoflush = False, bind=engine)

# Base class 
Base = declarative_base()

# Database dependency
def get_db():
    """
    Creates a new database session for each request
    and closes it automatically afterwards.
    """

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()
