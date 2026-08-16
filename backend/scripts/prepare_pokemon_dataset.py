from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent

RAW_POKEMON = BASE_DIR / "app" / "data" / "raw" / "pokemon_master.csv"

PROCESSED_DIR = BASE_DIR / "app" / "data" / "processed"
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

PROCESSED_POKEMON = PROCESSED_DIR / "pokemon.csv"

# Configuration
MINIMUM_BST = 475

# Pokémon Classification
LEGENDARY_IDS = {
    # Generation 1
    144, 145, 146, 150,

    # Generation 2
    243, 244, 245, 249, 250,

    # Generation 3
    377, 378, 379, 380, 381, 382, 383, 384,

    # Generation 4
    480, 481, 482,
    483, 484, 485, 486, 487, 488,

    # Generation 5
    638, 639, 640,
    641, 642, 643, 644, 645, 646,

    # Generation 6
    716, 717, 718,

    # Generation 7
    772, 773, 785, 786, 787, 788,
    789, 790, 791, 792, 800,

    # Generation 8
    888, 889, 890,
    891, 892,
    894, 895, 896, 897, 898,

    # Generation 9
    1007, 1008,
    1009, 1010,
    1014, 1015, 1016,
    1019, 1020, 1021, 1022, 1023, 1024,
}

MYTHICAL_IDS = {
    # Generation 1
    151,

    # Generation 2
    251,

    # Generation 3
    385, 386,

    # Generation 4
    489, 490, 491, 492, 493,

    # Generation 5
    494, 647, 648, 649,

    # Generation 6
    719, 720, 721,

    # Generation 7
    801, 802, 807, 808, 809,

    # Generation 8
    893,

    # Generation 9
    1025,
}

ULTRA_BEAST_IDS = {
    # Generation 7
    793, 794, 795, 796, 797, 798, 799,
    803, 804, 805, 806,
}

# Special Pokémon Names
SPECIAL_NAMES = {
    "mr-mime": "Mr. Mime",
    "mime-jr": "Mime Jr.",
    "ho-oh": "Ho-Oh",
    "porygon-z": "Porygon-Z",
    "type-null": "Type: Null",
    "jangmo-o": "Jangmo-o",
    "hakamo-o": "Hakamo-o",
    "kommo-o": "Kommo-o",
    "wo-chien": "Wo-Chien",
    "chien-pao": "Chien-Pao",
    "ting-lu": "Ting-Lu",
    "chi-yu": "Chi-Yu",
}


def format_display_name(name: str) -> str:
    """
    Convert API-style Pokémon names into user-friendly names.
    """

    if name in SPECIAL_NAMES:
        return SPECIAL_NAMES[name]

    return " ".join(
        word.capitalize()
        for word in name.replace("-", " ").split()
    )


def get_pokemon_category(pokemon_id: int) -> str:
    """
    Determine the Pokémon's Arena classification.

    Categories:
        basic
        legendary
        mythical
        ultra_beast
    """

    if pokemon_id in LEGENDARY_IDS:
        return "legendary"

    if pokemon_id in MYTHICAL_IDS:
        return "mythical"

    if pokemon_id in ULTRA_BEAST_IDS:
        return "ultra_beast"

    return "basic"


# Load Dataset
pokemon_df = pd.read_csv(RAW_POKEMON)

print(f"Original Pokemon : {len(pokemon_df)}")


# Filter by BST
pokemon_df = pokemon_df[
    pokemon_df["bst"] >= MINIMUM_BST
].copy()


# Create Display Name
pokemon_df["display_name"] = (
    pokemon_df["name"]
    .apply(format_display_name)
)


# Create Image Column
pokemon_df["image"] = (
    pokemon_df["id"]
    .astype(str)
    + ".png"
)


# Assign Pokémon Category
pokemon_df["pokemon_category"] = (
    pokemon_df["id"]
    .apply(get_pokemon_category)
)


# Reorder Columns
pokemon_df = pokemon_df[
    [
        "id",
        "name",
        "display_name",
        "type1",
        "type2",
        "hp",
        "attack",
        "defense",
        "special_attack",
        "special_defense",
        "speed",
        "bst",
        "image",
        "pokemon_category",
    ]
]


# Validation
print("\nPokemon category distribution:")
print(
    pokemon_df["pokemon_category"]
    .value_counts()
)

print("\nSpecial Pokémon:")
print(
    pokemon_df[
        pokemon_df["pokemon_category"] != "basic"
    ][
        [
            "id",
            "display_name",
            "bst",
            "pokemon_category",
        ]
    ].to_string(index=False)
)


# Save Dataset
pokemon_df.to_csv(
    PROCESSED_POKEMON,
    index=False,
)

print("\nProcessed Pokemon dataset overview:")
print(
    pokemon_df.head(20)
)

print(
    f"\nProcessed Pokemon : {len(pokemon_df)}"
)
print(
    f"Saved to : {PROCESSED_POKEMON}"
)