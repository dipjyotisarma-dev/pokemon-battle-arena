from datetime import datetime, timezone
import pandas as pd
from app.core.config import settings
from app.db.database import Base, SessionLocal, engine
from app.db.models import (
    Pokemon,
    Move,
    PokemonMove,
    User
)
from app.core.security import hash_password
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

PROCESSED_DATA_DIR = DATA_DIR / "processed"

POKEMON_CSV = PROCESSED_DATA_DIR / "pokemon.csv"
MOVES_CSV = PROCESSED_DATA_DIR / "moves.csv"
POKEMON_MOVES_CSV = PROCESSED_DATA_DIR / "pokemon_moves.csv"


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
    db = SessionLocal()

    try:
        if db.query(PokemonMove).first():
            print("PokemonMove table already seeded.")
            return

        pokemon_moves_df = pd.read_csv(POKEMON_MOVES_CSV)
        pokemon_move_objects = []

        for _, row in pokemon_moves_df.iterrows():

            pokemon_move = PokemonMove(
                pokemon_id=int(row["pokemon_id"]),
                move_id=int(row["move_id"])
            )
            pokemon_move_objects.append(pokemon_move)

        db.add_all(pokemon_move_objects)
        db.commit()

        print(f"Seeded {len(pokemon_move_objects)} pokemon-move mappings.")

    except Exception:
        db.rollback()
        raise

    finally:

        db.close()



def create_default_admin():
    """
    Creates the default administrator account if it
    does not already exist.
    """
    db = SessionLocal()
    try:
        admin = (
            db.query(User)
            .filter(
                User.username == settings.DEFAULT_ADMIN_USERNAME
            )
            .first()
        )
        if admin:
            print("Default admin already exists.")
            return

        admin = User(
            username=settings.DEFAULT_ADMIN_USERNAME,
            email=settings.DEFAULT_ADMIN_EMAIL,
            password_hash=hash_password(
                settings.DEFAULT_ADMIN_PASSWORD
            ),
            role="admin",
            created_at=datetime.now(timezone.utc),
            last_matches=0,
            last_wins=0,
            last_average_points=0.0,
            last_battle_summary=None

        )
        db.add(admin)
        db.commit()
        print("Default admin created.")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


def initialize_database():
    """
    Initializes the entire database.
    """
    print("Creating database tables...")
    create_tables()

    print("Seeding Pokémon...")
    seed_pokemon()

    print("Seeding moves...")
    seed_moves()

    print("Seeding Pokémon moves...")
    seed_pokemon_moves()

    print("Creating default admin...")
    create_default_admin()

    print("Database initialization completed.")