from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User
from app.dependencies.auth import require_trainer
from app.schemas.user import (
    UserResponse,
    TrainerDashboardResponse,
)
from app.services.leaderboard_service import get_ranked_leaderboard


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
    leaderboard_entries = get_ranked_leaderboard(db)

    if not leaderboard_entries:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leaderboard entry not found.",
        )

    for rank, (user, leaderboard) in enumerate(
        leaderboard_entries,
        start=1,
    ):
        if user.id == current_user.id:

            return TrainerDashboardResponse(
                username=user.username,
                total_matches=leaderboard.total_matches,
                wins=leaderboard.wins,
                points=leaderboard.points,
                rank=rank,
            )

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Leaderboard entry not found.",
    )