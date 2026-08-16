from fastapi import FastAPI
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
    ],
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