from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User, Leaderboard
from app.dependencies.auth import require_trainer
from app.schemas.user import (
    UserResponse,
    TrainerDashboardResponse,
)


router = APIRouter(
    prefix="/trainer",
    tags=["Trainer"],
)


# ============================================================
# Trainer Profile
# ============================================================

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


# ============================================================
# Trainer Dashboard
# ============================================================

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

    leaderboard_entries = (
        db.query(Leaderboard)
        .join(
            User,
            User.id == Leaderboard.trainer_id,
        )
        .order_by(
            Leaderboard.points.desc(),
            Leaderboard.wins.desc(),
            Leaderboard.total_matches.asc(),
            User.username.asc(),
        )
        .all()
    )

    if not leaderboard_entries:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leaderboard entry not found.",
        )

    trainer_rank = None

    for position, entry in enumerate(
        leaderboard_entries,
        start=1,
    ):
        if entry.trainer_id == current_user.id:
            trainer_rank = position
            break

    if trainer_rank is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leaderboard entry not found.",
        )

    trainer_entry = next(
        entry
        for entry in leaderboard_entries
        if entry.trainer_id == current_user.id
    )

    return TrainerDashboardResponse(
        username=current_user.username,
        total_matches=trainer_entry.total_matches,
        wins=trainer_entry.wins,
        points=trainer_entry.points,
        rank=trainer_rank,
    )