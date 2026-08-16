from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.pokemon import (
    MoveResponse,
    PokemonListItem,
    PokemonResponse,
)
from app.services.pokemon_service import (
    get_pokemon,
    get_pokemon_moves,
    search_pokemon,
)


router = APIRouter(
    prefix="/pokemon",
    tags=["Pokémon"],
)


# Search Pokémon
@router.get(
    "/search",
    response_model=list[PokemonListItem],
)
def search(
    q: str | None = Query(
        default=None,
        min_length=2,
        description="Pokémon name prefix.",
    ),
    pokemon_id: int | None = Query(
        default=None,
        ge=1,
        description="Official Pokédex number.",
    ),
    limit: int = Query(
        default=10,
        ge=1,
        le=10,
        description="Maximum number of results.",
    ),
    db: Session = Depends(get_db),
):
    """
    Search Pokémon by name prefix or Pokédex ID.
    """
    # Validate search parameters
    if q is None and pokemon_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide either a Pokémon name or Pokédex ID.",
        )

    if q is not None and pokemon_id is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide either a Pokémon name or Pokédex ID, not both.",
        )

    # Search Pokémon
    pokemon = search_pokemon(
        db=db,
        query=q,
        pokemon_id=pokemon_id,
        limit=limit,
    )

    return pokemon


# Get Pokémon details
@router.get(
    "/{pokemon_id}",
    response_model=PokemonResponse,
)
def get_pokemon_details(
    pokemon_id: int,
    db: Session = Depends(get_db),
):
    """
    Retrieve complete information about a Pokémon.
    """
    pokemon = get_pokemon(
        db=db,
        pokemon_id=pokemon_id,
    )

    if pokemon is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pokémon not found.",
        )

    return pokemon


# Get Pokémon moves
@router.get(
    "/{pokemon_id}/moves",
    response_model=list[MoveResponse],
)
def get_moves(
    pokemon_id: int,
    db: Session = Depends(get_db),
):
    """
    Retrieve moves available to a Pokémon.
    """
    # Verify Pokémon exists
    pokemon = get_pokemon(
        db=db,
        pokemon_id=pokemon_id,
    )

    if pokemon is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pokémon not found.",
        )

    # Retrieve available moves
    return get_pokemon_moves(
        db=db,
        pokemon_id=pokemon_id,
    )