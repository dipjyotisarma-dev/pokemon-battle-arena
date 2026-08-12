import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(PROJECT_ROOT))

from app.db.database import SessionLocal
from app.db.models import User, Leaderboard


def main():

    db = SessionLocal()

    try:

        trainers = (
            db.query(User)
            .filter(User.role == "trainer")
            .all()
        )

        for trainer in trainers:

            existing_entry = (
                db.query(Leaderboard)
                .filter(
                    Leaderboard.trainer_id == trainer.id
                )
                .first()
            )

            if existing_entry:
                print(
                    f"Leaderboard already exists: "
                    f"{trainer.username}"
                )
                continue

            leaderboard = Leaderboard(
                trainer_id=trainer.id,
                total_matches=0,
                wins=0,
                points=0.0,
            )

            db.add(leaderboard)

            print(
                f"Created leaderboard entry: "
                f"{trainer.username}"
            )

        db.commit()

    except Exception:

        db.rollback()
        raise

    finally:

        db.close()


if __name__ == "__main__":
    main()