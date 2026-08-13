import random
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.db.models import (
    Battle,
    Pokemon,
    PokemonMove,
    TrainerTeam,
)


SPECIAL_CATEGORIES = {
    "legendary",
    "mythical",
    "ultra_beast",
}


ACTIVE_BATTLE_STATUSES = {
    "team_selection",
    "match_intro",
    "in_progress",
    "match_complete",
}


def build_pokemon_snapshot(
    pokemon: Pokemon,
    moves: list,
    slot: int | None = None,
):
    """
    Create a serializable Pokémon snapshot for a battle.
    """
    return {
        "slot": slot,
        "id": pokemon.id,
        "name": pokemon.name,
        "display_name": pokemon.display_name,
        "type1": pokemon.type1,
        "type2": pokemon.type2,
        "hp": pokemon.hp,
        "attack": pokemon.attack,
        "defense": pokemon.defense,
        "special_attack": pokemon.special_attack,
        "special_defense": pokemon.special_defense,
        "speed": pokemon.speed,
        "bst": pokemon.bst,
        "image": pokemon.image,
        "pokemon_category": pokemon.pokemon_category,
        "moves": [
            {
                "id": move.id,
                "move_name": move.move_name,
                "display_name": move.display_name,
                "move_type": move.move_type,
                "category": move.category,
                "base_power": move.base_power,
            }
            for move in moves
        ],
    }


def build_trainer_team_snapshot(
    db: Session,
    trainer_id: int,
):
    """
    Create a snapshot of the trainer's finalized team.
    The saved team contains exactly six Pokémon and
    four trainer-selected moves per Pokémon.
    """

    team = (
        db.query(TrainerTeam)
        .filter(
            TrainerTeam.trainer_id == trainer_id
        )
        .order_by(TrainerTeam.slot)
        .all()
    )

    if len(team) != 6:
        raise ValueError(
            "Trainer must have a complete team of 6 Pokémon "
            "before starting a battle."
        )

    snapshots = []

    for team_slot in team:

        moves = [
            team_slot.move1,
            team_slot.move2,
            team_slot.move3,
            team_slot.move4,
        ]

        if any(move is None for move in moves):
            raise ValueError(
                f"{team_slot.pokemon.display_name} "
                "does not have four valid moves."
            )

        snapshots.append(
            build_pokemon_snapshot(
                pokemon=team_slot.pokemon,
                moves=moves,
                slot=team_slot.slot,
            )
        )

    return snapshots


def get_ai_eligible_pokemon(
    db: Session,
):
    """
    Return Pokémon that have at least four learnable moves.
    Every AI Pokémon needs four moves for battle.
    """

    pokemon_list = db.query(Pokemon).all()
    eligible = []

    for pokemon in pokemon_list:
        moves = [
            pokemon_move.move
            for pokemon_move in pokemon.available_moves
            if pokemon_move.move is not None
        ]
        if len(moves) >= 4:
            eligible.append(
                (
                    pokemon,
                    moves,
                )
            )

    return eligible


def generate_ai_team(
    db: Session,
):
    """
    Generate a random valid six-Pokémon AI team.
    Rules:
        - Exactly six Pokémon.
        - No duplicate Pokémon.
        - At most one Legendary, Mythical, or Ultra Beast.
        - Each Pokémon has exactly four moves.
    """

    eligible_pokemon = get_ai_eligible_pokemon(db)

    basic_pokemon = [
        item
        for item in eligible_pokemon
        if item[0].pokemon_category not in SPECIAL_CATEGORIES
    ]

    special_pokemon = [
        item
        for item in eligible_pokemon
        if item[0].pokemon_category in SPECIAL_CATEGORIES
    ]

    if len(basic_pokemon) < 5:
        raise ValueError(
            "Not enough basic Pokémon are available "
            "to generate an AI team."
        )

    # Randomly decide whether this AI team gets one special Pokémon.
    use_special = (
        bool(special_pokemon)
        and random.choice([True, False])
    )

    if use_special:

        selected_basic = random.sample(
            basic_pokemon,
            5,
        )

        selected_special = random.choice(
            special_pokemon
        )

        selected_pokemon = (
            selected_basic
            + [selected_special]
        )

    else:

        if len(basic_pokemon) < 6:
            raise ValueError(
                "Not enough basic Pokémon are available "
                "to generate an all-basic AI team."
            )

        selected_pokemon = random.sample(
            basic_pokemon,
            6,
        )

    # Shuffle team positions after selection.
    random.shuffle(selected_pokemon)

    snapshots = []

    for slot, (pokemon, available_moves) in enumerate(
        selected_pokemon,
        start=1,
    ):

        selected_moves = random.sample(
            available_moves,
            4,
        )

        snapshots.append(
            build_pokemon_snapshot(
                pokemon=pokemon,
                moves=selected_moves,
                slot=slot,
            )
        )

    return snapshots



def start_battle(
    db: Session,
    trainer_id: int,
):
    """
    Create a new battle for a trainer.
    The battle starts in team_selection state.
    """

    # Prevent multiple active battles for the same trainer.
    existing_battle = (
        db.query(Battle)
        .filter(
            Battle.trainer_id == trainer_id,
            Battle.status.in_(ACTIVE_BATTLE_STATUSES),
        )
        .first()
    )

    if existing_battle is not None:
        raise ValueError(
            "You already have an active battle."
        )

    # Snapshot trainer's finalized team.
    trainer_team = build_trainer_team_snapshot(
        db=db,
        trainer_id=trainer_id,
    )

    # Generate random AI team.
    opponent_team = generate_ai_team(
        db=db,
    )

    now = datetime.now(timezone.utc)

    battle = Battle(
        trainer_id=trainer_id,
        status="team_selection",
        current_match=1,
        completed_matches=0,
        completed_wins=0,
        completed_points=0.0,
        trainer_team=trainer_team,
        opponent_team=opponent_team,
        current_match_state=None,
        match_history=[],
        created_at=now,
        updated_at=now,
    )

    try:
        db.add(battle)
        db.commit()
        db.refresh(battle)

    except Exception:
        db.rollback()
        raise

    return battle