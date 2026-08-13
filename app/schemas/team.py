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


class TeamSlotResponse(BaseModel):
    """
    Represents one saved team slot.
    """
    slot: int
    pokemon_id: int
    move_ids: list[int]


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