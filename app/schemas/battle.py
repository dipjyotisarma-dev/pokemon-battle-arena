from pydantic import BaseModel

class BattleMoveResponse(BaseModel):
    id: int
    move_name: str
    display_name: str
    move_type: str
    category: str
    base_power: int


class BattlePokemonResponse(BaseModel):
    slot: int | None = None
    id: int
    name: str
    display_name: str
    type1: str
    type2: str | None
    hp: int
    attack: int
    defense: int
    special_attack: int
    special_defense: int
    speed: int
    bst: int
    image: str
    pokemon_category: str
    moves: list[BattleMoveResponse]


class BattleStartResponse(BaseModel):
    battle_id: str
    status: str
    current_match: int
    completed_matches: int
    completed_wins: int
    completed_points: float
    trainer_team: list[BattlePokemonResponse]
    opponent_team: list[BattlePokemonResponse]