from fastapi import FastAPI
from app.core.config import settings
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import app.db.models
from app.db.database_initializer import initialize_database
from app.routers.auth import router as auth_router
from app.routers.pokemon import router as pokemon_router
from app.routers.team import router as team_router
from app.routers.trainer import router as trainer_router
from app.routers.leaderboard import router as leaderboard_router
from app.routers.battle import router as battle_router


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

cors_origins = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://127.0.0.1:8000",
    "http://localhost:8000",
    "http://127.0.0.1:8080",
    "http://localhost:8080",
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    "http://127.0.0.1:5000",
    "http://localhost:5000",
]

if settings.CORS_ORIGINS:
    cors_origins.extend(
        origin.strip()
        for origin in settings.CORS_ORIGINS.split(",")
        if origin.strip()
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(pokemon_router)
app.include_router(team_router)
app.include_router(trainer_router)
app.include_router(leaderboard_router)
app.include_router(battle_router)

@app.get("/")
async def home():
    return {"message": "Application started"}


@app.get("/health")
async def health_check():
    return {"status": "ok"}