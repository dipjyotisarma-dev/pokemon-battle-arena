import random
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.db.models import (
    Battle,
    User,
    Leaderboard,
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
    "match_preparation",
    "trainer_selection",
    "match_intro",
    "in_progress",
}

TYPE_ADVANTAGES = {
    "Normal": [],
    "Fire": ["Grass", "Ice", "Bug", "Steel"],
    "Water": ["Fire", "Ground", "Rock"],
    "Electric": ["Water", "Flying"],
    "Grass": ["Water", "Ground", "Rock"],
    "Ice": ["Grass", "Ground", "Flying", "Dragon"],
    "Fighting": ["Normal", "Ice", "Rock", "Dark", "Steel"],
    "Poison": ["Grass", "Fairy"],
    "Ground": ["Fire", "Electric", "Poison", "Rock", "Steel"],
    "Flying": ["Grass", "Fighting", "Bug"],
    "Psychic": ["Fighting", "Poison"],
    "Bug": ["Grass", "Psychic", "Dark"],
    "Rock": ["Fire", "Ice", "Flying", "Bug"],
    "Ghost": ["Psychic", "Ghost"],
    "Dragon": ["Dragon"],
    "Dark": ["Psychic", "Ghost"],
    "Steel": ["Ice", "Rock", "Fairy"],
    "Fairy": ["Fighting", "Dragon", "Dark"],
}

TYPE_DISADVANTAGES = {
    "Normal": ["Rock", "Steel"],
    "Fire": ["Fire", "Water", "Rock", "Dragon"],
    "Water": ["Water", "Grass", "Dragon"],
    "Electric": ["Electric", "Grass", "Dragon"],
    "Grass": ["Fire", "Grass", "Poison", "Flying", "Bug", "Dragon", "Steel"],
    "Ice": ["Fire", "Water", "Ice", "Steel"],
    "Fighting": ["Poison", "Flying", "Psychic", "Bug", "Fairy"],
    "Poison": ["Poison", "Ground", "Rock", "Ghost"],
    "Ground": ["Grass", "Bug"],
    "Flying": ["Electric", "Rock", "Steel"],
    "Psychic": ["Psychic", "Steel"],
    "Bug": ["Fire", "Fighting", "Poison", "Flying", "Ghost", "Steel", "Fairy"],
    "Rock": ["Fighting", "Ground", "Steel"],
    "Ghost": ["Dark"],
    "Dragon": ["Steel"],
    "Dark": ["Fighting", "Dark", "Fairy"],
    "Steel": ["Fire", "Water", "Electric", "Steel"],
    "Fairy": ["Fire", "Poison", "Steel"],
}


def calculate_damage(
    attacker: dict,
    defender: dict,
    move: dict,
):
    """
    Calculate damage using the original game's
    battle-damage mechanics.
    """

    move_type = move["move_type"]
    power = move["base_power"]

    effectiveness = 1.0

    advantages = TYPE_ADVANTAGES.get(
        move_type,
        [],
    )

    disadvantages = TYPE_DISADVANTAGES.get(
        move_type,
        [],
    )

    defender_type1 = defender["type1"]
    defender_type2 = defender["type2"]

    if defender_type1 in advantages:
        effectiveness += 0.5

    if defender_type2 and defender_type2 in advantages:
        effectiveness += 0.5

    if defender_type1 in disadvantages:
        effectiveness -= 0.5

    if defender_type2 and defender_type2 in disadvantages:
        effectiveness -= 0.5

    if move["category"] == "special":
        attack_stat = attacker["special_attack"]
        defense_stat = defender["special_defense"]
    else:
        attack_stat = attacker["attack"]
        defense_stat = defender["defense"]

    damage = (
        power
        * (attack_stat / defense_stat)
        * effectiveness
    )

    return max(0, int(damage))


def get_active_move(
    pokemon: dict,
    move_id: int,
):
    """
    Find a move in the active Pokémon's four selected moves.
    """

    for move in pokemon["moves"]:
        if move["id"] == move_id:
            return move

    return None


def execute_attack(
    attacker: dict,
    defender: dict,
    defender_hp: int,
    move: dict,
):
    """
    Execute one attack and return the resulting HP,
    damage, and battle-log message.
    """
    damage = calculate_damage(
        attacker=attacker,
        defender=defender,
        move=move,
    )

    new_hp = max(
        0,
        defender_hp - damage,
    )

    log = (
        f"{attacker['display_name']} used "
        f"{move['display_name']} and dealt "
        f"{damage} damage."
    )

    return new_hp, damage, log


def build_attack_event(
    actor: str,
    attacker: dict,
    target: dict,
    move: dict,
    damage: int,
):
    """
    Create a structured event for one Pokémon attack.
    """

    return {
        "type": "attack",
        "actor": actor,
        "pokemon": attacker["display_name"],
        "target": target["display_name"],
        "move": move["display_name"],
        "move_type": move["move_type"],
        "category": move["category"],
        "base_power": move["base_power"],
        "damage": damage,
        "message": (
            f"{attacker['display_name']} used "
            f"{move['display_name']} and dealt "
            f"{damage} damage."
        ),
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
        "battle_max_hp": (pokemon.hp * 3) + (pokemon.bst // 2),
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


def complete_match(
    db: Session,
    battle: Battle,
    state: dict,
    winner: str,
):
    """
    Finalize one completed Pokémon match.
    Calculates match points, stores the match result,
    updates Battle statistics, and immediately updates
    the trainer's leaderboard entry.

    This function advances current_match when another
    match remains in the battle.
    """

    trainer_max_hp = state["trainer_max_hp"]
    trainer_remaining_hp = state["trainer_current_hp"]

    opponent_max_hp = state["opponent_max_hp"]
    opponent_remaining_hp = state["opponent_current_hp"]

    if trainer_max_hp <= 0 or opponent_max_hp <= 0:
        raise ValueError(
            "Invalid battle HP values for match scoring."
        )

    damage_ratio = (opponent_max_hp - opponent_remaining_hp) / opponent_max_hp

    loss_ratio = (trainer_max_hp - trainer_remaining_hp) / trainer_max_hp

    base_points = (damage_ratio - loss_ratio) * 100

    if winner == "trainer":
        match_points = 10 + base_points

    elif winner == "opponent":
        match_points = base_points

    else:
        raise ValueError(
            "Invalid match winner."
        )

    match_result = {
        "match": battle.current_match,
        "trainer_slot": state["trainer_slot"],
        "opponent_slot": state["opponent_slot"],
        "trainer_pokemon": state["trainer_pokemon"]["display_name"],
        "opponent_pokemon": state["opponent_pokemon"]["display_name"],
        "trainer_max_hp": trainer_max_hp,
        "trainer_remaining_hp": trainer_remaining_hp,
        "opponent_max_hp": opponent_max_hp,
        "opponent_remaining_hp": opponent_remaining_hp,
        "damage_ratio": damage_ratio,
        "loss_ratio": loss_ratio,
        "base_points": base_points,
        "match_points": match_points,
        "winner": winner,
    }

    match_history = list(
        battle.match_history or []
    )

    match_history.append(match_result)

    battle.match_history = match_history

    battle.completed_matches += 1

    if winner == "trainer":
        battle.completed_wins += 1

    battle.completed_points += match_points

    # Store the completed match result in the current
    # state so it can be returned in the API response.
    state["match_result"] = match_result
    state["match_points"] = match_points
    state["status"] = "match_complete"

    # The completed match is finished. Move directly
    # to the next match if matches remain.
    if battle.completed_matches < 6:
        battle.current_match += 1
        battle.status = "match_preparation"
    else:
        battle.status = "battle_complete"

    battle.current_match_state = state

    # Update leaderboard immediately
    leaderboard = (
        db.query(Leaderboard)
        .filter(
            Leaderboard.trainer_id == battle.trainer_id
        )
        .first()
    )

    if leaderboard is None:
        raise ValueError(
            "Leaderboard entry not found for trainer."
        )

    leaderboard.total_matches += 1
    leaderboard.points += match_points

    if winner == "trainer":
        leaderboard.wins += 1

    return match_result



def get_pokemon_by_slot(
    team: list,
    slot: int,
):
    """
    Return a Pokémon from a battle team using its slot.
    """
    for pokemon in team:
        if pokemon["slot"] == slot:
            return pokemon

    return None


def select_ai_pokemon(
    opponent_team: list,
    used_slots: list,
):
    """
    Randomly select one unused Pokémon from the AI team.
    """

    available_pokemon = [
        pokemon
        for pokemon in opponent_team
        if pokemon["slot"] not in used_slots
    ]

    if not available_pokemon:
        raise ValueError(
            "No unused opponent Pokémon are available."
        )

    return random.choice(available_pokemon)


def start_match(
    db: Session,
    battle_id: str,
    trainer_id: int,
):
    """
    Prepare the next Pokémon match by selecting an unused
    AI Pokémon.

    The trainer has not selected their Pokémon yet.
    """

    battle = (
        db.query(Battle)
        .filter(
            Battle.id == battle_id,
            Battle.trainer_id == trainer_id,
        )
        .first()
    )

    if battle is None:
        raise ValueError(
            "Battle not found."
        )

    if battle.status != "match_preparation":
        raise ValueError(
            "The next match cannot be started from the current battle state."
        )

    if battle.current_match < 1 or battle.current_match > 6:
        raise ValueError(
            "Invalid current match."
        )

    match_history = battle.match_history or []

    used_opponent_slots = [
        match["opponent_slot"]
        for match in match_history
    ]

    opponent_pokemon = select_ai_pokemon(
        battle.opponent_team,
        used_opponent_slots,
    )

    current_match_state = {
        "opponent_slot": opponent_pokemon["slot"],
        "opponent_pokemon": opponent_pokemon,
        "status": "trainer_selection",
    }

    battle.current_match_state = current_match_state
    battle.status = "trainer_selection"
    battle.updated_at = datetime.now(timezone.utc)

    try:
        db.commit()
        db.refresh(battle)

    except Exception:
        db.rollback()
        raise

    return battle


def select_pokemon_for_match(
    db: Session,
    battle_id: str,
    trainer_id: int,
    trainer_slot: int,
):
    """
    Select the trainer's Pokémon after the AI opponent
    has already been revealed.
    The match is then placed into match_intro state.
    """
    battle = (
        db.query(Battle)
        .filter(
            Battle.id == battle_id,
            Battle.trainer_id == trainer_id,
        )
        .first()
    )

    if battle is None:
        raise ValueError(
            "Battle not found."
        )

    if battle.status != "trainer_selection":
        raise ValueError(
            "Pokémon selection is not available in the current battle state."
        )

    if battle.current_match < 1 or battle.current_match > 6:
        raise ValueError(
            "Invalid current match."
        )

    if battle.current_match_state is None:
        raise ValueError(
            "Current match state is missing."
        )

    current_match_state = dict(
        battle.current_match_state
    )

    opponent_pokemon = current_match_state.get(
        "opponent_pokemon"
    )

    if opponent_pokemon is None:
        raise ValueError(
            "Opponent Pokémon has not been selected."
        )

    trainer_pokemon = get_pokemon_by_slot(
        battle.trainer_team,
        trainer_slot,
    )

    if trainer_pokemon is None:
        raise ValueError(
            f"Invalid trainer slot: {trainer_slot}."
        )

    # Get previously used trainer slots.
    match_history = battle.match_history or []

    used_trainer_slots = [
        match["trainer_slot"]
        for match in match_history
    ]

    if trainer_slot in used_trainer_slots:
        raise ValueError(
            "This Pokémon has already participated in a match."
        )

    # Determine first attacker.
    trainer_speed = trainer_pokemon["speed"]
    opponent_speed = opponent_pokemon["speed"]

    if trainer_speed > opponent_speed:
        first_attacker = "trainer"

    elif opponent_speed > trainer_speed:
        first_attacker = "opponent"

    else:
        first_attacker = random.choice(
            ["trainer", "opponent"]
        )

    # Complete the current match state.
    current_match_state.update({
        "trainer_slot": trainer_slot,
        "trainer_pokemon": trainer_pokemon,
        "trainer_current_hp": trainer_pokemon["battle_max_hp"],
        "trainer_max_hp": trainer_pokemon["battle_max_hp"],
        "opponent_current_hp": opponent_pokemon["battle_max_hp"],
        "opponent_max_hp": opponent_pokemon["battle_max_hp"],
        "first_attacker": first_attacker,
        "turn": first_attacker,
        "status": "match_intro",
        "battle_log": [],
    })

    battle.current_match_state = current_match_state
    battle.status = "match_intro"
    battle.updated_at = datetime.now(timezone.utc)

    try:
        db.commit()
        db.refresh(battle)

    except Exception:
        db.rollback()
        raise

    return battle


def back_to_trainer_selection(
    db: Session,
    battle_id: str,
    trainer_id: int,
):
    """
    Return from the match introduction screen to
    trainer Pokémon selection.

    The selected trainer Pokémon is discarded.
    The already-selected AI opponent remains unchanged.
    """

    battle = (
        db.query(Battle)
        .filter(
            Battle.id == battle_id,
            Battle.trainer_id == trainer_id,
        )
        .first()
    )

    if battle is None:
        raise ValueError(
            "Battle not found."
        )

    if battle.status != "match_intro":
        raise ValueError(
            "Cannot return to Pokémon selection from the current battle state."
        )

    if battle.current_match_state is None:
        raise ValueError(
            "Current match state is missing."
        )

    current_match_state = dict(
        battle.current_match_state
    )

    opponent_pokemon = current_match_state.get(
        "opponent_pokemon"
    )

    opponent_slot = current_match_state.get(
        "opponent_slot"
    )

    if opponent_pokemon is None or opponent_slot is None:
        raise ValueError(
            "Opponent Pokémon has not been selected."
        )

    # Keep only the opponent information.
    # The trainer's previous selection is discarded.
    battle.current_match_state = {
        "opponent_slot": opponent_slot,
        "opponent_pokemon": opponent_pokemon,
        "status": "trainer_selection",
    }

    battle.status = "trainer_selection"
    battle.updated_at = datetime.now(timezone.utc)

    try:
        db.commit()
        db.refresh(battle)

    except Exception:
        db.rollback()
        raise

    return battle


def exit_battle(
    db: Session,
    battle_id: str,
    trainer_id: int,
):
    """
    Abandon the current battle.

    Only completed matches count toward the trainer's
    completed statistics. Any unfinished current match
    is discarded.
    """

    battle = (
        db.query(Battle)
        .filter(
            Battle.id == battle_id,
            Battle.trainer_id == trainer_id,
        )
        .first()
    )

    if battle is None:
        raise ValueError(
            "Battle not found."
        )

    if battle.status not in ACTIVE_BATTLE_STATUSES:
        raise ValueError(
            "The battle cannot be exited from its current state."
        )

    # Preserve all completed-match data.
    completed_matches = battle.completed_matches
    completed_wins = battle.completed_wins
    completed_points = battle.completed_points

    # Discard the unfinished current match completely.
    battle.current_match_state = None

    # Mark the battle as abandoned.
    battle.status = "abandoned"
    battle.updated_at = datetime.now(timezone.utc)

    # Calculate the trainer's current leaderboard rank.
    leaderboard_entries = (
        db.query(User, Leaderboard)
        .join(
            Leaderboard,
            User.id == Leaderboard.trainer_id,
        )
        .filter(
            User.role == "trainer"
        )
        .order_by(
            Leaderboard.points.desc(),
            Leaderboard.wins.desc(),
            Leaderboard.total_matches.asc(),
            User.username.asc(),
        )
        .all()
    )

    rank = None

    for position, (user, leaderboard) in enumerate(
        leaderboard_entries,
        start=1,
    ):
        if user.id == trainer_id:
            rank = position
            break

    try:
        db.commit()
        db.refresh(battle)

    except Exception:
        db.rollback()
        raise

    return (
        battle,
        completed_matches,
        completed_wins,
        completed_points,
        rank,
    )


def continue_battle(
    db: Session,
    battle_id: str,
    trainer_id: int,
):
    """
    Move the current battle from match_intro
    to an active in-progress match.
    """

    battle = (
        db.query(Battle)
        .filter(
            Battle.id == battle_id,
            Battle.trainer_id == trainer_id,
        )
        .first()
    )

    if battle is None:
        raise ValueError(
            "Battle not found."
        )

    if battle.status != "match_intro":
        raise ValueError(
            "Battle cannot be continued from its current state."
        )

    if battle.current_match_state is None:
        raise ValueError(
            "Current match state is missing."
        )

    match_state = dict(
        battle.current_match_state
    )

    match_state["status"] = "in_progress"

    events = []

    match_state["turn"] = match_state["first_attacker"]

    # If AI is faster, execute its first attack now.
    if match_state["turn"] == "opponent":

        opponent_pokemon = match_state["opponent_pokemon"]
        trainer_pokemon = match_state["trainer_pokemon"]

        opponent_move = random.choice(
            opponent_pokemon["moves"]
        )

        trainer_hp, damage, log = execute_attack(
            attacker=opponent_pokemon,
            defender=trainer_pokemon,
            defender_hp=match_state["trainer_current_hp"],
            move=opponent_move,
        )

        events.append(
            build_attack_event(
                actor="opponent",
                attacker=opponent_pokemon,
                target=trainer_pokemon,
                move=opponent_move,
                damage=damage,
            )
        )

        battle_log = list(
            match_state.get("battle_log", [])
        )

        battle_log.append(log)

        match_state["trainer_current_hp"] = trainer_hp
        match_state["battle_log"] = battle_log

        if trainer_hp <= 0:
            battle_log.append(
                f"{trainer_pokemon['display_name']} fainted."
            )

            events.append(
                {
                    "type": "faint",
                    "actor": "opponent",
                    "pokemon": trainer_pokemon["display_name"],
                    "message": (
                        f"{trainer_pokemon['display_name']} fainted."
                    ),
                }
            )

            match_state["trainer_current_hp"] = 0
            match_state["battle_log"] = battle_log
            match_state['events'] = events

            complete_match(
                db=db,
                battle=battle,
                state=match_state,
                winner="opponent",
            )

        else:
            match_state["turn"] = "trainer"
            match_state["events"] = events
            battle.status = "in_progress"

    else:
        battle.status = "in_progress"

    battle.current_match_state = match_state
    battle.updated_at = datetime.now(timezone.utc)

    try:
        db.commit()
        db.refresh(battle)

    except Exception:
        db.rollback()
        raise

    return battle


def execute_trainer_move(
    db: Session,
    battle_id: str,
    trainer_id: int,
    move_id: int,
):
    """
    Execute the trainer's selected move and, if the
    opponent survives, execute the AI's response.
    One API call represents one complete turn cycle.
    """
    battle = (
        db.query(Battle)
        .filter(
            Battle.id == battle_id,
            Battle.trainer_id == trainer_id,
        )
        .first()
    )

    if battle is None:
        raise ValueError(
            "Battle not found."
        )

    if battle.status != "in_progress":
        raise ValueError(
            "The battle is not currently in progress."
        )

    if battle.current_match_state is None:
        raise ValueError(
            "Current match state is missing."
        )

    state = dict(
        battle.current_match_state
    )
    events = []

    if state["turn"] != "trainer":
        raise ValueError(
            "It is not the trainer's turn."
        )

    trainer_pokemon = state["trainer_pokemon"]
    opponent_pokemon = state["opponent_pokemon"]

    trainer_hp = state["trainer_current_hp"]
    opponent_hp = state["opponent_current_hp"]

    # Validate trainer move
    trainer_move = get_active_move(
        trainer_pokemon,
        move_id,
    )

    if trainer_move is None:
        raise ValueError(
            "Selected move is not available to the active Pokémon."
        )

    battle_log = list(
        state.get("battle_log", [])
    )

    # Trainer attacks
    opponent_hp, damage, log = execute_attack(
        attacker=trainer_pokemon,
        defender=opponent_pokemon,
        defender_hp=opponent_hp,
        move=trainer_move,
    )

    events.append(
        build_attack_event(
            actor="trainer",
            attacker=trainer_pokemon,
            target=opponent_pokemon,
            move=trainer_move,
            damage=damage,
        )
    )

    battle_log.append(log)

    # Opponent defeated
    if opponent_hp <= 0:

        battle_log.append(
            f"{opponent_pokemon['display_name']} fainted."
        )

        events.append(
            {
                "type": "faint",
                "actor": "trainer",
                "pokemon": opponent_pokemon["display_name"],
                "message": (
                    f"{opponent_pokemon['display_name']} fainted."
                ),
            }
        )

        state["opponent_current_hp"] = 0
        state["battle_log"] = battle_log
        state["events"] = events

        complete_match(
            db=db,
            battle=battle,
            state=state,
            winner="trainer",
        )

        battle.updated_at = datetime.now(timezone.utc)

        try:
            db.commit()
            db.refresh(battle)

        except Exception:
            db.rollback()
            raise

        return battle

    # AI chooses random move
    opponent_move = random.choice(
        opponent_pokemon["moves"]
    )

    trainer_hp, damage, log = execute_attack(
        attacker=opponent_pokemon,
        defender=trainer_pokemon,
        defender_hp=trainer_hp,
        move=opponent_move,
    )

    events.append(
        build_attack_event(
            actor="opponent",
            attacker=opponent_pokemon,
            target=trainer_pokemon,
            move=opponent_move,
            damage=damage,
        )
    )

    battle_log.append(log)

    # Trainer defeated
    if trainer_hp <= 0:
        battle_log.append(
            f"{trainer_pokemon['display_name']} fainted."
        )

        events.append(
            {
                "type": "faint",
                "actor": "opponent",
                "pokemon": trainer_pokemon["display_name"],
                "message": (
                    f"{trainer_pokemon['display_name']} fainted."
                ),
            }
        )

        state["trainer_current_hp"] = 0
        state["opponent_current_hp"] = opponent_hp
        state["battle_log"] = battle_log
        state["events"] = events

        complete_match(
            db=db,
            battle=battle,
            state=state,
            winner="opponent",
        )
        battle.updated_at = datetime.now(timezone.utc)

        try:
            db.commit()
            db.refresh(battle)

        except Exception:
            db.rollback()
            raise

        return battle

    # Both Pokémon survive
    state["trainer_current_hp"] = trainer_hp
    state["opponent_current_hp"] = opponent_hp
    state["turn"] = "trainer"
    state["status"] = "in_progress"
    state["battle_log"] = battle_log
    state["events"] = events

    battle.current_match_state = state
    battle.status = "in_progress"
    battle.updated_at = datetime.now(timezone.utc)

    try:
        db.commit()
        db.refresh(battle)

    except Exception:
        db.rollback()
        raise

    return battle


def start_battle(
    db: Session,
    trainer_id: int,
):
    """
    Create a new battle for a trainer.
    The battle starts in match_preparation state.
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
        status="match_preparation",
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