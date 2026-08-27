from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User, Leaderboard
from app.dependencies.auth import require_trainer
from app.schemas.user import (
    UserResponse,
    TrainerDashboardResponse,
)
from app.services.leaderboard_service import get_trainer_rank


router = APIRouter(
    prefix="/trainer",
    tags=["Trainer"],
)

# Trainer Profile
@router.get(
    "/profile",
    response_model=UserResponse,
)
def get_trainer_profile(
    current_user: User = Depends(require_trainer),
):
    """
    Return the profile of the authenticated trainer.
    """
    return current_user

# Trainer Dashboard
@router.get(
    "/dashboard",
    response_model=TrainerDashboardResponse,
)
def get_trainer_dashboard(
    current_user: User = Depends(require_trainer),
    db: Session = Depends(get_db),
):
    """
    Return dashboard statistics and rank
    for the authenticated trainer.
    """
    leaderboard = (
        db.query(Leaderboard)
        .filter(Leaderboard.trainer_id == current_user.id)
        .first()
    )

    if leaderboard is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leaderboard entry not found.",
        )

    rank = get_trainer_rank(db, current_user.id)

    return TrainerDashboardResponse(
        username=current_user.username,
        total_matches=leaderboard.total_matches,
        wins=leaderboard.wins,
        points=leaderboard.points,
        rank=rank,
        last_battle=current_user.last_battle_summary,
    )