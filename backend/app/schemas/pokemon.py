from pydantic import BaseModel, ConfigDict


class PokemonListItem(BaseModel):
    """
    Lightweight Pokémon representation used for search results.
    """
    id: int
    display_name: str
    image: str

    model_config = ConfigDict(
        from_attributes=True
    )


class PokemonResponse(BaseModel):
    """
    Complete Pokémon information.
    """
    id: int
    name: str
    display_name: str
    type1: str
    type2: str | None = None
    hp: int
    attack: int
    defense: int
    special_attack: int
    special_defense: int
    speed: int
    bst: int
    image: str
    pokemon_category: str

    model_config = ConfigDict(
        from_attributes=True
    )


class MoveResponse(BaseModel):
    """
    Move information available to a Pokémon.
    """
    id: int
    move_name: str
    display_name: str
    move_type: str
    category: str
    base_power: int

    model_config = ConfigDict(
        from_attributes=True
    )