from sqlalchemy.orm import Session
from app.db.models import User, Leaderboard


def get_ranked_leaderboard(
    db: Session,
):
    """
    Return all trainer leaderboard entries in ranking order.

    Ranking rules:
    1. More points -> higher rank
    2. If points are equal, more wins -> higher rank
    3. If points and wins are equal, fewer total matches -> higher rank
    4. If all three are equal, alphabetical username -> higher rank
    """

    return (
        db.query(User, Leaderboard)
        .join(
            Leaderboard,
            User.id == Leaderboard.trainer_id,
        )
        .filter(
            User.role == "trainer"
        )
        .order_by(
            Leaderboard.points.desc(),
            Leaderboard.wins.desc(),
            Leaderboard.total_matches.asc(),
            User.username.asc(),
        )
        .all()
    )