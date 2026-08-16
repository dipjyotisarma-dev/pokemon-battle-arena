from sqlalchemy.orm import Session
from app.db.models import Pokemon, Move, PokemonMove


def search_pokemon(
    db: Session,
    query: str | None = None,
    pokemon_id: int | None = None,
    limit: int = 5,
):
    """
    Search Pokémon by name prefix or Pokédex ID.
    Name search examples:
        "ch"   -> Pokémon whose names start with "ch"
        "char" -> Pokémon whose names start with "char"

    Only one search method should be used at a time.
    """

    pokemon_query = db.query(Pokemon)

    # Search by Pokédex ID
    if pokemon_id is not None:
        return (
            pokemon_query
            .filter(Pokemon.id == pokemon_id)
            .limit(1)
            .all()
        )

    # Search by name prefix
    if query:
        query = query.strip()
        pokemon_query = pokemon_query.filter(
            Pokemon.display_name.ilike(f"{query}%")
        )

    # Return limited results
    return (
        pokemon_query
        .order_by(Pokemon.id)
        .limit(limit)
        .all()
    )


def get_pokemon(
    db: Session,
    pokemon_id: int,
):
    """
    Retrieve a single Pokémon by Pokédex ID.
    """
    return (
        db.query(Pokemon)
        .filter(Pokemon.id == pokemon_id)
        .first()
    )


def get_pokemon_moves(
    db: Session,
    pokemon_id: int,
):
    """
    Retrieve all moves that a Pokémon can learn.
    """
    return (
        db.query(Move)
        .join(
            PokemonMove,
            PokemonMove.move_id == Move.id
        )
        .filter(
            PokemonMove.pokemon_id == pokemon_id
        )
        .order_by(Move.display_name)
        .all()
    )