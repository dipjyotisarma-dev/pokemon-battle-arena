// ==========================================================
// DATA.JS — Pokémon, moves, trainers, leaderboard demo data
// ==========================================================

const TYPE_COLORS = {
  normal: "#A8A878", fire: "#F08030", water: "#6890F0", electric: "#F8D030",
  grass: "#78C850", ice: "#98D8D8", fighting: "#C03028", poison: "#A040A0",
  ground: "#E0C068", flying: "#A890F0", psychic: "#F85888", bug: "#A8B820",
  rock: "#B8A038", ghost: "#705898", dragon: "#7038F8", dark: "#705848",
  steel: "#B8B8D0", fairy: "#EE99AC"
};

const MOVES = [
  { id: "m1", name: "aura_sphere", displayName: "Aura Sphere", type: "fighting", category: "special", basePower: 80 },
  { id: "m2", name: "flash_cannon", displayName: "Flash Cannon", type: "steel", category: "special", basePower: 80 },
  { id: "m3", name: "close_combat", displayName: "Close Combat", type: "fighting", category: "physical", basePower: 120 },
  { id: "m4", name: "extreme_speed", displayName: "Extreme Speed", type: "normal", category: "physical", basePower: 80 },
  { id: "m5", name: "flamethrower", displayName: "Flamethrower", type: "fire", category: "special", basePower: 90 },
  { id: "m6", name: "air_slash", displayName: "Air Slash", type: "flying", category: "special", basePower: 75 },
  { id: "m7", name: "dragon_claw", displayName: "Dragon Claw", type: "dragon", category: "physical", basePower: 80 },
  { id: "m8", name: "earthquake", displayName: "Earthquake", type: "ground", category: "physical", basePower: 100 },
  { id: "m9", name: "hydro_pump", displayName: "Hydro Pump", type: "water", category: "special", basePower: 110 },
  { id: "m10", name: "waterfall", displayName: "Waterfall", type: "water", category: "physical", basePower: 80 },
  { id: "m11", name: "ice_beam", displayName: "Ice Beam", type: "ice", category: "special", basePower: 90 },
  { id: "m12", name: "blizzard", displayName: "Blizzard", type: "ice", category: "special", basePower: 110 },
  { id: "m13", name: "thunderbolt", displayName: "Thunderbolt", type: "electric", category: "special", basePower: 90 },
  { id: "m14", name: "wild_charge", displayName: "Wild Charge", type: "electric", category: "physical", basePower: 90 },
  { id: "m15", name: "giga_drain", displayName: "Giga Drain", type: "grass", category: "special", basePower: 75 },
  { id: "m16", name: "leaf_blade", displayName: "Leaf Blade", type: "grass", category: "physical", basePower: 90 },
  { id: "m17", name: "shadow_ball", displayName: "Shadow Ball", type: "ghost", category: "special", basePower: 80 },
  { id: "m18", name: "sludge_bomb", displayName: "Sludge Bomb", type: "poison", category: "special", basePower: 90 },
  { id: "m19", name: "rock_slide", displayName: "Rock Slide", type: "rock", category: "physical", basePower: 75 },
  { id: "m20", name: "stone_edge", displayName: "Stone Edge", type: "rock", category: "physical", basePower: 100 },
  { id: "m21", name: "psychic", displayName: "Psychic", type: "psychic", category: "special", basePower: 90 },
  { id: "m22", name: "focus_blast", displayName: "Focus Blast", type: "fighting", category: "special", basePower: 120 },
  { id: "m23", name: "iron_head", displayName: "Iron Head", type: "steel", category: "physical", basePower: 80 },
  { id: "m24", name: "x_scissor", displayName: "X-Scissor", type: "bug", category: "physical", basePower: 80 },
  { id: "m25", name: "dark_pulse", displayName: "Dark Pulse", type: "dark", category: "special", basePower: 80 },
  { id: "m26", name: "crunch", displayName: "Crunch", type: "dark", category: "physical", basePower: 80 },
  { id: "m27", name: "moonblast", displayName: "Moonblast", type: "fairy", category: "special", basePower: 95 },
  { id: "m28", name: "play_rough", displayName: "Play Rough", type: "fairy", category: "physical", basePower: 90 },
  { id: "m29", name: "body_slam", displayName: "Body Slam", type: "normal", category: "physical", basePower: 85 },
  { id: "m30", name: "hyper_beam", displayName: "Hyper Beam", type: "normal", category: "special", basePower: 150 },
  { id: "m31", name: "dragon_pulse", displayName: "Dragon Pulse", type: "dragon", category: "special", basePower: 85 },
  { id: "m32", name: "outrage", displayName: "Outrage", type: "dragon", category: "physical", basePower: 120 },
  { id: "m33", name: "brave_bird", displayName: "Brave Bird", type: "flying", category: "physical", basePower: 120 },
  { id: "m34", name: "hurricane", displayName: "Hurricane", type: "flying", category: "special", basePower: 110 },
  { id: "m35", name: "night_slash", displayName: "Night Slash", type: "dark", category: "physical", basePower: 70 },
  { id: "m36", name: "seed_bomb", displayName: "Seed Bomb", type: "grass", category: "physical", basePower: 80 },
  { id: "m37", name: "power_gem", displayName: "Power Gem", type: "rock", category: "special", basePower: 80 },
  { id: "m38", name: "thunder_punch", displayName: "Thunder Punch", type: "electric", category: "physical", basePower: 75 },
  { id: "m39", name: "ice_punch", displayName: "Ice Punch", type: "ice", category: "physical", basePower: 75 },
  { id: "m40", name: "fire_punch", displayName: "Fire Punch", type: "fire", category: "physical", basePower: 75 },
  { id: "m41", name: "meteor_mash", displayName: "Meteor Mash", type: "steel", category: "physical", basePower: 90 },
  { id: "m42", name: "zen_headbutt", displayName: "Zen Headbutt", type: "psychic", category: "physical", basePower: 80 },
  { id: "m43", name: "aerial_ace", displayName: "Aerial Ace", type: "flying", category: "physical", basePower: 60 },
  { id: "m44", name: "energy_ball", displayName: "Energy Ball", type: "grass", category: "special", basePower: 90 }
];

function movesByType(types) {
  return MOVES.filter(m => types.includes(m.type));
}

const POKEMON = [
  { id: 1, name: "pikachu", displayName: "Pikachu", type1: "electric", type2: null,
    hp: 35, attack: 55, defense: 40, specialAttack: 50, specialDefense: 50, speed: 90,
    category: "normal", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png",
    moves: movesByType(["electric", "normal", "fighting"]) },
  { id: 2, name: "charizard", displayName: "Charizard", type1: "fire", type2: "flying",
    hp: 78, attack: 84, defense: 78, specialAttack: 109, specialDefense: 85, speed: 100,
    category: "normal", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png",
    moves: movesByType(["fire", "flying", "dragon", "normal"]) },
  { id: 3, name: "lucario", displayName: "Lucario", type1: "fighting", type2: "steel",
    hp: 70, attack: 110, defense: 70, specialAttack: 115, specialDefense: 70, speed: 90,
    category: "normal", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/448.png",
    moves: movesByType(["fighting", "steel", "dark"]) },
  { id: 4, name: "garchomp", displayName: "Garchomp", type1: "dragon", type2: "ground",
    hp: 108, attack: 130, defense: 95, specialAttack: 80, specialDefense: 85, speed: 102,
    category: "normal", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/445.png",
    moves: movesByType(["dragon", "ground", "fire", "dark"]) },
  { id: 5, name: "gyarados", displayName: "Gyarados", type1: "water", type2: "flying",
    hp: 95, attack: 125, defense: 79, specialAttack: 60, specialDefense: 100, speed: 81,
    category: "normal", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/130.png",
    moves: movesByType(["water", "flying", "dark", "ice"]) },
  { id: 6, name: "articuno", displayName: "Articuno", type1: "ice", type2: "flying",
    hp: 90, attack: 85, defense: 100, specialAttack: 95, specialDefense: 125, speed: 85,
    category: "legendary", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/144.png",
    moves: movesByType(["ice", "flying", "normal"]) },
  { id: 7, name: "dragonite", displayName: "Dragonite", type1: "dragon", type2: "flying",
    hp: 91, attack: 134, defense: 95, specialAttack: 100, specialDefense: 100, speed: 80,
    category: "normal", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/149.png",
    moves: movesByType(["dragon", "flying", "fire", "ice"]) },
  { id: 8, name: "tyranitar", displayName: "Tyranitar", type1: "rock", type2: "dark",
    hp: 100, attack: 134, defense: 110, specialAttack: 95, specialDefense: 100, speed: 61,
    category: "normal", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/248.png",
    moves: movesByType(["rock", "dark", "fire", "ground"]) },
  { id: 9, name: "metagross", displayName: "Metagross", type1: "steel", type2: "psychic",
    hp: 80, attack: 135, defense: 130, specialAttack: 95, specialDefense: 90, speed: 70,
    category: "normal", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/376.png",
    moves: movesByType(["steel", "psychic", "fighting", "rock"]) },
  { id: 10, name: "greninja", displayName: "Greninja", type1: "water", type2: "dark",
    hp: 72, attack: 95, defense: 67, specialAttack: 103, specialDefense: 71, speed: 122,
    category: "normal", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/658.png",
    moves: movesByType(["water", "dark", "bug", "normal"]) },
  { id: 11, name: "blaziken", displayName: "Blaziken", type1: "fire", type2: "fighting",
    hp: 80, attack: 120, defense: 70, specialAttack: 110, specialDefense: 70, speed: 80,
    category: "normal", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/257.png",
    moves: movesByType(["fire", "fighting", "flying"]) },
  { id: 12, name: "sceptile", displayName: "Sceptile", type1: "grass", type2: null,
    hp: 70, attack: 85, defense: 65, specialAttack: 105, specialDefense: 85, speed: 120,
    category: "normal", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/254.png",
    moves: movesByType(["grass", "dragon", "bug"]) },
  { id: 13, name: "swampert", displayName: "Swampert", type1: "water", type2: "ground",
    hp: 100, attack: 110, defense: 90, specialAttack: 85, specialDefense: 90, speed: 60,
    category: "normal", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/260.png",
    moves: movesByType(["water", "ground", "ice", "rock"]) },
  { id: 14, name: "milotic", displayName: "Milotic", type1: "water", type2: null,
    hp: 95, attack: 60, defense: 79, specialAttack: 100, specialDefense: 125, speed: 81,
    category: "normal", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/350.png",
    moves: movesByType(["water", "ice", "normal"]) },
  { id: 15, name: "gengar", displayName: "Gengar", type1: "ghost", type2: "poison",
    hp: 60, attack: 65, defense: 60, specialAttack: 130, specialDefense: 75, speed: 110,
    category: "normal", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png",
    moves: movesByType(["ghost", "poison", "dark", "psychic"]) },
  { id: 16, name: "alakazam", displayName: "Alakazam", type1: "psychic", type2: null,
    hp: 55, attack: 50, defense: 45, specialAttack: 135, specialDefense: 95, speed: 120,
    category: "normal", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/65.png",
    moves: movesByType(["psychic", "fighting", "dark"]) },
  { id: 17, name: "machamp", displayName: "Machamp", type1: "fighting", type2: null,
    hp: 90, attack: 130, defense: 80, specialAttack: 65, specialDefense: 85, speed: 55,
    category: "normal", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/68.png",
    moves: movesByType(["fighting", "rock", "dark"]) },
  { id: 18, name: "snorlax", displayName: "Snorlax", type1: "normal", type2: null,
    hp: 160, attack: 110, defense: 65, specialAttack: 65, specialDefense: 110, speed: 30,
    category: "normal", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/143.png",
    moves: movesByType(["normal", "fighting", "ice"]) },
  { id: 19, name: "salamence", displayName: "Salamence", type1: "dragon", type2: "flying",
    hp: 95, attack: 135, defense: 80, specialAttack: 110, specialDefense: 80, speed: 100,
    category: "normal", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/373.png",
    moves: movesByType(["dragon", "flying", "fire"]) },
  { id: 20, name: "hydreigon", displayName: "Hydreigon", type1: "dark", type2: "dragon",
    hp: 92, attack: 105, defense: 90, specialAttack: 125, specialDefense: 90, speed: 98,
    category: "pseudo-legendary", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/635.png",
    moves: movesByType(["dark", "dragon", "fire", "flying"]) },
  { id: 21, name: "mewtwo", displayName: "Mewtwo", type1: "psychic", type2: null,
    hp: 106, attack: 110, defense: 90, specialAttack: 154, specialDefense: 90, speed: 130,
    category: "legendary", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png",
    moves: movesByType(["psychic", "fighting", "ice", "dark"]) },
  { id: 22, name: "rayquaza", displayName: "Rayquaza", type1: "dragon", type2: "flying",
    hp: 105, attack: 150, defense: 90, specialAttack: 150, specialDefense: 90, speed: 95,
    category: "legendary", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/384.png",
    moves: movesByType(["dragon", "flying", "fire", "ground"]) },
  { id: 23, name: "mew", displayName: "Mew", type1: "psychic", type2: null,
    hp: 100, attack: 100, defense: 100, specialAttack: 100, specialDefense: 100, speed: 100,
    category: "mythical", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/151.png",
    moves: movesByType(["psychic", "normal", "fighting", "ice"]) },
  { id: 24, name: "nihilego", displayName: "Nihilego", type1: "rock", type2: "poison",
    hp: 109, attack: 53, defense: 47, specialAttack: 127, specialDefense: 131, speed: 103,
    category: "ultra-beast", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/793.png",
    moves: movesByType(["rock", "poison", "psychic"]) },
  { id: 25, name: "toxapex", displayName: "Toxapex", type1: "poison", type2: "water",
    hp: 50, attack: 63, defense: 152, specialAttack: 53, specialDefense: 142, speed: 35,
    category: "normal", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/748.png",
    moves: movesByType(["poison", "water", "dark"]) }
];

POKEMON.forEach(p => {
  p.bst = p.hp + p.attack + p.defense + p.specialAttack + p.specialDefense + p.speed;
  // ensure exactly enough moves, pad with normal moves if short
  if (p.moves.length < 4) {
    const extra = MOVES.filter(m => !p.moves.includes(m));
    p.moves = p.moves.concat(extra.slice(0, 4 - p.moves.length));
  }
});

function isRestrictedCategory(pokemon) {
  return ["legendary", "mythical", "ultra-beast"].includes(pokemon.category);
}

// ---- In-memory trainers (demo accounts) ----
const TRAINERS = [
  { username: "ash", email: "ash@example.com", password: "ash123", totalMatches: 38, wins: 27, points: 801.42, team: null, lastBattle: { status: "abandoned", matches: 3, wins: 2, points: 147.35 } },
  { username: "cynthia", email: "cynthia@example.com", password: "cynthia123", totalMatches: 42, wins: 31, points: 923.52, team: null, lastBattle: { status: "completed", matches: 6, wins: 4, points: 283.72 } },
  { username: "leon", email: "leon@example.com", password: "leon123", totalMatches: 35, wins: 24, points: 744.16, team: null, lastBattle: null },
  { username: "red", email: "red@example.com", password: "red123", totalMatches: 30, wins: 19, points: 612.05, team: null, lastBattle: null },
  { username: "blue", email: "blue@example.com", password: "blue123", totalMatches: 28, wins: 17, points: 560.88, team: null, lastBattle: null },
  { username: "misty", email: "misty@example.com", password: "misty123", totalMatches: 25, wins: 14, points: 489.20, team: null, lastBattle: null }
];

function getLeaderboard() {
  return [...TRAINERS].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (a.totalMatches !== b.totalMatches) return a.totalMatches - b.totalMatches;
    return a.username.localeCompare(b.username);
  });
}

function getTrainerRank(username) {
  const lb = getLeaderboard();
  const idx = lb.findIndex(t => t.username === username);
  return idx === -1 ? null : idx + 1;
}
