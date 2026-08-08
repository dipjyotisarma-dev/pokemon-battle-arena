from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.db.database import Base, engine
import app.db.models
from app.db.database_initializer import initialize_database
from app.routers.auth import router as auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    initialize_database()

    yield
    # Shutdown


# fastapi application
app = FastAPI(
    title="Pokemon Battle Arena",
    version="1.0.0",
    lifespan=lifespan
)

app.include_router(auth_router)

@app.get("/")
async def home():
    return {"message": "Application started"}