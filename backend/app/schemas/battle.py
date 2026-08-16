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


class BattleEventResponse(BaseModel):
    type: str
    actor: str | None = None
    pokemon: str | None = None
    target: str | None = None
    move: str | None = None
    move_type: str | None = None
    category: str | None = None
    base_power: int | None = None
    damage: int | None = None
    message: str | None = None


class BattleMatchResultResponse(BaseModel):
    match: int
    trainer_slot: int
    opponent_slot: int
    trainer_pokemon: str
    opponent_pokemon: str
    trainer_max_hp: int
    trainer_remaining_hp: int
    opponent_max_hp: int
    opponent_remaining_hp: int
    damage_ratio: float
    loss_ratio: float
    base_points: float
    match_points: float
    winner: str


class BattleExitResponse(BaseModel):
    battle_id: str
    status: str
    completed_matches: int
    completed_wins: int
    completed_points: float
    rank: int | None


class BattleTeamPreviewResponse(BaseModel):
    slot: int
    id: int
    name: str
    display_name: str
    image: str


class BattleStartResponse(BaseModel):
    battle_id: str
    status: str
    current_match: int
    completed_matches: int
    completed_wins: int
    completed_points: float
    trainer_team: list[BattleTeamPreviewResponse]
    opponent_team: list[BattleTeamPreviewResponse]


class BattleMatchStartResponse(BaseModel):
    battle_id: str
    status: str
    current_match: int
    opponent_pokemon: BattlePokemonResponse
    available_trainer_pokemon: list[BattlePokemonResponse]


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
    events: list[BattleEventResponse]
    battle_log: list[str]
    match_result: BattleMatchResultResponse | None = None
    match_points: float | None = None
    completed_matches: int
    completed_wins: int
    completed_points: float


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
    turn: str | None
    events: list[BattleEventResponse]
    battle_log: list[str]
    match_result: BattleMatchResultResponse | None = None
    match_points: float | None = None
    completed_matches: int
    completed_wins: int
    completed_points: float