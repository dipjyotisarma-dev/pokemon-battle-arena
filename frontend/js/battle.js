/* ============================================================
   BATTLE ARENA
   Drives every screen on battle.html as one linear session:
   team reveal -> (match intro -> pick Pokémon -> matchup confirm
   -> arena combat -> match summary) x up to 6 -> session summary.

   All combat rules, damage calculation, speed, STAB, type effectiveness,
   AI actions, HP deductions, match winners, points, and leaderboard
   updates are computed EXCLUSIVELY by the FastAPI backend.
   ============================================================ */

/* ---------- Session state ---------- */
let battleId = null;
let currentMatchNumber = 1;
let completedMatchesCount = 0;
let completedWinsCount = 0;
let completedPointsCount = 0.0;
let currentRank = null;
let battleLog = [];
let battledTrainerSlots = new Set();
let battledOpponentIds = new Set();
let revealPhase = 'unrevealed'; // 'unrevealed' | 'revealing' | 'ready_to_start'

/* ---------- Current-match state ---------- */
let trainerTeamPreview = [];
let opponentTeamPreview = [];
let availableTrainerPokemon = [];
let currentOpponentPokemon = null;
let currentTrainerPokemon = null;
let currentTrainerHp = 0;
let currentTrainerMaxHp = 0;
let currentOpponentHp = 0;
let currentOpponentMaxHp = 0;
let firstAttacker = null; // 'trainer' | 'opponent'
let matchInProgress = false;
let awaitingPlayerMove = false;
let isEventAnimating = false;
let matchCompleted = false;

/* ============================================================
   SETUP & HELPERS
   ============================================================ */
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getPokemonTypes(p) {
  const types = [];
  if (p.type1) types.push(p.type1);
  if (p.type2) types.push(p.type2);
  return types;
}

function setMoveControlsEnabled(enabled) {
  const panel = document.getElementById('move-panel');
  if (!panel) return;
  panel.removeAttribute('hidden');
  panel.querySelectorAll('.move-btn').forEach((btn) => {
    btn.disabled = !enabled;
    if (enabled) {
      btn.removeAttribute('aria-disabled');
    } else {
      btn.setAttribute('aria-disabled', 'true');
    }
  });
}

/* ============================================================
   INITIALIZATION (POST /battle/start)
   ============================================================ */
async function initBattle() {
  console.log('[BATTLE] Initializing battle session...');
  battledTrainerSlots = new Set();
  battledOpponentIds = new Set();
  revealPhase = 'unrevealed';

  try {
    const resp = await window.Api.startBattle();
    if (!resp || !resp.data) {
      alert('Unable to start battle.');
      window.location.href = 'dashboard.html';
      return;
    }

    const data = resp.data;
    battleId = data.battle_id;
    currentMatchNumber = data.current_match || 1;
    completedMatchesCount = data.completed_matches || 0;
    completedWinsCount = data.completed_wins || 0;
    completedPointsCount = data.completed_points || 0.0;
    trainerTeamPreview = data.trainer_team || [];
    opponentTeamPreview = data.opponent_team || [];

    console.log(`[BATTLE] Battle started: ${battleId}, Matches: ${completedMatchesCount}/6`);

    showScreen('reveal');
    await runTeamReveal();
  } catch (err) {
    if (err && err.name === 'ApiError' && (err.status === 401 || err.status === 403)) {
      window.location.href = 'index.html';
      return;
    }
    const msg = err.body?.detail || err.message || 'Error starting battle.';
    alert(msg);
    window.location.href = 'dashboard.html';
  }
}

/* ============================================================
   SCREEN SWITCHING
   ============================================================ */
function showScreen(name) {
  console.log(`[BATTLE] Screen transition -> ${name}`);
  document.querySelectorAll('.battle-screen').forEach((el) => {
    el.hidden = el.getAttribute('data-screen') !== name;
  });
  const logPanel = document.getElementById('battle-log-panel');
  if (logPanel) {
    logPanel.hidden = name !== 'arena';
  }
  const trainerTracker = document.getElementById('trainer-team-tracker');
  if (trainerTracker) {
    trainerTracker.hidden = name !== 'arena';
  }
  const opponentTracker = document.getElementById('opponent-team-tracker');
  if (opponentTracker) {
    opponentTracker.hidden = name !== 'arena';
  }
  if (name === 'arena') {
    renderTeamTrackers();
  }
}

/* ============================================================
   TEAM REVEAL
   ============================================================ */
function revealCardHTML(pokemonPreview, revealed) {
  if (!revealed) {
    return `<div class="reveal-card is-visible"><div class="mon-portrait"><span style="font-family:var(--font-mono);color:var(--text-faint);font-size:1.3rem;">?</span></div><div class="mon-name">???</div></div>`;
  }
  const displayName = pokemonPreview.display_name || pokemonPreview.name;
  return `<div class="reveal-card is-visible"><div class="mon-portrait">${pokemonPortraitHTML({ id: pokemonPreview.id, name: displayName }, 40)}</div><div class="mon-name">${displayName}</div></div>`;
}

async function runTeamReveal() {
  revealPhase = 'unrevealed';
  const playerGrid = document.getElementById('reveal-player-grid');
  const opponentGrid = document.getElementById('reveal-opponent-grid');
  const startBtn = document.getElementById('start-battle-btn');

  // Display trainer's 6 Pokémon immediately
  playerGrid.innerHTML = trainerTeamPreview.map((p) => revealCardHTML(p, true)).join('');
  // Opponent team starts with 6 visible mystery ??? placeholder cards
  opponentGrid.innerHTML = opponentTeamPreview.map((p) => revealCardHTML(p, false)).join('');

  // Show Start Battle button
  if (startBtn) {
    startBtn.hidden = false;
    startBtn.disabled = false;
    startBtn.textContent = 'Start Battle';
  }
}

async function handleStartBattleClick() {
  const startBtn = document.getElementById('start-battle-btn');

  // If already revealed, clicking "START MATCH 1" starts Match 1
  if (revealPhase === 'ready_to_start') {
    if (startBtn) startBtn.disabled = true;
    beginMatch();
    return;
  }

  if (revealPhase === 'revealing') {
    return;
  }

  revealPhase = 'revealing';
  if (startBtn) {
    startBtn.disabled = true;
    startBtn.textContent = 'Revealing Opponents...';
  }

  // Sequentially reveal opponent team cards with ~850ms stagger
  const opponentCards = document.querySelectorAll('#reveal-opponent-grid .reveal-card');
  for (let i = 0; i < opponentCards.length; i += 1) {
    const mon = opponentTeamPreview[i];
    if (mon && opponentCards[i]) {
      const displayName = mon.display_name || mon.name;
      opponentCards[i].innerHTML = `<div class="mon-portrait">${pokemonPortraitHTML({ id: mon.id, name: displayName }, 40)}</div><div class="mon-name">${displayName}</div>`;
      // eslint-disable-next-line no-await-in-loop
      await wait(850);
    }
  }

  // Short pause after 6th opponent is revealed
  await wait(600);

  // Stop on team reveal screen and display "START MATCH 1" button
  revealPhase = 'ready_to_start';
  if (startBtn) {
    startBtn.textContent = 'START MATCH 1';
    startBtn.disabled = false;
  }
}

/* ============================================================
   TEAM TRACKERS (ARENA SCREEN)
   ============================================================ */
function renderTeamTrackers() {
  const trainerList = document.getElementById('trainer-tracker-list');
  const opponentList = document.getElementById('opponent-tracker-list');
  if (!trainerList || !opponentList) return;

  // Trainer team
  trainerList.innerHTML = trainerTeamPreview
    .map((mon) => {
      const isBattled = battledTrainerSlots.has(mon.slot);
      const isActive = currentTrainerPokemon && mon.slot === currentTrainerPokemon.slot && !isBattled;
      const displayName = mon.display_name || mon.name;
      const statusClass = isBattled ? 'is-completed' : isActive ? 'is-active' : 'is-available';

      return `
        <div class="tracker-item ${statusClass}" title="${displayName} (${isBattled ? 'Completed' : isActive ? 'Active' : 'Available'})">
          <div class="tracker-portrait">${pokemonPortraitHTML({ id: mon.id, name: displayName }, 26)}</div>
          <span class="tracker-name">${displayName}</span>
          ${isActive ? '<span class="tracker-active-badge">Active</span>' : '<span class="tracker-status-dot"></span>'}
        </div>
      `;
    })
    .join('');

  // Opponent team
  opponentList.innerHTML = opponentTeamPreview
    .map((mon) => {
      const isBattled = battledOpponentIds.has(mon.id);
      const isActive = currentOpponentPokemon && mon.id === currentOpponentPokemon.id && !isBattled;
      const displayName = mon.display_name || mon.name;
      const statusClass = isBattled ? 'is-completed' : isActive ? 'is-active' : 'is-available';

      return `
        <div class="tracker-item ${statusClass}" title="${displayName} (${isBattled ? 'Completed' : isActive ? 'Active' : 'Available'})">
          <div class="tracker-portrait">${pokemonPortraitHTML({ id: mon.id, name: displayName }, 26)}</div>
          <span class="tracker-name">${displayName}</span>
          ${isActive ? '<span class="tracker-active-badge">Active</span>' : '<span class="tracker-status-dot"></span>'}
        </div>
      `;
    })
    .join('');
}

/* ============================================================
   MATCH INTRO (POST /battle/{id}/start-match)
   ============================================================ */
async function beginMatch() {
  matchInProgress = false;
  matchCompleted = false;
  awaitingPlayerMove = false;
  isEventAnimating = false;
  battleLog = [];
  renderBattleLog();

  // Set the correct upcoming match number based on completed matches
  if (completedMatchesCount >= 0 && completedMatchesCount < 6) {
    currentMatchNumber = completedMatchesCount + 1;
  }

  showScreen('match-intro');
  const banner = document.getElementById('match-intro-banner');
  const sub = document.getElementById('match-intro-sub');
  const introCard = document.getElementById('opponent-intro-card');
  const chooseBtn = document.getElementById('choose-pokemon-btn');

  banner.textContent = `Match ${currentMatchNumber}`;
  sub.textContent = 'Choosing Opponent...';
  introCard.hidden = true;
  chooseBtn.hidden = true;

  try {
    const resp = await window.Api.startMatch(battleId);
    if (!resp || !resp.data) {
      alert('Unable to start match.');
      return;
    }

    const data = resp.data;
    currentMatchNumber = data.current_match || currentMatchNumber;
    currentOpponentPokemon = data.opponent_pokemon;
    availableTrainerPokemon = data.available_trainer_pokemon || [];

    console.log(`[BATTLE] Match ${currentMatchNumber} started. Opponent: ${currentOpponentPokemon.display_name || currentOpponentPokemon.name}`);

    await wait(600);
    banner.textContent = `Match ${currentMatchNumber}`;
    renderOpponentIntroCard(currentOpponentPokemon);
    sub.textContent = '';
    introCard.hidden = false;
    chooseBtn.hidden = false;
  } catch (err) {
    const msg = err.body?.detail || err.message || 'Error starting match.';
    alert(msg);
  }
}

function renderOpponentIntroCard(mon) {
  const types = getPokemonTypes(mon);
  const displayName = mon.display_name || mon.name;

  document.getElementById('opponent-intro-card').innerHTML = `
    <div class="mon-portrait">${pokemonPortraitHTML({ id: mon.id, name: displayName }, 96)}</div>
    <div class="mon-name">${displayName}</div>
    <div style="margin-bottom: var(--space-2);">${typePillsHTML(types)}</div>
    <div class="mon-intro-stats">
      <div class="cell"><span class="l">HP</span><span class="v">${mon.hp}</span></div>
      <div class="cell"><span class="l">Attack</span><span class="v">${mon.attack}</span></div>
      <div class="cell"><span class="l">Defense</span><span class="v">${mon.defense}</span></div>
      <div class="cell"><span class="l">Sp. Atk</span><span class="v">${mon.special_attack}</span></div>
      <div class="cell"><span class="l">Sp. Def</span><span class="v">${mon.special_defense}</span></div>
      <div class="cell"><span class="l">Speed</span><span class="v">${mon.speed}</span></div>
    </div>
  `;
}

/* ============================================================
   TRAINER POKÉMON SELECTION
   ============================================================ */
function showPlayerSelectScreen() {
  showScreen('player-select');
  const grid = document.getElementById('select-grid');

  const availableSlots = new Set(availableTrainerPokemon.map((p) => p.slot));

  grid.innerHTML = trainerTeamPreview
    .map((teamMember) => {
      const isAvailable = availableSlots.has(teamMember.slot);
      const displayName = teamMember.display_name || teamMember.name;
      const fullMon = availableTrainerPokemon.find((p) => p.slot === teamMember.slot);
      const types = fullMon ? getPokemonTypes(fullMon) : [];

      return `
        <button class="select-card card reticle" type="button" data-slot="${teamMember.slot}" ${!isAvailable ? 'disabled' : ''}>
          <div class="mon-portrait">${pokemonPortraitHTML({ id: teamMember.id, name: displayName }, 56)}</div>
          <div>
            <div class="mon-name">${displayName}</div>
            <div>${typePillsHTML(types)}</div>
          </div>
          ${!isAvailable ? '<div class="used-tag">Already Battled</div>' : '<div class="select-hint" style="font-family:var(--font-mono);font-size:0.65rem;color:var(--text-faint);text-transform:uppercase;margin-top:6px;">Available</div>'}
        </button>
      `;
    })
    .join('');

  grid.querySelectorAll('.select-card:not([disabled])').forEach((btn) => {
    btn.addEventListener('click', () => {
      const slot = Number(btn.getAttribute('data-slot'));
      selectTrainerPokemon(slot);
    });
  });
}

/* ============================================================
   MATCHUP CONFIRMATION (POST /battle/{id}/select-pokemon)
   ============================================================ */
function matchupCardHTML(mon) {
  const types = getPokemonTypes(mon);
  const displayName = mon.display_name || mon.name;
  return `
    <div class="matchup-card card">
      <div class="mon-portrait">${pokemonPortraitHTML({ id: mon.id, name: displayName }, 80)}</div>
      <div class="mon-name">${displayName}</div>
      <div style="margin-bottom: var(--space-2);">${typePillsHTML(types)}</div>
      <div class="mon-intro-stats" style="margin-top: var(--space-3);">
        <div class="cell"><span class="l">HP</span><span class="v">${mon.hp}</span></div>
        <div class="cell"><span class="l">Speed</span><span class="v">${mon.speed}</span></div>
        <div class="cell"><span class="l">Attack</span><span class="v">${mon.attack}</span></div>
      </div>
    </div>
  `;
}

async function selectTrainerPokemon(slot) {
  try {
    const resp = await window.Api.selectBattlePokemon(battleId, slot);
    if (!resp || !resp.data) {
      alert('Unable to select Pokémon.');
      return;
    }

    const data = resp.data;
    currentTrainerPokemon = data.trainer_pokemon;
    currentOpponentPokemon = data.opponent_pokemon;
    firstAttacker = data.first_attacker;

    console.log(`[BATTLE] Selected ${currentTrainerPokemon.display_name}. First Attacker: ${firstAttacker}`);

    showScreen('matchup');

    const firstAttackerName = firstAttacker === 'trainer'
      ? (currentTrainerPokemon.display_name || currentTrainerPokemon.name)
      : (currentOpponentPokemon.display_name || currentOpponentPokemon.name);

    document.getElementById('matchup-player-card').innerHTML = matchupCardHTML(currentTrainerPokemon);
    document.getElementById('matchup-opponent-card').innerHTML = matchupCardHTML(currentOpponentPokemon);
    document.getElementById('matchup-first-tag').textContent = `${firstAttackerName} attacks first`;
  } catch (err) {
    const msg = err.body?.detail || err.message || 'Error selecting Pokémon.';
    alert(msg);
  }
}

async function handleBackToSelection() {
  try {
    const resp = await window.Api.backToSelection(battleId);
    if (resp && resp.data) {
      availableTrainerPokemon = resp.data.available_trainer_pokemon || [];
      showPlayerSelectScreen();
    }
  } catch (err) {
    showPlayerSelectScreen();
  }
}

/* ============================================================
   ARENA SETUP & COMBAT (POST /battle/{id}/continue & /move)
   ============================================================ */
function hpStateForRatio(ratio) {
  if (ratio <= 0.2) return 'critical';
  if (ratio <= 0.5) return 'damaged';
  return 'healthy';
}

function renderHealthBar(side, currentHp, maxHp, displayName) {
  const safeCurrent = Math.max(0, currentHp);
  const safeMax = Math.max(1, maxHp);
  const ratio = safeCurrent / safeMax;
  const state = hpStateForRatio(ratio);

  const nameEl = document.getElementById(`${side}-hp-name`);
  const numEl = document.getElementById(`${side}-hp-numbers`);
  const track = document.getElementById(`${side}-hp-track`);
  const fill = document.getElementById(`${side}-hp-fill`);
  const label = document.getElementById(`${side}-hp-state-label`);

  if (nameEl) nameEl.textContent = displayName;
  if (numEl) numEl.textContent = `${safeCurrent} / ${safeMax}`;
  if (track) track.setAttribute('data-state', state);
  if (fill) fill.style.width = `${Math.min(100, Math.max(0, ratio * 100))}%`;
  if (label) {
    label.textContent = state === 'critical' ? 'Critical' : state === 'damaged' ? 'Damaged' : 'Healthy';
  }
}

function animateHealthBar(side, startHp, targetHp, maxHp, displayName, duration = 650) {
  return new Promise((resolve) => {
    const startTime = performance.now();
    const safeMax = Math.max(1, maxHp);
    const start = Math.max(0, startHp);
    const end = Math.max(0, targetHp);
    const diff = end - start;

    if (start === end || duration <= 0) {
      renderHealthBar(side, end, maxHp, displayName);
      resolve();
      return;
    }

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic for smooth deceleration
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * ease);

      renderHealthBar(side, current, maxHp, displayName);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        renderHealthBar(side, end, maxHp, displayName);
        resolve();
      }
    }

    requestAnimationFrame(step);
  });
}

function setCenterMessage(mainText, damageText, isCountdown = false) {
  const main = document.getElementById('center-line-main');
  const damage = document.getElementById('center-line-damage');
  const container = document.querySelector('.center-message');

  if (!main || !damage) return;

  if (isCountdown) {
    container?.classList.add('is-countdown');
  } else {
    container?.classList.remove('is-countdown');
  }

  main.textContent = mainText || '';
  damage.textContent = damageText || '';

  if (mainText) {
    main.classList.add('is-visible');
  } else {
    main.classList.remove('is-visible');
  }

  if (damageText) {
    damage.classList.add('is-visible');
  } else {
    damage.classList.remove('is-visible');
  }
}

function logEvent(text) {
  if (!text) return;
  battleLog.push(text);
  renderBattleLog();
}

function renderBattleLog() {
  const list = document.getElementById('battle-log-list');
  if (!list) return;
  list.innerHTML = battleLog
    .map((entry) => `<div class="battle-log-entry">${entry}</div>`)
    .join('');
  list.scrollTop = list.scrollHeight;
}

async function enterArena() {
  matchInProgress = true;
  matchCompleted = false;
  awaitingPlayerMove = false;
  isEventAnimating = false;
  battleLog = [];
  renderBattleLog();
  showScreen('arena');

  const playerDisplayName = currentTrainerPokemon.display_name || currentTrainerPokemon.name;
  const opponentDisplayName = currentOpponentPokemon.display_name || currentOpponentPokemon.name;

  document.getElementById('player-combatant').classList.remove('is-fainted', 'is-hit', 'is-attacking', 'is-anticipating');
  document.getElementById('opponent-combatant').classList.remove('is-fainted', 'is-hit', 'is-attacking', 'is-anticipating');
  document.getElementById('player-portrait').innerHTML = pokemonPortraitHTML({ id: currentTrainerPokemon.id, name: playerDisplayName }, 120);
  document.getElementById('opponent-portrait').innerHTML = pokemonPortraitHTML({ id: currentOpponentPokemon.id, name: opponentDisplayName }, 120);
  document.getElementById('player-name-tag').textContent = playerDisplayName;
  document.getElementById('opponent-name-tag').textContent = opponentDisplayName;

  // Immediately initialize health bars to full 100%
  currentTrainerMaxHp = currentTrainerPokemon.battle_max_hp || currentTrainerPokemon.hp;
  currentOpponentMaxHp = currentOpponentPokemon.battle_max_hp || currentOpponentPokemon.hp;
  currentTrainerHp = currentTrainerMaxHp;
  currentOpponentHp = currentOpponentMaxHp;

  renderHealthBar('player', currentTrainerHp, currentTrainerMaxHp, playerDisplayName);
  renderHealthBar('opponent', currentOpponentHp, currentOpponentMaxHp, opponentDisplayName);
  renderTeamTrackers();
  renderMovePanel();
  setMoveControlsEnabled(false);
  setCenterMessage('', '');

  try {
    const resp = await window.Api.continueBattle(battleId);
    if (!resp || !resp.data) {
      alert('Unable to continue battle.');
      return;
    }

    const data = resp.data;
    currentTrainerMaxHp = data.trainer_max_hp;
    currentOpponentMaxHp = data.opponent_max_hp;

    console.log(`[BATTLE] Entering arena. Max HP: Trainer=${currentTrainerMaxHp}, Opponent=${currentOpponentMaxHp}`);

    // Run prominent, visible countdown (3 -> 2 -> 1 -> BATTLE!)
    await runBattleCountdown();

    // If opponent attacked first on continue, sequentially present opening attack from full HP
    if (data.events && data.events.length > 0) {
      isEventAnimating = true;
      await animateEventSequence(data.events, data.battle_log);
      isEventAnimating = false;
    }

    // Synchronize to exact authoritative backend values
    currentTrainerHp = data.trainer_current_hp;
    currentOpponentHp = data.opponent_current_hp;
    renderHealthBar('player', currentTrainerHp, currentTrainerMaxHp, playerDisplayName);
    renderHealthBar('opponent', currentOpponentHp, currentOpponentMaxHp, opponentDisplayName);

    if (data.match_result || currentTrainerHp <= 0 || currentOpponentHp <= 0) {
      matchCompleted = true;
      setMoveControlsEnabled(false);
      await wait(1000);
      showMatchSummary(data.match_result, data.completed_matches, data.completed_points);
      return;
    }

    // Short pause before announcing trainer's turn
    await wait(300);
    presentTrainerTurn();
  } catch (err) {
    const msg = err.body?.detail || err.message || 'Error entering arena.';
    alert(msg);
  }
}

async function runBattleCountdown() {
  const steps = ['3', '2', '1', 'BATTLE!'];
  for (let i = 0; i < steps.length; i += 1) {
    setCenterMessage(steps[i], '', true);
    // eslint-disable-next-line no-await-in-loop
    await wait(600);
  }
  setCenterMessage('', '', false);
  await wait(250);
}

function presentTrainerTurn() {
  if (!matchInProgress || matchCompleted || currentTrainerHp <= 0 || currentOpponentHp <= 0) {
    setMoveControlsEnabled(false);
    return;
  }
  const playerDisplayName = currentTrainerPokemon.display_name || currentTrainerPokemon.name;
  setCenterMessage(`${playerDisplayName}'s Turn`, '');
  awaitingPlayerMove = true;
  isEventAnimating = false;
  renderMovePanel();
}

function renderMovePanel() {
  const panel = document.getElementById('move-panel');
  if (!panel || !currentTrainerPokemon) return;

  panel.removeAttribute('hidden');
  const moves = currentTrainerPokemon.moves || [];

  panel.innerHTML = moves
    .map((move) => {
      const moveName = move.display_name || move.move_name;
      return `
        <button class="move-btn reticle" type="button" data-move-id="${move.id}" disabled aria-disabled="true">
          <div class="move-name">${moveName}</div>
          <div class="move-meta">
            <span class="type-pill" data-type="${move.move_type}">${move.move_type}</span>
            <span>${move.category}</span>
            <span>PWR ${move.base_power}</span>
          </div>
        </button>
      `;
    })
    .join('');

  panel.querySelectorAll('.move-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!awaitingPlayerMove || !matchInProgress || matchCompleted || isEventAnimating || currentTrainerHp <= 0 || currentOpponentHp <= 0) {
        console.warn('[BATTLE] Click ignored: battle not in valid player turn state.');
        return;
      }
      const moveId = Number(btn.getAttribute('data-move-id'));
      executeTrainerMove(moveId);
    });
  });

  const shouldBeEnabled = awaitingPlayerMove && matchInProgress && !matchCompleted && !isEventAnimating && currentTrainerHp > 0 && currentOpponentHp > 0;
  setMoveControlsEnabled(shouldBeEnabled);
}

async function executeTrainerMove(moveId) {
  if (!matchInProgress || matchCompleted || isEventAnimating || !awaitingPlayerMove || currentTrainerHp <= 0 || currentOpponentHp <= 0) {
    console.warn('[BATTLE] executeTrainerMove blocked: Invalid move execution attempt.');
    return;
  }

  awaitingPlayerMove = false;
  setMoveControlsEnabled(false);
  isEventAnimating = true;

  try {
    console.log(`[BATTLE] Dispatching move id: ${moveId}`);
    const resp = await window.Api.executeMove(battleId, moveId);
    if (!resp || !resp.data) {
      alert('Unable to execute move.');
      isEventAnimating = false;
      return;
    }

    const data = resp.data;

    // Sequentially present all backend combat events
    if (data.events && data.events.length > 0) {
      await animateEventSequence(data.events, data.battle_log);
    }

    // Synchronize to exact authoritative backend values
    currentTrainerHp = data.trainer_current_hp;
    currentOpponentHp = data.opponent_current_hp;
    const playerDisplayName = currentTrainerPokemon.display_name || currentTrainerPokemon.name;
    const opponentDisplayName = currentOpponentPokemon.display_name || currentOpponentPokemon.name;
    renderHealthBar('player', currentTrainerHp, currentTrainerMaxHp, playerDisplayName);
    renderHealthBar('opponent', currentOpponentHp, currentOpponentMaxHp, opponentDisplayName);

    isEventAnimating = false;

    if (data.match_result || currentTrainerHp <= 0 || currentOpponentHp <= 0) {
      matchCompleted = true;
      setMoveControlsEnabled(false);
      await wait(1000);
      showMatchSummary(data.match_result, data.completed_matches, data.completed_points);
      return;
    }

    // Short pause before announcing next trainer turn
    await wait(300);
    presentTrainerTurn();
  } catch (err) {
    isEventAnimating = false;
    const msg = err.body?.detail || err.message || 'Error executing move.';
    alert(msg);
    if (!matchCompleted && currentTrainerHp > 0 && currentOpponentHp > 0) {
      presentTrainerTurn();
    }
  }
}

async function animateEventSequence(events, serverLogs) {
  const playerDisplayName = currentTrainerPokemon.display_name || currentTrainerPokemon.name;
  const opponentDisplayName = currentOpponentPokemon.display_name || currentOpponentPokemon.name;

  for (let i = 0; i < events.length; i += 1) {
    const ev = events[i];

    if (ev.type === 'attack') {
      const isPlayer = ev.actor === 'trainer';
      const attackerSide = isPlayer ? 'player' : 'opponent';
      const defenderSide = isPlayer ? 'opponent' : 'player';

      const attackerCombatant = document.getElementById(`${attackerSide}-combatant`);
      const defenderCombatant = document.getElementById(`${defenderSide}-combatant`);
      const defenderDisplayName = isPlayer ? opponentDisplayName : playerDisplayName;

      // STEP 1 — ATTACK ANTICIPATION (~250ms)
      attackerCombatant?.classList.add('is-anticipating');
      // eslint-disable-next-line no-await-in-loop
      await wait(250);
      attackerCombatant?.classList.remove('is-anticipating');

      // STEP 2 — ATTACK ANIMATION & MOVE ANNOUNCEMENT (~450ms)
      attackerCombatant?.classList.add('is-attacking');
      setCenterMessage(`${ev.pokemon} used ${ev.move}`, '');
      // eslint-disable-next-line no-await-in-loop
      await wait(450);
      attackerCombatant?.classList.remove('is-attacking');

      // STEP 3 — TARGET IMPACT & REACTION (~350ms)
      defenderCombatant?.classList.add('is-hit');
      // eslint-disable-next-line no-await-in-loop
      await wait(200);

      // STEP 4 — DAMAGE MESSAGE & CHRONOLOGICAL LOG ENTRY (~400ms)
      let damageText = `Dealt ${ev.damage} damage`;
      if (ev.effectiveness === 'super_effective') {
        damageText += ' — Super effective!';
      } else if (ev.effectiveness === 'not_very_effective') {
        damageText += ' — Not very effective!';
      }
      setCenterMessage(`${ev.pokemon} used ${ev.move}`, damageText);
      if (ev.message) logEvent(ev.message);
      // eslint-disable-next-line no-await-in-loop
      await wait(250);

      // STEP 5 — SMOOTH HEALTH BAR & NUMERIC DEPLETION (~650ms)
      const startHp = isPlayer ? currentOpponentHp : currentTrainerHp;
      const targetHp = Math.max(0, startHp - ev.damage);
      const maxHp = isPlayer ? currentOpponentMaxHp : currentTrainerMaxHp;

      if (isPlayer) {
        currentOpponentHp = targetHp;
      } else {
        currentTrainerHp = targetHp;
      }

      // eslint-disable-next-line no-await-in-loop
      await animateHealthBar(defenderSide, startHp, targetHp, maxHp, defenderDisplayName, 650);
      defenderCombatant?.classList.remove('is-hit');

      // eslint-disable-next-line no-await-in-loop
      await wait(400);

    } else if (ev.type === 'faint') {
      matchCompleted = true;
      awaitingPlayerMove = false;
      setMoveControlsEnabled(false);

      const isPlayerFaint = ev.actor === 'opponent'; // Fatal blow was against player
      const faintedSide = isPlayerFaint ? 'player' : 'opponent';
      const faintedCombatant = document.getElementById(`${faintedSide}-combatant`);

      // eslint-disable-next-line no-await-in-loop
      await wait(250);
      faintedCombatant?.classList.add('is-fainted');
      setCenterMessage(`${ev.pokemon} fainted!`, '');
      if (ev.message) logEvent(ev.message);

      console.log(`[BATTLE] Faint detected: ${ev.pokemon}`);
      // eslint-disable-next-line no-await-in-loop
      await wait(900);
    }
  }
}

/* ============================================================
   MATCH SUMMARY
   ============================================================ */
function showMatchSummary(matchResult, completedMatches, completedPoints) {
  matchInProgress = false;
  matchCompleted = true;
  awaitingPlayerMove = false;
  setMoveControlsEnabled(false);

  completedMatchesCount = completedMatches;
  completedPointsCount = completedPoints;

  if (currentTrainerPokemon) {
    battledTrainerSlots.add(currentTrainerPokemon.slot);
  }
  if (currentOpponentPokemon) {
    battledOpponentIds.add(currentOpponentPokemon.id);
  }
  renderTeamTrackers();

  const won = matchResult ? (matchResult.winner === 'trainer') : (currentOpponentHp <= 0);
  if (won) completedWinsCount += 1;

  showScreen('match-summary');
  const resultEl = document.getElementById('summary-result');
  resultEl.textContent = won ? 'Win' : 'Loss';
  resultEl.className = `summary-result ${won ? 'win' : 'loss'}`;

  const matchNum = (matchResult && matchResult.match != null) ? matchResult.match : (completedMatches || currentMatchNumber);
  document.getElementById('summary-match-number').textContent = matchNum;

  if (completedMatchesCount < 6) {
    currentMatchNumber = completedMatchesCount + 1;
  }

  const rawPts = matchResult && matchResult.match_points != null ? Number(matchResult.match_points) : 0;
  const formattedPoints = rawPts >= 0 ? `+${rawPts.toFixed(1)}` : `${rawPts.toFixed(1)}`;
  document.getElementById('summary-points').textContent = formattedPoints;

  console.log(`[BATTLE] Match ${matchNum} summary rendered. Won: ${won}, Points: ${formattedPoints}`);

  const nextBtn = document.getElementById('next-match-btn');
  if (completedMatchesCount >= 6) {
    nextBtn.textContent = 'Finish';
    nextBtn.onclick = async () => {
      await fetchUpdatedRankAndShowSessionSummary();
    };
  } else {
    nextBtn.textContent = 'Next Match';
    nextBtn.onclick = beginMatch;
  }
}

async function fetchUpdatedRankAndShowSessionSummary() {
  try {
    const resp = await window.Api.getTrainerDashboard();
    if (resp && resp.data && resp.data.rank != null) {
      currentRank = resp.data.rank;
    }
  } catch (err) {
    // Proceed gracefully if fetch fails
  }
  showSessionSummary();
}

/* ============================================================
   SESSION SUMMARY & EXIT (POST /battle/{id}/exit)
   ============================================================ */
function showSessionSummary() {
  showScreen('session-summary');

  document.getElementById('session-matches').textContent = completedMatchesCount;
  document.getElementById('session-wins').textContent = completedWinsCount;
  const rawPts = Number(completedPointsCount || 0);
  const formattedPoints = rawPts >= 0 ? `+${rawPts.toFixed(1)}` : `${rawPts.toFixed(1)}`;
  document.getElementById('session-points').textContent = formattedPoints;
  document.getElementById('session-rank').textContent = currentRank ? `#${currentRank}` : '—';
}

function exitBattle() {
  openModal('confirm-exit-modal');
}

async function confirmExitBattle() {
  closeModal('confirm-exit-modal');
  matchInProgress = false;
  matchCompleted = true;
  setMoveControlsEnabled(false);

  if (battleId) {
    try {
      const resp = await window.Api.exitBattle(battleId);
      if (resp && resp.data) {
        completedMatchesCount = resp.data.completed_matches;
        completedWinsCount = resp.data.completed_wins;
        completedPointsCount = resp.data.completed_points;
        currentRank = resp.data.rank;

        if (completedMatchesCount > 0) {
          showSessionSummary();
          return;
        }
      }
    } catch (err) {
      // Exit failed or battle not found -> redirect
    }
  }

  window.location.href = 'dashboard.html';
}

/* ============================================================
   INIT & EVENT LISTENERS
   ============================================================ */
function initBattlePage() {
  document.getElementById('start-battle-btn')?.addEventListener('click', handleStartBattleClick);
  document.getElementById('choose-pokemon-btn')?.addEventListener('click', showPlayerSelectScreen);
  document.getElementById('matchup-back-btn')?.addEventListener('click', handleBackToSelection);
  document.getElementById('matchup-continue-btn')?.addEventListener('click', enterArena);
  document.getElementById('return-to-dashboard-btn')?.addEventListener('click', () => {
    window.location.href = 'dashboard.html';
  });
  document.querySelectorAll('.exit-battle-btn').forEach((btn) => btn.addEventListener('click', exitBattle));
  document.getElementById('confirm-exit-btn')?.addEventListener('click', confirmExitBattle);

  initBattle();
}

document.addEventListener('DOMContentLoaded', initBattlePage);