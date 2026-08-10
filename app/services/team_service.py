from sqlalchemy.orm import Session
from app.db.models import (
    Pokemon,
    PokemonMove,
    TrainerTeam,
)
from app.schemas.team import (
    TeamCreate,
    TeamResponse,
    TeamSlotResponse,
)

SPECIAL_CATEGORIES = {
    "legendary",
    "mythical",
    "ultra_beast",
}


def validate_team(
    db: Session,
    team_data: TeamCreate,
):
    """
    Validate the complete team before it is saved.

    Team rules:
        1. Exactly six Pokémon.
        2. Slots must be numbered 1 through 6.
        3. No duplicate Pokémon.
        4. At most one special Pokémon.
        5. Exactly four moves per Pokémon.
        6. No duplicate moves for a Pokémon.
        7. Every Pokémon must exist.
        8. Every selected move must be learnable by that Pokémon.

    Special Pokémon:
        - legendary
        - mythical
        - ultra_beast

    A team may contain:
        - 6 basic Pokémon
        - 5 basic + 1 legendary
        - 5 basic + 1 mythical
        - 5 basic + 1 ultra_beast
    """

    slots = team_data.slots

    # Validate number of slots
    if len(slots) != 6:
        raise ValueError(
            "A team must contain exactly 6 Pokémon."
        )

    # Validate slot numbers
    slot_numbers = [
        slot.slot
        for slot in slots
    ]

    if set(slot_numbers) != {1, 2, 3, 4, 5, 6}:
        raise ValueError(
            "Team slots must contain exactly slots 1 through 6."
        )

    # Validate duplicate Pokémon
    pokemon_ids = [
        slot.pokemon_id
        for slot in slots
    ]

    if len(set(pokemon_ids)) != 6:
        raise ValueError(
            "A Pokémon cannot appear more than once in a team."
        )

    validated_slots = []
    selected_pokemon = []

    # Validate each slot
    for slot in slots:
        # Retrieve Pokémon
        pokemon = (
            db.query(Pokemon)
            .filter(Pokemon.id == slot.pokemon_id)
            .first()
        )
        if pokemon is None:
            raise ValueError(
                f"Pokémon with ID {slot.pokemon_id} does not exist."
            )
        selected_pokemon.append(pokemon)

        # Validate move count
        if len(slot.move_ids) != 4:
            raise ValueError(
                f"{pokemon.display_name} must have exactly 4 moves."
            )

        # Validate duplicate moves
        if len(set(slot.move_ids)) != 4:
            raise ValueError(
                f"{pokemon.display_name} cannot have duplicate moves."
            )

        # Validate that each move is learnable
        # by the selected Pokémon
        for move_id in slot.move_ids:
            move_exists = (
                db.query(PokemonMove)
                .filter(
                    PokemonMove.pokemon_id == pokemon.id,
                    PokemonMove.move_id == move_id,
                )
                .first()
            )
            if move_exists is None:
                raise ValueError(
                    f"Move {move_id} cannot be learned by "
                    f"{pokemon.display_name}."
                )

        validated_slots.append(slot)

    # Validate special Pokémon limit
    special_pokemon = [
        pokemon
        for pokemon in selected_pokemon
        if pokemon.pokemon_category in SPECIAL_CATEGORIES
    ]

    if len(special_pokemon) > 1:
        special_names = ", ".join(
            pokemon.display_name
            for pokemon in special_pokemon
        )

        raise ValueError(
            "A team can contain at most one "
            "Legendary, Mythical, or Ultra Beast Pokémon. "
            f"Selected special Pokémons: {special_names}."
        )

    return validated_slots


def create_team(
    db: Session,
    trainer_id: int,
    team_data: TeamCreate,
) -> TeamResponse:
    """
    Create a trainer's finalized team.

    The complete team is validated before any
    database records are created.
    """

    # Check whether trainer already has a team
    existing_team = (
        db.query(TrainerTeam)
        .filter(
            TrainerTeam.trainer_id == trainer_id
        )
        .first()
    )

    if existing_team is not None:
        raise ValueError(
            "Trainer already has a team. "
            "Use the update operation instead."
        )

    # Validate team
    validated_slots = validate_team(
        db=db,
        team_data=team_data,
    )

    # Create database objects
    team_objects = []

    for slot in validated_slots:
        team_object = TrainerTeam(
            trainer_id=trainer_id,
            slot=slot.slot,
            pokemon_id=slot.pokemon_id,
            move1_id=slot.move_ids[0],
            move2_id=slot.move_ids[1],
            move3_id=slot.move_ids[2],
            move4_id=slot.move_ids[3],
        )

        team_objects.append(team_object)

    # Save team
    try:
        db.add_all(team_objects)
        db.commit()

    except Exception:
        db.rollback()
        raise

    # Return response
    return build_team_response(team_objects)


def get_team(
    db: Session,
    trainer_id: int,
) -> TeamResponse | None:
    """
    Retrieve the trainer's current team.
    """
    team = (
        db.query(TrainerTeam)
        .filter(
            TrainerTeam.trainer_id == trainer_id
        )
        .order_by(TrainerTeam.slot)
        .all()
    )

    if not team:
        return None

    return build_team_response(team)


def update_team(
    db: Session,
    trainer_id: int,
    team_data: TeamCreate,
) -> TeamResponse:
    """
    Replace the trainer's existing team with a
    newly finalized team.

    The new team is fully validated before the
    existing team is deleted.
    """

    # Validate the new team first
    validated_slots = validate_team(
        db=db,
        team_data=team_data,
    )

    # Retrieve existing team
    existing_team = (
        db.query(TrainerTeam)
        .filter(
            TrainerTeam.trainer_id == trainer_id
        )
        .all()
    )

    if not existing_team:
        raise ValueError(
            "Trainer does not have an existing team. "
            "Use the create operation instead."
        )

    # Remove old team
    for team_object in existing_team:
        db.delete(team_object)

    # Create new team
    new_team_objects = []

    for slot in validated_slots:
        team_object = TrainerTeam(
            trainer_id=trainer_id,
            slot=slot.slot,
            pokemon_id=slot.pokemon_id,
            move1_id=slot.move_ids[0],
            move2_id=slot.move_ids[1],
            move3_id=slot.move_ids[2],
            move4_id=slot.move_ids[3],
        )

        new_team_objects.append(team_object)
        db.add(team_object)

    # Save changes
    try:
        db.commit()

    except Exception:
        db.rollback()
        raise

    # Return response
    return build_team_response(new_team_objects)


def build_team_response(
    team_objects: list[TrainerTeam],
) -> TeamResponse:
    """
    Convert TrainerTeam ORM objects into
    the TeamResponse schema.
    """

    slots = []
    for team_object in sorted(
        team_objects,
        key=lambda team: team.slot,
    ):

        slots.append(
            TeamSlotResponse(
                slot=team_object.slot,
                pokemon_id=team_object.pokemon_id,
                move_ids=[
                    team_object.move1_id,
                    team_object.move2_id,
                    team_object.move3_id,
                    team_object.move4_id,
                ],
            )
        )

    return TeamResponse(
        slots=slots
    )