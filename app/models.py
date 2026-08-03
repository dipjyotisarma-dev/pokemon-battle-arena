from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON, Float

class User():

    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False)
    last_matches = Column(Integer, default=0, nullable=False)
    last_wins = Column(Integer, default=0, nullable=False)
    last_average_points = Column(Float, default=0.0, nullable=False)
    last_battle_summary = Column(JSON, nullable=True)



class Pokemon:

    __tablename__ = "pokemon"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    type1 = Column(String, nullable=False)
    type2 = Column(String, nullable=True)
    hp = Column(Integer, nullable=False)
    attack = Column(Integer, nullable=False)
    defense = Column(Integer, nullable=False)
    special_attack = Column(Integer, nullable=False)
    special_defense = Column(Integer, nullable=False)
    speed = Column(Integer, nullable=False)
    image = Column(String, nullable=False)



class Move:

    __tablename__ = "moves"

    id = Column(Integer, primary_key=True, index=True)
    move_name = Column(String, unique=True, index=True, nullable=False)
    move_type = Column(String, nullable=False)
    category = Column(String, nullable=False)
    base_power = Column(Integer, nullable=False)



class PokemonMove:

    __tablename__ = "pokemon_moves"

    pokemon_id = Column(Integer, ForeignKey("pokemon.id"), primary_key=True)
    move_id = Column(Integer, ForeignKey("moves.id"), primary_key=True)



class TrainerTeam:

    __tablename__ = "trainer_team"

    id = Column(Integer, primary_key=True, index=True)
    trainer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    slot = Column(Integer, nullable=False)
    pokemon_id = Column(Integer, ForeignKey("pokemon.id"), nullable=False)
    move1_id = Column(Integer, ForeignKey("moves.id"), nullable=False)
    move2_id = Column(Integer, ForeignKey("moves.id"), nullable=False)
    move3_id = Column(Integer, ForeignKey("moves.id"), nullable=False)
    move4_id = Column(Integer, ForeignKey("moves.id"), nullable=False)




class Leaderboard:

    __tablename__ = "leaderboard"

    trainer_id = Column(Integer,ForeignKey("users.id"),primary_key=True)
    total_matches = Column(Integer, default=0, nullable=False)
    wins = Column(Integer, default=0, nullable=False)
    points = Column(Float, default=0.0, nullable=False)