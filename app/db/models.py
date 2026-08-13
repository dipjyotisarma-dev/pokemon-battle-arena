from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    DateTime,
    JSON,
    Float,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from uuid import uuid4
from app.db.database import Base

class User(Base):

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

    # One trainer has one leaderboard entry
    leaderboard = relationship(
        "Leaderboard",
        back_populates="trainer",
        uselist=False
    )

    # One trainer has multiple team slots, with exactly six enforced by application logic.
    team = relationship(
        "TrainerTeam",
        back_populates="trainer",
        cascade="all, delete-orphan"
    )

    # One trainer can have multiple battle records
    battles = relationship(
        "Battle",
        back_populates="trainer",
        cascade="all, delete-orphan"
    )



class Pokemon(Base):

    __tablename__ = "pokemon"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    display_name = Column(String, nullable=False)
    type1 = Column(String, nullable=False)
    type2 = Column(String, nullable=True)
    hp = Column(Integer, nullable=False)
    attack = Column(Integer, nullable=False)
    defense = Column(Integer, nullable=False)
    special_attack = Column(Integer, nullable=False)
    special_defense = Column(Integer, nullable=False)
    speed = Column(Integer, nullable=False)
    bst = Column(Integer, nullable=False)
    image = Column(String, nullable=False)
    pokemon_category = Column(String, nullable=False, default="basic")

    team_slots = relationship(
        "TrainerTeam",
        back_populates="pokemon"
    )

    available_moves = relationship(
        "PokemonMove",
        back_populates="pokemon",
        cascade="all, delete-orphan"
    )



class Move(Base):

    __tablename__ = "moves"

    id = Column(Integer, primary_key=True, index=True)
    move_name = Column(String, unique=True, index=True, nullable=False)
    display_name = Column(String, nullable=False)
    move_type = Column(String, nullable=False)
    category = Column(String, nullable=False)
    base_power = Column(Integer, nullable=False)

    pokemon_moves = relationship(
        "PokemonMove",
        back_populates="move",
        cascade="all, delete-orphan"
    )



class PokemonMove(Base):

    __tablename__ = "pokemon_moves"

    pokemon_id = Column(Integer, ForeignKey("pokemon.id"), primary_key=True)
    move_id = Column(Integer, ForeignKey("moves.id"), primary_key=True)

    pokemon = relationship(
        "Pokemon",
        back_populates="available_moves"
    )

    move = relationship(
        "Move",
        back_populates="pokemon_moves"
    )



class TrainerTeam(Base):

    __tablename__ = "trainer_team"

    __table_args__ = (
        UniqueConstraint(
            "trainer_id",
            "slot",
            name="uq_trainer_slot"
        ),
        UniqueConstraint(
            "trainer_id",
            "pokemon_id",
            name="uq_trainer_pokemon"
        )
    )

    id = Column(Integer, primary_key=True, index=True)
    trainer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    slot = Column(Integer, nullable=False)
    pokemon_id = Column(Integer, ForeignKey("pokemon.id"), nullable=False)
    move1_id = Column(Integer, ForeignKey("moves.id"), nullable=False)
    move2_id = Column(Integer, ForeignKey("moves.id"), nullable=False)
    move3_id = Column(Integer, ForeignKey("moves.id"), nullable=False)
    move4_id = Column(Integer, ForeignKey("moves.id"), nullable=False)

    trainer = relationship(
        "User",
        back_populates="team"
    )

    pokemon = relationship(
        "Pokemon",
        back_populates="team_slots"
    )

    move1 = relationship(
        "Move",
        foreign_keys=[move1_id]
    )

    move2 = relationship(
        "Move",
        foreign_keys=[move2_id]
    )

    move3 = relationship(
        "Move",
        foreign_keys=[move3_id]
    )

    move4 = relationship(
        "Move",
        foreign_keys=[move4_id]
    )



class Battle(Base):

    __tablename__ = "battles"

    id = Column(String(36),primary_key=True,default=lambda: str(uuid4()),)
    trainer_id = Column(Integer,ForeignKey("users.id"),nullable=False,index=True)
    status = Column(String,nullable=False,default="team_selection",index=True)
    current_match = Column(Integer,nullable=False,default=1)
    completed_matches = Column(Integer,nullable=False,default=0)
    completed_wins = Column(Integer,nullable=False,default=0)
    completed_points = Column(Float,nullable=False,default=0.0)

    # Snapshot of the trainer's finalized team
    trainer_team = Column(JSON,nullable=False)

    # Randomly generated AI team
    opponent_team = Column(JSON,nullable=False)

    # State of the currently active Pokémon match
    current_match_state = Column(JSON,nullable=True)

    # Results of all completed matches
    match_history = Column(JSON,nullable=False,default=list)
    created_at = Column(DateTime,nullable=False)
    updated_at = Column(DateTime,nullable=False)

    trainer = relationship(
        "User",
        back_populates="battles"
    )



class Leaderboard(Base):

    __tablename__ = "leaderboard"

    trainer_id = Column(Integer,ForeignKey("users.id"),primary_key=True)
    total_matches = Column(Integer, default=0, nullable=False)
    wins = Column(Integer, default=0, nullable=False)
    points = Column(Float, default=0.0, nullable=False)

    trainer = relationship(
        "User",
        back_populates="leaderboard"
    )