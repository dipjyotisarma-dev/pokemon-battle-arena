from sqlalchemy.orm import Session

import sys
from pathlib import Path


# --------------------------------------------------
# Add project root to Python path
# --------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(PROJECT_ROOT))


from app.db.database import SessionLocal
from app.schemas.team import TeamCreate, TeamSlotCreate
from app.services.team_service import validate_team


# --------------------------------------------------
# Helper: create team data
# --------------------------------------------------

def create_team_data(
    pokemon_ids,
    move_ids,
):
    """
    Create a TeamCreate object from Pokémon IDs
    and their corresponding move IDs.
    """

    slots = []

    for index in range(6):

        slots.append(
            TeamSlotCreate(
                slot=index + 1,
                pokemon_id=pokemon_ids[index],
                move_ids=move_ids[index],
            )
        )

    return TeamCreate(
        slots=slots
    )


# --------------------------------------------------
# Helper: run one validation test
# --------------------------------------------------

def run_test(
    db: Session,
    test_name: str,
    team_data: TeamCreate,
    should_pass: bool,
):
    """
    Run one team validation test and report the result.
    """

    try:

        validate_team(
            db=db,
            team_data=team_data,
        )

        if should_pass:

            print(f"PASS: {test_name}")

        else:

            print(
                f"FAIL: {test_name} "
                "(team should have been rejected)"
            )

    except ValueError as error:

        if should_pass:

            print(
                f"FAIL: {test_name}"
            )

            print(
                f"    Unexpected error: {error}"
            )

        else:

            print(
                f"PASS: {test_name}"
            )

            print(
                f"    Correctly rejected: {error}"
            )


# --------------------------------------------------
# Test cases
# --------------------------------------------------

def main():

    db = SessionLocal()

    try:

        # ==================================================
        # Pokémon and valid moves from the current database
        # ==================================================

        charizard = 6
        gengar = 94
        gyarados = 130
        tyranitar = 248
        metagross = 376
        garchomp = 445

        articuno = 144
        mew = 151
        nihilego = 793


        # ==================================================
        # Valid move sets
        # ==================================================

        charizard_moves = [
            5,      # Mega Punch
            10,     # Scratch
            15,     # Cut
            25,     # Mega Kick
        ]

        gengar_moves = [
            5,      # Mega Punch
            25,     # Mega Kick
            34,     # Body Slam
            36,     # Take Down
        ]

        gyarados_moves = [
            33,     # Tackle
            34,     # Body Slam
            36,     # Take Down
            38,     # Double-Edge
        ]

        tyranitar_moves = [
            7,      # Fire Punch
            8,      # Ice Punch
            9,      # Thunder Punch
            33,     # Tackle
        ]

        metagross_moves = [
            8,      # Ice Punch
            9,      # Thunder Punch
            33,     # Tackle
            34,     # Body Slam
        ]

        garchomp_moves = [
            33,     # Tackle
            34,     # Body Slam
            36,     # Take Down
            38,     # Double-Edge
        ]

        articuno_moves = [
            13,     # Razor Wind
            19,     # Fly
            36,     # Take Down
            38,     # Double-Edge
        ]

        mew_moves = [
            1,      # Pound
            5,      # Mega Punch
            6,      # Pay Day
            13,     # Razor Wind
        ]

        nihilego_moves = [
            1,      # Pound
            29,     # Headbutt
            34,     # Body Slam
            35,     # Wrap
        ]


        # ==================================================
        # Test 1
        # 6 basic Pokémon
        #
        # Expected: PASS
        # ==================================================

        team = create_team_data(

            pokemon_ids=[
                charizard,
                gengar,
                gyarados,
                tyranitar,
                metagross,
                garchomp,
            ],

            move_ids=[
                charizard_moves,
                gengar_moves,
                gyarados_moves,
                tyranitar_moves,
                metagross_moves,
                garchomp_moves,
            ],
        )

        run_test(
            db,
            "6 basic Pokémon",
            team,
            should_pass=True,
        )


        # ==================================================
        # Test 2
        # 5 basic + Legendary
        #
        # Expected: PASS
        # ==================================================

        team = create_team_data(

            pokemon_ids=[
                charizard,
                gengar,
                gyarados,
                tyranitar,
                metagross,
                articuno,
            ],

            move_ids=[
                charizard_moves,
                gengar_moves,
                gyarados_moves,
                tyranitar_moves,
                metagross_moves,
                articuno_moves,
            ],
        )

        run_test(
            db,
            "5 basic + 1 Legendary",
            team,
            should_pass=True,
        )


        # ==================================================
        # Test 3
        # 5 basic + Mythical
        #
        # Expected: PASS
        # ==================================================

        team = create_team_data(

            pokemon_ids=[
                charizard,
                gengar,
                gyarados,
                tyranitar,
                metagross,
                mew,
            ],

            move_ids=[
                charizard_moves,
                gengar_moves,
                gyarados_moves,
                tyranitar_moves,
                metagross_moves,
                mew_moves,
            ],
        )

        run_test(
            db,
            "5 basic + 1 Mythical",
            team,
            should_pass=True,
        )


        # ==================================================
        # Test 4
        # 5 basic + Ultra Beast
        #
        # Expected: PASS
        # ==================================================

        team = create_team_data(

            pokemon_ids=[
                charizard,
                gengar,
                gyarados,
                tyranitar,
                metagross,
                nihilego,
            ],

            move_ids=[
                charizard_moves,
                gengar_moves,
                gyarados_moves,
                tyranitar_moves,
                metagross_moves,
                nihilego_moves,
            ],
        )

        run_test(
            db,
            "5 basic + 1 Ultra Beast",
            team,
            should_pass=True,
        )


        # ==================================================
        # Test 5
        # 4 basic + Legendary + Mythical
        #
        # Expected: FAIL
        # ==================================================

        team = create_team_data(

            pokemon_ids=[
                charizard,
                gengar,
                gyarados,
                tyranitar,
                articuno,
                mew,
            ],

            move_ids=[
                charizard_moves,
                gengar_moves,
                gyarados_moves,
                tyranitar_moves,
                articuno_moves,
                mew_moves,
            ],
        )

        run_test(
            db,
            "4 basic + Legendary + Mythical",
            team,
            should_pass=False,
        )


        # ==================================================
        # Test 6
        # 4 basic + Legendary + Ultra Beast
        #
        # Expected: FAIL
        # ==================================================

        team = create_team_data(

            pokemon_ids=[
                charizard,
                gengar,
                gyarados,
                tyranitar,
                articuno,
                nihilego,
            ],

            move_ids=[
                charizard_moves,
                gengar_moves,
                gyarados_moves,
                tyranitar_moves,
                articuno_moves,
                nihilego_moves,
            ],
        )

        run_test(
            db,
            "4 basic + Legendary + Ultra Beast",
            team,
            should_pass=False,
        )


        # ==================================================
        # Test 7
        # 4 basic + Mythical + Ultra Beast
        #
        # Expected: FAIL
        # ==================================================

        team = create_team_data(

            pokemon_ids=[
                charizard,
                gengar,
                gyarados,
                tyranitar,
                mew,
                nihilego,
            ],

            move_ids=[
                charizard_moves,
                gengar_moves,
                gyarados_moves,
                tyranitar_moves,
                mew_moves,
                nihilego_moves,
            ],
        )

        run_test(
            db,
            "4 basic + Mythical + Ultra Beast",
            team,
            should_pass=False,
        )


        # ==================================================
        # Test 8
        # Duplicate Pokémon
        #
        # Expected: FAIL
        # ==================================================

        team = create_team_data(

            pokemon_ids=[
                charizard,
                gengar,
                gyarados,
                tyranitar,
                metagross,
                charizard,
            ],

            move_ids=[
                charizard_moves,
                gengar_moves,
                gyarados_moves,
                tyranitar_moves,
                metagross_moves,
                charizard_moves,
            ],
        )

        run_test(
            db,
            "Duplicate Pokémon",
            team,
            should_pass=False,
        )


        # ==================================================
        # Test 9
        # Duplicate move
        #
        # Expected: FAIL
        # ==================================================

        invalid_charizard_moves = [
            5,
            5,
            15,
            25,
        ]

        team = create_team_data(

            pokemon_ids=[
                charizard,
                gengar,
                gyarados,
                tyranitar,
                metagross,
                garchomp,
            ],

            move_ids=[
                invalid_charizard_moves,
                gengar_moves,
                gyarados_moves,
                tyranitar_moves,
                metagross_moves,
                garchomp_moves,
            ],
        )

        run_test(
            db,
            "Duplicate move",
            team,
            should_pass=False,
        )


        # ==================================================
        # Test 10
        # Pokémon cannot learn selected move
        #
        # Charizard does not have move 1 in the inspected
        # data, so this should be rejected.
        #
        # Expected: FAIL
        # ==================================================

        invalid_charizard_moves = [
            1,
            10,
            15,
            25,
        ]

        team = create_team_data(

            pokemon_ids=[
                charizard,
                gengar,
                gyarados,
                tyranitar,
                metagross,
                garchomp,
            ],

            move_ids=[
                invalid_charizard_moves,
                gengar_moves,
                gyarados_moves,
                tyranitar_moves,
                metagross_moves,
                garchomp_moves,
            ],
        )

        run_test(
            db,
            "Unlearnable move",
            team,
            should_pass=False,
        )


        # ==================================================
        # Test 11
        # Invalid Pokémon ID
        #
        # Expected: FAIL
        # ==================================================

        team = create_team_data(

            pokemon_ids=[
                charizard,
                gengar,
                gyarados,
                tyranitar,
                metagross,
                99999,
            ],

            move_ids=[
                charizard_moves,
                gengar_moves,
                gyarados_moves,
                tyranitar_moves,
                metagross_moves,
                garchomp_moves,
            ],
        )

        run_test(
            db,
            "Invalid Pokémon ID",
            team,
            should_pass=False,
        )


        # # ==================================================
        # # Test 12
        # # Invalid slot numbers
        # #
        # # Expected: FAIL
        # # ==================================================

        # invalid_slots = [

        #     TeamSlotCreate(
        #         slot=1,
        #         pokemon_id=charizard,
        #         move_ids=charizard_moves,
        #     ),

        #     TeamSlotCreate(
        #         slot=2,
        #         pokemon_id=gengar,
        #         move_ids=gengar_moves,
        #     ),

        #     TeamSlotCreate(
        #         slot=3,
        #         pokemon_id=gyarados,
        #         move_ids=gyarados_moves,
        #     ),

        #     TeamSlotCreate(
        #         slot=4,
        #         pokemon_id=tyranitar,
        #         move_ids=tyranitar_moves,
        #     ),

        #     TeamSlotCreate(
        #         slot=5,
        #         pokemon_id=metagross,
        #         move_ids=metagross_moves,
        #     ),

        #     TeamSlotCreate(
        #         slot=7,
        #         pokemon_id=garchomp,
        #         move_ids=garchomp_moves,
        #     ),
        # ]

        # team = TeamCreate(
        #     slots=invalid_slots
        # )

        # run_test(
        #     db,
        #     "Invalid slot numbers",
        #     team,
        #     should_pass=False,
        # )


    finally:

        db.close()


if __name__ == "__main__":
    main()