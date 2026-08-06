from pathlib import Path
import pandas as pd
from app.database import Base, engine, SessionLocal
from app.models import (
    Pokemon,
    Move,
    PokemonMove,
    User,
)

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

PROCESSED_DATA_DIR = DATA_DIR / "processed"

POKEMON_CSV = PROCESSED_DATA_DIR / "pokemon.csv"
MOVES_CSV = PROCESSED_DATA_DIR / "moves.csv"


def create_tables():
    '''
    creates all database tables
    '''
    Base.metadata.create_all(bind=engine)


def seed_pokemon():
    """
    Imports pokemon.csv into the Pokemon table.
    """
    db = SessionLocal()

    try:
        # return if data already exist in database
        if db.query(Pokemon).first():
            print("Pokemon table already seeded.")
            return
        
        pokemon_df = pd.read_csv(POKEMON_CSV)
        pokemon_records = []

        for _, row in pokemon_df.iterrows():

            pokemon = Pokemon(
                id=row["id"],
                name=row["name"],
                display_name=row["display_name"],
                type1=row["type1"],
                type2=None if pd.isna(row["type2"]) else row["type2"],
                hp=row["hp"],
                attack=row["attack"],
                defense=row["defense"],
                special_attack=row["special_attack"],
                special_defense=row["special_defense"],
                speed=row["speed"],
                bst=row["bst"],
                image=row["image"]
            )
            pokemon_records.append(pokemon)

        db.add_all(pokemon_records)
        db.commit()

        print(f"Seeded {len(pokemon_records)} Pokémon.")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()



def seed_moves():
    """
    Imports moves.csv into the Move table.
    """
    db = SessionLocal()

    try:
        if db.query(Move).first():
            print("Moves table already seeded.")
            return

        moves_df = pd.read_csv(MOVES_CSV)
        move_objects = []

        for _, row in moves_df.iterrows():

            move = Move(
                id=row["id"],
                move_name=row["move_name"],
                display_name=row["display_name"],
                move_type=row["move_type"],
                category=row["category"],
                base_power=row["base_power"]
            )
            move_objects.append(move)

        db.add_all(move_objects)
        db.commit()

        print(f"Seeded {len(move_objects)} moves.")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


def seed_pokemon_moves():
    """
    Imports pokemon_moves.csv into the PokemonMove table.
    """
    pass


def create_default_admin():
    """
    Creates the default admin account if it does not exist.
    """
    pass


def initialize_database():
    """
    Initializes the entire database.
    """
    print("Initializing database...")
    create_tables()
    seed_pokemon()
    seed_moves()
    seed_pokemon_moves()
    create_default_admin()
    print("Database initialization completed.")