from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.database import Base, engine
import app.models


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)

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