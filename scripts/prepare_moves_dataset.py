from pathlib import Path
import pandas as pd



BASE_DIR = Path(__file__).resolve().parent.parent

RAW_MOVES = BASE_DIR / "app" / "data" / "raw" / "moves_master.csv"

PROCESSED_DIR = BASE_DIR / "app" / "data" / "processed"
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

PROCESSED_MOVES = PROCESSED_DIR / "moves.csv"


SPECIAL_MOVE_NAMES = {
    "u-turn": "U-turn",
    "v-create": "V-create",
    "x-scissor": "X-Scissor",
    "double-edge": "Double-Edge",
    "self-destruct": "Self-Destruct",
    "freeze-dry": "Freeze-Dry",
    "trick-or-treat": "Trick-or-Treat",
}


def format_display_name(name: str) -> str:
    """
    Convert API-style move names into user-friendly names.
    """

    if name in SPECIAL_MOVE_NAMES:
        return SPECIAL_MOVE_NAMES[name]

    return " ".join(
        word.capitalize()
        for word in name.replace("-", " ").split()
    )


# Load Dataset
moves_df = pd.read_csv(RAW_MOVES)
print(f"Original moves : {len(moves_df)}")


# Remove Status Moves
moves_df = moves_df[
    moves_df["category"].str.lower() != "status"
]


# Remove Non-Damaging Moves
moves_df = moves_df[
    moves_df["base_power"] > 0
]


# convert base_power to integer
moves_df["base_power"] = moves_df["base_power"].astype(int)

# Create Display Name
moves_df["display_name"] = (
    moves_df["move_name"]
    .apply(format_display_name)
)


# Reorder Columns
moves_df = moves_df[
    [
        "id",
        "move_name",
        "display_name",
        "move_type",
        "category",
        "base_power",
    ]
]


# Save Dataset
moves_df.to_csv(PROCESSED_MOVES, index=False)

print("Processed moves dataset overview")
print(moves_df.head(20))

print(f"Processed moves : {len(moves_df)}")
print(f"Saved to : {PROCESSED_MOVES}")