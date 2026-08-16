from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.dependencies.auth import require_trainer
from app.db.database import get_db
from app.db.models import User
from app.schemas.team import (
    TeamCreate,
    TeamResponse,
    MoveOptionResponse,
)
from app.services.team_service import (
    create_team,
    get_team,
    update_team,
    get_random_move_options,
)

router = APIRouter(
    prefix="/team",
    tags=["Team"],
)


@router.post(
    "",
    response_model=TeamResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_trainer_team(
    team_data: TeamCreate,
    current_user: User = Depends(require_trainer),
    db: Session = Depends(get_db),
):
    """
    Finalize and save the authenticated trainer's team.
    """
    try:
        return create_team(
            db=db,
            trainer_id=current_user.id,
            team_data=team_data,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )


@router.get(
    "/{pokemon_id}/move-options",
    response_model=list[MoveOptionResponse],
    status_code=status.HTTP_200_OK,
)
def get_move_options(
    pokemon_id: int,
    current_user: User = Depends(require_trainer),
    db: Session = Depends(get_db),
):
    """
    Return 10–12 randomly selected moves
    that the Pokémon can learn.
    The authenticated trainer is required because
    this endpoint is part of the team-building workflow.
    """

    try:
        moves = get_random_move_options(
            db=db,
            pokemon_id=pokemon_id,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )

    return moves



@router.get(
    "",
    response_model=TeamResponse,
    status_code=status.HTTP_200_OK,
)
def get_trainer_team(
    current_user: User = Depends(require_trainer),
    db: Session = Depends(get_db),
):
    """
    Retrieve the authenticated trainer's current team.
    """
    team = get_team(
        db=db,
        trainer_id=current_user.id,
    )

    if team is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trainer does not have a team yet.",
        )

    return team


# Update Team
@router.put(
    "",
    response_model=TeamResponse,
    status_code=status.HTTP_200_OK,
)
def update_trainer_team(
    team_data: TeamCreate,
    current_user: User = Depends(require_trainer),
    db: Session = Depends(get_db),
):
    """
    Replace the authenticated trainer's existing team
    with a newly finalized team.
    """
    try:
        return update_team(
            db=db,
            trainer_id=current_user.id,
            team_data=team_data,
        )

    except ValueError as error:
        error_message = str(error)
        if "does not have an existing team" in error_message:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_message,
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message,
        )