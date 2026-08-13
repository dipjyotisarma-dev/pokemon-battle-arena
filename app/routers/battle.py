from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User
from app.dependencies.auth import require_trainer
from app.schemas.battle import BattleStartResponse
from app.services.battle_service import start_battle


router = APIRouter(
    prefix="/battle",
    tags=["Battle"],
)


@router.post(
    "/start",
    response_model=BattleStartResponse,
)
def create_battle(
    current_user: User = Depends(require_trainer),
    db: Session = Depends(get_db),
):
    """
    Start a new battle for the authenticated trainer.
    """
    try:
        battle = start_battle(
            db=db,
            trainer_id=current_user.id,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    return BattleStartResponse(
        battle_id=battle.id,
        status=battle.status,
        current_match=battle.current_match,
        completed_matches=battle.completed_matches,
        completed_wins=battle.completed_wins,
        completed_points=battle.completed_points,
        trainer_team=battle.trainer_team,
        opponent_team=battle.opponent_team,
    )