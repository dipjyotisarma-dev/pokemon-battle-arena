import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent

sys.path.append(str(PROJECT_ROOT))

from app.db.database import SessionLocal
from app.db.models import Pokemon, PokemonMove, Move


def main():

    db = SessionLocal()

    try:

        pokemon_ids = [
            6,
            94,
            130,
            248,
            376,
            445,
            144,
            151,
            793,
        ]

        for pokemon_id in pokemon_ids:

            pokemon = (
                db.query(Pokemon)
                .filter(Pokemon.id == pokemon_id)
                .first()
            )

            if pokemon is None:
                print(
                    f"\n{pokemon_id}: Pokémon not found"
                )
                continue

            moves = (
                db.query(Move)
                .join(
                    PokemonMove,
                    PokemonMove.move_id == Move.id
                )
                .filter(
                    PokemonMove.pokemon_id == pokemon_id
                )
                .limit(4)
                .all()
            )

            print(
                f"\n{pokemon.id} - "
                f"{pokemon.display_name} "
                f"({pokemon.pokemon_category})"
            )

            for move in moves:
                print(
                    f"    {move.id} - "
                    f"{move.display_name}"
                )

    finally:

        db.close()


if __name__ == "__main__":
    main()