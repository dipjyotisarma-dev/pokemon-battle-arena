// ==========================================================
// BATTLE.JS — battle state machine and combat logic
// ==========================================================

const BATTLE_STATES = {
  TEAM_REVEAL: "TEAM_REVEAL",
  MATCH_PREPARATION: "MATCH_PREPARATION",
  OPPONENT_DISPLAY: "OPPONENT_DISPLAY",
  TRAINER_SELECTION: "TRAINER_SELECTION",
  VS_SCREEN: "VS_SCREEN",
  BATTLE_INTRO: "BATTLE_INTRO",
  IN_PROGRESS: "IN_PROGRESS",
  MATCH_RESULT: "MATCH_RESULT",
  FINAL_RESULT: "FINAL_RESULT",
  EXIT_CONFIRMATION: "EXIT_CONFIRMATION"
};

function generateOpponentTeam(trainerTeam) {
  const usedIds = new Set(trainerTeam.map(p => p.pokemon.id));
  const pool = POKEMON.filter(p => !usedIds.has(p.id));
  const nonRestricted = pool.filter(p => !isRestrictedCategory(p));
  const restricted = pool.filter(p => isRestrictedCategory(p));
  const shuffled = [...nonRestricted].sort(() => Math.random() - 0.5);
  const team = shuffled.slice(0, 5);
  if (restricted.length > 0 && Math.random() > 0.4) {
    team.push(restricted[Math.floor(Math.random() * restricted.length)]);
  } else if (shuffled.length > 5) {
    team.push(shuffled[5]);
  } else {
    team.push(nonRestricted[Math.floor(Math.random() * nonRestricted.length)]);
  }
  return team.slice(0, 6).map(p => ({
    pokemon: p,
    moves: [...p.moves].sort(() => Math.random() - 0.5).slice(0, 4)
  }));
}

function startBattle(trainer) {
  const trainerTeam = trainer.team;
  const opponentTeam = generateOpponentTeam(trainerTeam);
  APP.battle = {
    state: BATTLE_STATES.TEAM_REVEAL,
    trainerTeam,
    opponentTeam,
    revealedOpponentCount: 0,
    usedTrainerIds: new Set(),
    usedOpponentIds: new Set(),
    matchNumber: 0,
    currentOpponent: null,
    currentTrainerPokemon: null,
    firstAttacker: null,
    completedMatches: 0,
    wins: 0,
    points: 0,
    // live combat state
    combat: null
  };
  APP.page = "battle";
  render();
}

function pickRandomUnusedOpponent() {
  const b = APP.battle;
  const remaining = b.opponentTeam.filter(entry => !b.usedOpponentIds.has(entry.pokemon.id));
  return remaining[Math.floor(Math.random() * remaining.length)];
}

function beginMatch() {
  const b = APP.battle;
  b.matchNumber += 1;
  b.currentOpponent = pickRandomUnusedOpponent();
  b.currentTrainerPokemon = null;
  b.state = BATTLE_STATES.OPPONENT_DISPLAY;
  render();
}

function selectTrainerPokemonForMatch(entry) {
  const b = APP.battle;
  b.currentTrainerPokemon = entry;
  const trainerSpeed = entry.pokemon.speed;
  const oppSpeed = b.currentOpponent.pokemon.speed;
  b.firstAttacker = trainerSpeed >= oppSpeed ? "trainer" : "opponent";
  b.state = BATTLE_STATES.VS_SCREEN;
  render();
}

function backToTrainerSelection() {
  const b = APP.battle;
  b.currentTrainerPokemon = null;
  b.state = BATTLE_STATES.TRAINER_SELECTION;
  render();
}

function confirmMatchup() {
  const b = APP.battle;
  const tMax = battleMaxHP(b.currentTrainerPokemon.pokemon);
  const oMax = battleMaxHP(b.currentOpponent.pokemon);
  b.combat = {
    trainerHP: tMax, trainerMaxHP: tMax,
    opponentHP: oMax, opponentMaxHP: oMax,
    turn: b.firstAttacker,
    log: [],
    centerEvent: null,
    finished: false
  };
  b.state = BATTLE_STATES.BATTLE_INTRO;
  render();
}

function calcDamage(attackerEntry, defenderEntry, move) {
  const atkP = attackerEntry.pokemon;
  const defP = defenderEntry.pokemon;
  const atkStat = move.category === "physical" ? atkP.attack : atkP.specialAttack;
  const defStat = move.category === "physical" ? defP.defense : defP.specialDefense;
  const eff = typeEffectiveness(move.type, [defP.type1, defP.type2]);
  const raw = move.basePower * (atkStat / Math.max(1, defStat)) * 0.6 * eff;
  const variance = 0.9 + Math.random() * 0.2;
  const dmg = Math.max(1, Math.round(raw * variance));
  return { dmg, eff };
}

function performTrainerMove(move) {
  const b = APP.battle;
  const c = b.combat;
  const { dmg, eff } = calcDamage(b.currentTrainerPokemon, b.currentOpponent, move);
  c.opponentHP = clamp(c.opponentHP - dmg, 0, c.opponentMaxHP);
  const effText = eff > 1 ? "SUPER EFFECTIVE!" : eff < 1 && eff > 0 ? "NOT VERY EFFECTIVE!" : eff === 0 ? "NO EFFECT!" : "NORMAL DAMAGE";
  const line1 = `${b.currentTrainerPokemon.pokemon.displayName} used ${move.displayName}!`;
  const line2 = `Dealt ${dmg} damage — ${effText}`;
  c.log.push(`${line1} — ${dmg} damage (${effText})`);
  return { line1, line2, fainted: c.opponentHP <= 0, dmg };
}

function performOpponentMove() {
  const b = APP.battle;
  const c = b.combat;
  const move = b.currentOpponent.moves[Math.floor(Math.random() * b.currentOpponent.moves.length)];
  const { dmg, eff } = calcDamage(b.currentOpponent, b.currentTrainerPokemon, move);
  c.trainerHP = clamp(c.trainerHP - dmg, 0, c.trainerMaxHP);
  const effText = eff > 1 ? "SUPER EFFECTIVE!" : eff < 1 && eff > 0 ? "NOT VERY EFFECTIVE!" : eff === 0 ? "NO EFFECT!" : "NORMAL DAMAGE";
  const line1 = `${b.currentOpponent.pokemon.displayName} used ${move.displayName}!`;
  const line2 = `Dealt ${dmg} damage — ${effText}`;
  c.log.push(`${line1} — ${dmg} damage (${effText})`);
  return { line1, line2, fainted: c.trainerHP <= 0, dmg };
}

function finishMatch(trainerWon) {
  const b = APP.battle;
  const c = b.combat;
  const oppMax = c.opponentMaxHP, oppRem = c.opponentHP;
  const yourMax = c.trainerMaxHP, yourRem = c.trainerHP;
  const damageRatio = (oppMax - oppRem) / oppMax;
  const lossRatio = (yourMax - yourRem) / yourMax;
  const basePoints = (damageRatio - lossRatio) * 100;
  const matchPoints = trainerWon ? 10 + basePoints : 0 + basePoints;

  b.completedMatches += 1;
  if (trainerWon) b.wins += 1;
  b.points += matchPoints;

  b.usedTrainerIds.add(b.currentTrainerPokemon.pokemon.id);
  b.usedOpponentIds.add(b.currentOpponent.pokemon.id);

  b.lastMatchSummary = {
    matchNumber: b.matchNumber,
    trainerWon,
    trainerName: b.currentTrainerPokemon.pokemon.displayName,
    opponentName: b.currentOpponent.pokemon.displayName,
    matchPoints
  };

  b.state = BATTLE_STATES.MATCH_RESULT;
  render();
}

function goToNextMatch() {
  const b = APP.battle;
  if (b.completedMatches >= 6) {
    finalizeBattle("completed");
    return;
  }
  b.combat = null;
  b.currentOpponent = null;
  b.currentTrainerPokemon = null;
  b.state = BATTLE_STATES.TRAINER_SELECTION;
  beginMatch();
}

function finalizeBattle(status) {
  const b = APP.battle;
  const trainer = APP.currentUser;
  trainer.totalMatches += b.completedMatches;
  trainer.wins += b.wins;
  trainer.points = Math.round((trainer.points + b.points) * 100) / 100;
  trainer.lastBattle = {
    status,
    matches: b.completedMatches,
    wins: b.wins,
    points: Math.round(b.points * 100) / 100
  };
  b.state = BATTLE_STATES.FINAL_RESULT;
  b.finalStatus = status;
  render();
}

function exitBattle() {
  const b = APP.battle;
  const status = b.completedMatches > 0 ? (b.completedMatches >= 6 ? "completed" : "abandoned") : "abandoned";
  finalizeBattle(status);
}

function returnToDashboardFromBattle() {
  APP.battle = null;
  APP.page = "dashboard";
  APP.dashboardSection = "dashboard";
  render();
}
