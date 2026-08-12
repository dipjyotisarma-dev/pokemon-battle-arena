from datetime import datetime
from pydantic import BaseModel, ConfigDict


class UserResponse(BaseModel):
    """
    Public representation of a user.

    This schema controls which User fields
    can be returned to the client.
    """
    id: int
    username: str
    email: str
    role: str
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


class TrainerDashboardResponse(BaseModel):
    """
    Statistics displayed on the trainer dashboard.
    """
    username: str
    total_matches: int
    wins: int
    points: float
    rank: int

    model_config = ConfigDict(
        from_attributes=True
    )