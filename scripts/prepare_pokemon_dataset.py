from pathlib import Path
import pandas as pd


BASE_DIR = Path(__file__).resolve().parent.parent

RAW_POKEMON = BASE_DIR / "app" / "data" / "raw" / "pokemon_master.csv"

PROCESSED_DIR = BASE_DIR / "app" / "data" / "processed"
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

PROCESSED_POKEMON = PROCESSED_DIR / "pokemon.csv"


# Configuration
MINIMUM_BST = 475


# Special Pokemon Names
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
    Convert API-style Pokemon names into user-friendly names.
    """

    if name in SPECIAL_NAMES:
        return SPECIAL_NAMES[name]

    return " ".join(
        word.capitalize()
        for word in name.replace("-", " ").split()
    )


# Load Dataset
pokemon_df = pd.read_csv(RAW_POKEMON)
print(f"Original Pokemon : {len(pokemon_df)}")


# Filter BST
pokemon_df = pokemon_df[
    pokemon_df["bst"] >= MINIMUM_BST
]


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
    ]
]


# Save Dataset
pokemon_df.to_csv(
    PROCESSED_POKEMON,
    index=False,
)

print("Processed pokemon dataset overview")
print(pokemon_df.head(20))


print(f"Processed Pokemon : {len(pokemon_df)}")
print(f"Saved to : {PROCESSED_POKEMON}")