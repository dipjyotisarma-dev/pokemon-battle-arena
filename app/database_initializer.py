from app.database import Base, engine

def create_tables():
    '''
    creates all database tables
    '''
    Base.metadata.create_all(bind=engine)


def seed_pokemon():
    """
    Imports pokemon.csv into the Pokemon table.
    """
    pass


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