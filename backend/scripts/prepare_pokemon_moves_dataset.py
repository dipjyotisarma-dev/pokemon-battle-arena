from pathlib import Path
import pandas as pd


BASE_DIR = Path(__file__).resolve().parent.parent

RAW_DATA_DIR = BASE_DIR / "app" / "data" / "raw"
PROCESSED_DATA_DIR = BASE_DIR / "app" / "data" / "processed"

RAW_POKEMON_MOVES = RAW_DATA_DIR / "pokemon_moves_master.csv"

POKEMON_CSV = PROCESSED_DATA_DIR / "pokemon.csv"
MOVES_CSV = PROCESSED_DATA_DIR / "moves.csv"

PROCESSED_POKEMON_MOVES = (
    PROCESSED_DATA_DIR / "pokemon_moves.csv"
)


# Load Datasets
pokemon_moves_df = pd.read_csv(RAW_POKEMON_MOVES)
pokemon_df = pd.read_csv(POKEMON_CSV)
moves_df = pd.read_csv(MOVES_CSV)

print(f"Original mappings : {len(pokemon_moves_df)}")


# Remove Duplicate Mappings
pokemon_moves_df = pokemon_moves_df.drop_duplicates(
    subset=["pokemon_id", "move_id"]
)


# Remove Missing Values
pokemon_moves_df = pokemon_moves_df.dropna(
    subset=["pokemon_id", "move_id"]
)


# Convert IDs to Integer
pokemon_moves_df["pokemon_id"] = (
    pokemon_moves_df["pokemon_id"]
    .astype(int)
)

pokemon_moves_df["move_id"] = (
    pokemon_moves_df["move_id"]
    .astype(int)
)


# Validate Pokemon IDs
valid_pokemon_ids = set(pokemon_df["id"])

invalid_pokemon = (
    set(pokemon_moves_df["pokemon_id"])
    - valid_pokemon_ids
)

if invalid_pokemon:

    raise ValueError(
        f"Invalid pokemon_id(s): {sorted(invalid_pokemon)}"
    )


# Validate Move IDs
valid_move_ids = set(moves_df["id"])

invalid_moves = (
    set(pokemon_moves_df["move_id"])
    - valid_move_ids
)

if invalid_moves:

    raise ValueError(
        f"Invalid move_id(s): {sorted(invalid_moves)}"
    )


# Sort Dataset

pokemon_moves_df = pokemon_moves_df.sort_values(
    by=["pokemon_id", "move_id"]
).reset_index(drop=True)


# Save Dataset

pokemon_moves_df.to_csv(
    PROCESSED_POKEMON_MOVES,
    index=False
)

print(f"Processed mappings : {len(pokemon_moves_df)}")
print(f"Saved to : {PROCESSED_POKEMON_MOVES}")