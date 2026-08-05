from pathlib import Path
import pandas as pd
from app.database import Base, engine, SessionLocal
from app.models import Pokemon


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

POKEMON_CSV = DATA_DIR / "pokemon.csv"


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
            return
        
        pokemon_df = pd.read_csv(POKEMON_CSV)

        pokemon_objects = []

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

            pokemon_objects.append(pokemon)

        db.add_all(pokemon_objects)

        db.commit()

        print(f"Seeded {len(pokemon_objects)} Pokémon.")

    except:
        db.rollback()
        raise

    finally:
        db.close()



def seed_moves():
    """
    Imports moves.csv into the Move table.
    """
    pass


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
    create_tables()
    seed_pokemon()
    seed_moves()
    seed_pokemon_moves()
    create_default_admin()