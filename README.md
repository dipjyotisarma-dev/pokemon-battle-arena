<div align="center">

# Pokémon Battle Arena (PBA)

**A web-based, 6v6 tactical Pokémon battle game — built with FastAPI.**

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![pandas](https://img.shields.io/badge/pandas-150458?logo=pandas&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

</div>

---

Pokémon Battle Arena is a competitive 6v6 Pokémon battle simulator converted from an original terminal-based game into a full web application. Register a team, battle through a gauntlet of random opponents, and climb the leaderboard — all powered by a FastAPI backend and a 441-Pokémon Pokédex.

🔗 **Repository:** [github.com/dipjyotisarma-dev/pokemon-battle-arena](https://github.com/dipjyotisarma-dev/pokemon-battle-arena.git)
🌐 **Live Demo:** [INSERT_LIVE_DEMO_URL_HERE]

> *This project uses custom, self-designed battle mechanics, stats, and rules. It is a fan-made learning project and is not affiliated with or intended as an accurate representation of the official Pokémon games.*

---

## Features

| Feature | Description |
|---|---|
| **Battle System** | Sequential 6-match arena run against random opponents. Turn order determined by speed; damage calculated from type advantages, STAB bonus, and physical/special split. |
| **Pokédex** | Full database of 441 Pokémon with searchable stats, types, and learnable move sets. |
| **Leaderboard** | Persistent leaderboard with points awarded based on health-loss margin per battle. |
| **Trainer Dashboard** | Live rank display, match/win history, total points, and current 6-Pokémon roster at a glance. |
| **Team Management** | Build and edit your roster of 6 Pokémon, with a max of one legendary, mythical, or ultra beast per team. |

---

## Screenshots

<table>
  <tr>
    <td align="center"><strong>Homepage</strong><br><img src="screenshots/homepage.png" alt="Homepage" width="400"></td>
    <td align="center"><strong>Leaderboard</strong><br><img src="screenshots/leaderboard.png" alt="Leaderboard" width="400"></td>
  </tr>
  <tr>
    <td align="center"><strong>Pokédex</strong><br><img src="screenshots/pokedex.png" alt="Pokédex" width="400"></td>
    <td align="center"><strong>Trainer Dashboard</strong><br><img src="screenshots/trainer_dashboard.png" alt="Trainer Dashboard" width="400"></td>
  </tr>
  <tr>
    <td align="center"><strong>Team Management</strong><br><img src="screenshots/team_management.png" alt="Team Management" width="400"></td>
    <td align="center"><strong>Battle Arena</strong><br><img src="screenshots/battle_arena.png" alt="Battle Arena" width="400"></td>
  </tr>
</table>

---

## Tech Stack

- **Backend:** FastAPI (Python)
- **Data Layer:** pandas — CSV-based Pokémon, move, and trainer data
- **Frontend:** HTML / CSS / JavaScript (dark competitive-gaming theme)

---

## Getting Started

```bash
# Clone the repository
git clone https://github.com/dipjyotisarma-dev/pokemon-battle-arena.git
cd pokemon-battle-arena

# Create a virtual environment and install dependencies
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run the application
uvicorn main:app --reload
```

The app will be available at `http://127.0.0.1:8000`.

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
