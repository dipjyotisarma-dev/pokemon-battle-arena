/* ============================================================
   DEMO DATA STORE
   All in-memory. Resets on page refresh — that's expected for this
   prototype stage. Every other module reads/writes through here so
   that swapping this for real FastAPI calls later only touches one
   file's worth of function bodies (see js/api.js pattern in later
   phases), not the rest of the app.
   ============================================================ */

const DemoData = (() => {
  /** @type {{id:number, username:string, email:string, password:string}[]} */
  const trainers = [
    { id: 1, username: 'AshK', email: 'ash@pallet.town', password: 'Pikachu123!' },
    { id: 2, username: 'MistyWater', email: 'misty@cerulean.gym', password: 'Staryu456!' },
  ];

  /** @type {{trainerId:number, rank:number, matches:number, wins:number, points:number, lastBattle: object|null}[]} */
  const trainerStats = [
    { trainerId: 1, rank: 4, matches: 12, wins: 8, points: 1240, lastBattle: null },
    { trainerId: 2, rank: 9, matches: 7, wins: 3, points: 640, lastBattle: null },
  ];

  /** @type {{rank:number, trainerName:string, matches:number, wins:number, points:number}[]} */
  const leaderboard = [
    { rank: 1, trainerName: 'RedChampion', matches: 40, wins: 37, points: 5120 },
    { rank: 2, trainerName: 'BlueOak', matches: 38, wins: 33, points: 4780 },
    { rank: 3, trainerName: 'LanceDragon', matches: 35, wins: 29, points: 4410 },
    { rank: 4, trainerName: 'AshK', matches: 12, wins: 8, points: 1240 },
    { rank: 5, trainerName: 'CynthiaGC', matches: 30, wins: 22, points: 3900 },
    { rank: 6, trainerName: 'BrockRock', matches: 20, wins: 14, points: 2100 },
    { rank: 7, trainerName: 'ErikaGrass', matches: 18, wins: 11, points: 1890 },
    { rank: 8, trainerName: 'KogaPoison', matches: 15, wins: 9, points: 1400 },
    { rank: 9, trainerName: 'MistyWater', matches: 7, wins: 3, points: 640 },
    { rank: 10, trainerName: 'SabrinaPsy', matches: 10, wins: 5, points: 980 },
  ];

  /* Base stats follow the standard six-stat model. Battle HP is derived,
     never stored, so the formula only lives in one place (js/battle.js). */
  const pokemon = [
    { id: 6, name: 'Charizard', types: ['Fire', 'Flying'], category: 'Standard',
      stats: { hp: 78, atk: 84, def: 78, spa: 109, spd: 85, spe: 100 } },
    { id: 9, name: 'Blastoise', types: ['Water'], category: 'Standard',
      stats: { hp: 79, atk: 83, def: 100, spa: 85, spd: 105, spe: 78 } },
    { id: 3, name: 'Venusaur', types: ['Grass', 'Poison'], category: 'Standard',
      stats: { hp: 80, atk: 82, def: 83, spa: 100, spd: 100, spe: 80 } },
    { id: 25, name: 'Pikachu', types: ['Electric'], category: 'Standard',
      stats: { hp: 35, atk: 55, def: 40, spa: 50, spd: 50, spe: 90 } },
    { id: 130, name: 'Gyarados', types: ['Water', 'Flying'], category: 'Standard',
      stats: { hp: 95, atk: 125, def: 79, spa: 60, spd: 100, spe: 81 } },
    { id: 445, name: 'Garchomp', types: ['Dragon', 'Ground'], category: 'Standard',
      stats: { hp: 108, atk: 130, def: 95, spa: 80, spd: 85, spe: 102 } },
    { id: 448, name: 'Lucario', types: ['Fighting', 'Steel'], category: 'Standard',
      stats: { hp: 70, atk: 110, def: 70, spa: 115, spd: 70, spe: 90 } },
    { id: 94, name: 'Gengar', types: ['Ghost', 'Poison'], category: 'Standard',
      stats: { hp: 60, atk: 65, def: 60, spa: 130, spd: 75, spe: 110 } },
    { id: 149, name: 'Dragonite', types: ['Dragon', 'Flying'], category: 'Standard',
      stats: { hp: 91, atk: 134, def: 95, spa: 100, spd: 100, spe: 80 } },
    { id: 248, name: 'Tyranitar', types: ['Rock', 'Dark'], category: 'Standard',
      stats: { hp: 100, atk: 134, def: 110, spa: 95, spd: 100, spe: 61 } },
    { id: 144, name: 'Articuno', types: ['Ice', 'Flying'], category: 'Legendary',
      stats: { hp: 90, atk: 85, def: 100, spa: 95, spd: 125, spe: 85 } },
    { id: 150, name: 'Mewtwo', types: ['Psychic'], category: 'Legendary',
      stats: { hp: 106, atk: 110, def: 90, spa: 154, spd: 90, spe: 130 } },
    { id: 151, name: 'Mew', types: ['Psychic'], category: 'Mythical',
      stats: { hp: 100, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 } },
    { id: 793, name: 'Nihilego', types: ['Rock', 'Poison'], category: 'Ultra Beast',
      stats: { hp: 109, atk: 53, def: 47, spa: 127, spd: 131, spe: 103 } },
    { id: 65, name: 'Alakazam', types: ['Psychic'], category: 'Standard',
      stats: { hp: 55, atk: 50, def: 45, spa: 135, spd: 95, spe: 120 } },
    { id: 68, name: 'Machamp', types: ['Fighting'], category: 'Standard',
      stats: { hp: 90, atk: 130, def: 80, spa: 65, spd: 85, spe: 55 } },
    { id: 143, name: 'Snorlax', types: ['Normal'], category: 'Standard',
      stats: { hp: 160, atk: 110, def: 65, spa: 65, spd: 110, spe: 30 } },
    { id: 212, name: 'Scizor', types: ['Bug', 'Steel'], category: 'Standard',
      stats: { hp: 70, atk: 130, def: 100, spa: 55, spd: 80, spe: 65 } },
  ];

  /* Move set kept small but varied enough to demo type/category logic. */
  const moves = [
    { id: 'flamethrower', name: 'Flamethrower', type: 'Fire', category: 'Special', power: 90 },
    { id: 'dragon-claw', name: 'Dragon Claw', type: 'Dragon', category: 'Physical', power: 80 },
    { id: 'aura-sphere', name: 'Aura Sphere', type: 'Fighting', category: 'Special', power: 80 },
    { id: 'hydro-pump', name: 'Hydro Pump', type: 'Water', category: 'Special', power: 110 },
    { id: 'earthquake', name: 'Earthquake', type: 'Ground', category: 'Physical', power: 100 },
    { id: 'shadow-ball', name: 'Shadow Ball', type: 'Ghost', category: 'Special', power: 80 },
    { id: 'thunderbolt', name: 'Thunderbolt', type: 'Electric', category: 'Special', power: 90 },
    { id: 'stone-edge', name: 'Stone Edge', type: 'Rock', category: 'Physical', power: 100 },
    { id: 'close-combat', name: 'Close Combat', type: 'Fighting', category: 'Physical', power: 120 },
    { id: 'ice-beam', name: 'Ice Beam', type: 'Ice', category: 'Special', power: 90 },
    { id: 'giga-drain', name: 'Giga Drain', type: 'Grass', category: 'Special', power: 75 },
    { id: 'wing-attack', name: 'Wing Attack', type: 'Flying', category: 'Physical', power: 60 },
    { id: 'iron-head', name: 'Iron Head', type: 'Steel', category: 'Physical', power: 80 },
    { id: 'psychic', name: 'Psychic', type: 'Psychic', category: 'Special', power: 90 },
    { id: 'x-scissor', name: 'X-Scissor', type: 'Bug', category: 'Physical', power: 80 },
    { id: 'body-slam', name: 'Body Slam', type: 'Normal', category: 'Physical', power: 85 },
    { id: 'sludge-bomb', name: 'Sludge Bomb', type: 'Poison', category: 'Special', power: 90 },
    { id: 'crunch', name: 'Crunch', type: 'Dark', category: 'Physical', power: 80 },
  ];

  /* No teams registered yet in the demo — dashboard should render the
     "no team" empty state until Create Team runs. Keyed by trainerId.
     A team entry is: { slots: [ {pokemonId, moveIds:[...4]} | null, ...6 ] } */
  const teams = {};

  /* ---------- Shared lookup / filter helpers ----------
     Kept here (not duplicated in team.js / pokedex.js) since both
     pages query the same Pokémon and move pools. */

  function getPokemonById(id) {
    return pokemon.find((p) => p.id === id) || null;
  }

  function getMoveById(id) {
    return moves.find((m) => m.id === id) || null;
  }

  function isRestrictedCategory(pokemonEntry) {
    return pokemonEntry.category !== 'Standard';
  }

  /** Base Stat Total, used by the Pokédex table. */
  function getBST(pokemonEntry) {
    const s = pokemonEntry.stats;
    return s.hp + s.atk + s.def + s.spa + s.spd + s.spe;
  }

  /** Battle HP per the established rule: 5 × base HP. */
  function getBattleHP(pokemonEntry) {
    return pokemonEntry.stats.hp * 5;
  }

  /**
   * Filters the Pokémon pool by name substring and/or type.
   * Either argument may be empty/undefined to skip that filter.
   */
  function filterPokemon(query, type) {
    const q = (query || '').trim().toLowerCase();
    const t = (type || '').trim();
    return pokemon.filter((p) => {
      const matchesName = !q || p.name.toLowerCase().includes(q) || String(p.id).includes(q);
      const matchesType = !t || p.types.includes(t);
      return matchesName && matchesType;
    });
  }

  /** All distinct types present in the pool, sorted alphabetically — used to build filter dropdowns. */
  function getAllTypes() {
    const set = new Set();
    pokemon.forEach((p) => p.types.forEach((type) => set.add(type)));
    return Array.from(set).sort();
  }

  function getTrainerStats(trainerId) {
    return trainerStats.find((s) => s.trainerId === trainerId) || null;
  }

  function getTeam(trainerId) {
    return teams[trainerId] || null;
  }

  return {
    trainers,
    trainerStats,
    leaderboard,
    pokemon,
    moves,
    teams,
    getPokemonById,
    getMoveById,
    isRestrictedCategory,
    getBST,
    getBattleHP,
    filterPokemon,
    getAllTypes,
    getTrainerStats,
    getTeam,
  };
})();

/* ============================================================
   DEMO SESSION
   Because the project may not use localStorage/sessionStorage and
   each page is a full document load, there is no real way to carry
   an authenticated session between pages yet. For this frontend
   prototype, the trainer below stands in as "whoever just logged
   in" so dashboard.html / pokedex.html have someone to render.
   This is the single seam to replace once the FastAPI backend
   provides real session/cookie-based authentication.
   ============================================================ */
const AppSession = {
  activeTrainerId: 1, // AshK — see js/data.js DemoData.trainers
  getActiveTrainer() {
    return DemoData.trainers.find((t) => t.id === this.activeTrainerId) || null;
  },
};

/* ============================================================
   SHARED RENDER HELPERS
   Small HTML-building functions reused across dashboard.js,
   team.js, and pokedex.js so type pills / portraits are never
   implemented more than once.
   ============================================================ */

function typePillsHTML(types) {
  return types.map((t) => `<span class="type-pill" data-type="${t}">${t}</span>`).join('');
}

/** Renders a Pokémon's local image, falling back to its initials if the
 *  asset isn't present yet (see assets/images/pokemon/ in the skill doc). */
function pokemonPortraitHTML(pokemonEntry, size) {
  const path = `assets/images/pokemon/${pokemonEntry.id}.png`;
  const initials = pokemonEntry.name.slice(0, 2).toUpperCase();
  return `<img src="${path}" alt="${pokemonEntry.name}" width="${size}" height="${size}"
    onerror="this.replaceWith(Object.assign(document.createElement('span'), {textContent:'${initials}', style:'font-family:var(--font-mono);font-size:0.7rem;color:var(--text-faint);'}))" />`;
}