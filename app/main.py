from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.database import Base, engine
import app.models
from app.database_initializer import initialize_database


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


@app.get("/")
async def home():
    return {"message": "Application started"}