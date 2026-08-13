from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.leaderboard import LeaderboardEntryResponse
from app.services.leaderboard_service import get_ranked_leaderboard


router = APIRouter(
    prefix="/leaderboard",
    tags=["Leaderboard"],
)


@router.get(
    "",
    response_model=list[LeaderboardEntryResponse],
)
def get_leaderboard(
    db: Session = Depends(get_db),
):
    """
    Return the public trainer leaderboard.
    """

    leaderboard_entries = get_ranked_leaderboard(db)

    return [
        LeaderboardEntryResponse(
            rank=rank,
            username=user.username,
            points=leaderboard.points,
            wins=leaderboard.wins,
            total_matches=leaderboard.total_matches,
        )
        for rank, (user, leaderboard)
        in enumerate(leaderboard_entries, start=1)
    ]