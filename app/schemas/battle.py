# from pydantic import BaseModel

# class BattleMoveOptionResponse(BaseModel):
#     id: int
#     move_name: str
#     display_name: str
#     move_type: str
#     category: str
#     base_power: int


# class BattlePokemonResponse(BaseModel):
#     slot: int | None = None
#     id: int
#     name: str
#     display_name: str
#     type1: str
#     type2: str | None
#     hp: int
#     attack: int
#     defense: int
#     special_attack: int
#     special_defense: int
#     speed: int
#     bst: int
#     image: str
#     pokemon_category: str
#     moves: list[BattleMoveOptionResponse]


# class BattleStartResponse(BaseModel):
#     battle_id: str
#     status: str
#     current_match: int
#     completed_matches: int
#     completed_wins: int
#     completed_points: float
#     trainer_team: list[BattlePokemonResponse]
#     opponent_team: list[BattlePokemonResponse]


# class BattlePokemonSelectionRequest(BaseModel):
#     trainer_slot: int


# class BattleMatchIntroResponse(BaseModel):
#     battle_id: str
#     status: str
#     current_match: int
#     trainer_pokemon: BattlePokemonResponse
#     opponent_pokemon: BattlePokemonResponse
#     first_attacker: str


# class BattleContinueResponse(BaseModel):
#     battle_id: str
#     status: str
#     current_match: int
#     trainer_pokemon: BattlePokemonResponse
#     opponent_pokemon: BattlePokemonResponse
#     trainer_current_hp: int
#     opponent_current_hp: int
#     first_attacker: str
#     turn: str
#     battle_log: list[str]


# class BattleMoveRequest(BaseModel):
#     move_id: int


# class BattleMoveResponse(BaseModel):
#     battle_id: str
#     status: str
#     current_match: int
#     trainer_pokemon: BattlePokemonResponse
#     opponent_pokemon: BattlePokemonResponse
#     trainer_current_hp: int
#     opponent_current_hp: int
#     turn: str
#     battle_log: list[str]
#     match_result: dict | None = None


from pydantic import BaseModel

class BattleMoveOptionResponse(BaseModel):
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
    moves: list[BattleMoveOptionResponse]


class BattleStartResponse(BaseModel):
    battle_id: str
    status: str
    current_match: int
    completed_matches: int
    completed_wins: int
    completed_points: float
    trainer_team: list[BattlePokemonResponse]
    opponent_team: list[BattlePokemonResponse]


class BattlePokemonSelectionRequest(BaseModel):
    trainer_slot: int


class BattleMatchIntroResponse(BaseModel):
    battle_id: str
    status: str
    current_match: int
    trainer_pokemon: BattlePokemonResponse
    opponent_pokemon: BattlePokemonResponse
    first_attacker: str


class BattleContinueResponse(BaseModel):
    battle_id: str
    status: str
    current_match: int
    trainer_pokemon: BattlePokemonResponse
    opponent_pokemon: BattlePokemonResponse
    trainer_current_hp: int
    trainer_max_hp: int
    opponent_current_hp: int
    opponent_max_hp: int
    first_attacker: str
    turn: str
    battle_log: list[str]


class BattleMoveRequest(BaseModel):
    move_id: int


class BattleMoveResponse(BaseModel):
    battle_id: str
    status: str
    current_match: int
    trainer_pokemon: BattlePokemonResponse
    opponent_pokemon: BattlePokemonResponse
    trainer_current_hp: int
    trainer_max_hp: int
    opponent_current_hp: int
    opponent_max_hp: int
    turn: str
    battle_log: list[str]
    match_result: dict | None = None