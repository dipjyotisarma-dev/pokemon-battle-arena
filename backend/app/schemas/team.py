from pydantic import BaseModel, Field


class TeamSlotCreate(BaseModel):
    """
    Represents one Pokémon slot in a team draft.
    """
    slot: int = Field(
        ge=1,
        le=6,
        description="Team slot number."
    )
    pokemon_id: int = Field(
        ge=1,
        description="Pokédex ID of the selected Pokémon."
    )
    move_ids: list[int] = Field(
        min_length=4,
        max_length=4,
        description="Exactly four selected move IDs."
    )


class TeamCreate(BaseModel):
    """
    Represents the complete team submitted for finalization.
    """
    slots: list[TeamSlotCreate] = Field(
        min_length=6,
        max_length=6,
        description="Exactly six Pokémon slots."
    )


class TeamMoveResponse(BaseModel):
    """
    Represents complete information about a move
    selected for a trainer's team.
    """
    id: int
    move_name: str
    display_name: str
    move_type: str
    category: str
    base_power: int


class TeamPokemonResponse(BaseModel):
    """
    Represents complete information about a Pokémon
    selected for a trainer's team.
    """
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


class TeamSlotResponse(BaseModel):
    """
    Represents one saved team slot.

    The original IDs are retained for compatibility,
    while complete Pokémon and move information is
    also returned for frontend use.
    """
    slot: int
    pokemon_id: int
    move_ids: list[int]
    pokemon: TeamPokemonResponse
    moves: list[TeamMoveResponse]


class TeamResponse(BaseModel):
    """
    Represents a trainer's complete team.
    """
    slots: list[TeamSlotResponse]


class MoveOptionResponse(BaseModel):
    """
    Represents a move offered to the trainer
    during team building.
    """
    id: int
    move_name: str
    display_name: str
    move_type: str
    category: str
    base_power: int