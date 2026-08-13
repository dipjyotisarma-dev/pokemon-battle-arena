from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User
from app.dependencies.auth import require_trainer
from app.schemas.battle import (
    BattleStartResponse,
    BattlePokemonSelectionRequest,
    BattleMatchIntroResponse,
    BattleContinueResponse,
)
from app.services.battle_service import (
    start_battle,
    select_pokemon_for_match,
    continue_battle,
)


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


@router.post(
    "/{battle_id}/select-pokemon",
    response_model=BattleMatchIntroResponse,
)
def select_battle_pokemon(
    battle_id: str,
    request: BattlePokemonSelectionRequest,
    current_user: User = Depends(require_trainer),
    db: Session = Depends(get_db),
):
    """
    Select the trainer's Pokémon for the current match
    and initialize the match against a random unused
    opponent Pokémon.
    """
    try:
        battle = select_pokemon_for_match(
            db=db,
            battle_id=battle_id,
            trainer_id=current_user.id,
            trainer_slot=request.trainer_slot,
        )

    except ValueError as exc:
        message = str(exc)
        if message == "Battle not found.":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=message,
            )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message,
        )

    match_state = battle.current_match_state

    trainer_pokemon = match_state["trainer_pokemon"]
    opponent_pokemon = match_state["opponent_pokemon"]

    return BattleMatchIntroResponse(
        battle_id=battle.id,
        status=battle.status,
        current_match=battle.current_match,
        trainer_pokemon=trainer_pokemon,
        opponent_pokemon=opponent_pokemon,
        first_attacker=match_state["first_attacker"],
    )


@router.post(
    "/{battle_id}/continue",
    response_model=BattleContinueResponse,
)
def continue_current_battle(
    battle_id: str,
    current_user: User = Depends(require_trainer),
    db: Session = Depends(get_db),
):
    """
    Continue from the match introduction screen
    and begin the active Pokémon battle.
    """
    try:
        battle = continue_battle(
            db=db,
            battle_id=battle_id,
            trainer_id=current_user.id,
        )

    except ValueError as exc:
        message = str(exc)

        if message == "Battle not found.":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=message,
            )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message,
        )

    match_state = battle.current_match_state

    return BattleContinueResponse(
        battle_id=battle.id,
        status=battle.status,
        current_match=battle.current_match,
        trainer_pokemon=match_state["trainer_pokemon"],
        opponent_pokemon=match_state["opponent_pokemon"],
        trainer_current_hp=match_state["trainer_current_hp"],
        opponent_current_hp=match_state["opponent_current_hp"],
        first_attacker=match_state["first_attacker"],
        turn=match_state["turn"],
        battle_log=match_state["battle_log"],
    )