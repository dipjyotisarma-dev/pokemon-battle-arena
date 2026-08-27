from sqlalchemy.orm import Session
from app.db.models import Pokemon, Move, PokemonMove

_all_pokemon_cache: list[Pokemon] | None = None
_pokemon_by_id_cache: dict[int, Pokemon] = {}


def prime_pokemon_cache(db: Session) -> list[Pokemon]:
    """
    Load and cache all static Pokémon records in memory.
    """
    global _all_pokemon_cache, _pokemon_by_id_cache
    records = db.query(Pokemon).order_by(Pokemon.id).all()
    _all_pokemon_cache = records
    _pokemon_by_id_cache = {p.id: p for p in records}
    return records


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
    global _all_pokemon_cache
    if _all_pokemon_cache is None:
        prime_pokemon_cache(db)

    # Search by Pokédex ID
    if pokemon_id is not None:
        p = _pokemon_by_id_cache.get(pokemon_id)
        return [p] if p else []

    # Search by name prefix
    if query:
        q = query.strip().lower()
        results = [
            p for p in _all_pokemon_cache
            if p.display_name.lower().startswith(q)
        ]
        return results[:limit]

    return _all_pokemon_cache[:limit]


def get_pokemon(
    db: Session,
    pokemon_id: int,
):
    """
    Retrieve a single Pokémon by Pokédex ID.
    """
    global _all_pokemon_cache
    if _all_pokemon_cache is None:
        prime_pokemon_cache(db)

    return _pokemon_by_id_cache.get(pokemon_id)


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


def get_all_pokemon(
    db: Session,
) -> list[Pokemon]:
    """
    Retrieve all Pokémon ordered by Pokédex ID.
    """
    global _all_pokemon_cache
    if _all_pokemon_cache is None:
        return prime_pokemon_cache(db)
    return _all_pokemon_cache