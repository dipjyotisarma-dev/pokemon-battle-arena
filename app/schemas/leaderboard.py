from pydantic import BaseModel

class LeaderboardEntryResponse(BaseModel):
    """
    Public leaderboard entry.
    """
    rank: int
    username: str
    points: float
    wins: int
    total_matches: int