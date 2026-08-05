from pathlib import Path
import pandas as pd
import requests


# ----------------------------
# Paths
# ----------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

CSV_FILE = BASE_DIR / "app" / "data" / "pokemon.csv"

IMAGE_DIR = BASE_DIR / "app" / "static" / "images" / "pokemon"

IMAGE_DIR.mkdir(parents=True, exist_ok=True)


# ----------------------------
# Read CSV
# ----------------------------

pokemon_df = pd.read_csv(CSV_FILE)

downloaded = 0
skipped = 0
failed = 0

# ----------------------------
# Download Images
# ----------------------------

BASE_URL = (
    "https://raw.githubusercontent.com/"
    "PokeAPI/sprites/master/sprites/pokemon/"
    "other/official-artwork/"
)

for _, row in pokemon_df.iterrows():

    pokemon_id = row["id"]

    image_url = f"{BASE_URL}{pokemon_id}.png"

    image_path = IMAGE_DIR / f"{pokemon_id}.png"

    if image_path.exists():
        skipped += 1
        print(f"✓ {pokemon_id}.png already exists")
        continue

    try:

        response = requests.get(
            image_url,
            timeout=10,
            headers={
                "User-Agent": "Pokemon Battle Arena Image Downloader"
            }
        )

        if response.status_code == 200 and response.content:

            image_path.write_bytes(response.content)
            downloaded += 1
            print(f"Downloaded {pokemon_id}.png")

        else:
            failed += 1
            print(f"Missing image for ID {pokemon_id}")

    except Exception as e:
        failed += 1
        print(f"Error downloading {pokemon_id}: {e}")

print("\nDownload Complete")
print(f"Downloaded : {downloaded}")
print(f"Skipped    : {skipped}")
print(f"Failed     : {failed}")