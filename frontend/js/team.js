/* ============================================================
   TEAM BUILDER
   (Modified to integrate with backend API for Create/Edit/Load/Save/Move Options)
   Note: preserves existing DOM structure and UX. Uses window.Api and window.Session
   created in Phase 1. If API is unreachable, shows connection error messages and
   does not silently fallback to DemoData for team persistence.
   ============================================================ */

const TEAM_SIZE = 6;
const MOVES_PER_POKEMON = 4;

/** @type {(null | {pokemonId:number, moveIds:number[]})[]} */
let teamDraft = new Array(TEAM_SIZE).fill(null);
let activeSlotIndex = null;

// Cache move options per pokemon id (from GET /team/{pokemon_id}/move-options)
const moveOptionsCache = {};

// Small helper to load Api/Session if not yet present
function _loadScript(src) {
  return new Promise((resolve, reject) => {
    const filename = src.split('/').pop();
    const existing = document.querySelector(`script[src$="${filename}"]`);
    if (existing) {
      if (existing.readyState === 'complete' || existing.readyState === 'loaded') return resolve();
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', (e) => reject(e));
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = false;
    s.onload = () => resolve();
    s.onerror = (e) => reject(e);
    document.head.appendChild(s);
  });
}

async function ensureApiLoaded() {
  if (!window.Session) await _loadScript('js/session.js');
  if (!window.Api) await _loadScript('js/api.js');
}

// Helper to get display name for a move id, preferring cached moveOptions then DemoData
function getMoveName(moveId, pokemonId) {
  try {
    const idNum = Number(moveId);
    if (moveOptionsCache[pokemonId]) {
      const m = moveOptionsCache[pokemonId].find((mo) => mo.id === idNum);
      if (m) return m.display_name || m.move_name || String(idNum);
    }
    const demoMove = typeof DemoData !== 'undefined' ? DemoData.getMoveById(idNum) : null;
    if (demoMove) return demoMove.name;
    return String(moveId);
  } catch (e) {
    return String(moveId);
  }
}

/* ============================================================
   ENTRY POINTS (called by setActiveSection in dashboard.js)
   ============================================================ */

/** Create Team: blank builder only. Uses GET /team to determine if trainer already has a team. */
async function renderCreateTeam() {
  const existsNotice = document.getElementById('team-exists-notice');
  const nothingNotice = document.getElementById('team-builder-empty-notice');
  const builder = document.getElementById('team-builder');

  nothingNotice.hidden = true;
  existsNotice.hidden = true;
  builder.hidden = true;
  document.getElementById('team-builder-title').textContent = 'Create Team';

  // Check backend for existing team
  try {
    await ensureApiLoaded();
    const resp = await window.Api.getTeam();
    // If we get here, trainer already has a team
    existsNotice.hidden = false;
    builder.hidden = true;
    return;
  } catch (err) {
    if (err && err.name === 'ApiError' && err.status === 404) {
      // No team yet -> allow create
      existsNotice.hidden = true;
      builder.hidden = false;
      enterTeamBuilder(new Array(TEAM_SIZE).fill(null));
      return;
    }
    if (err && err.name === 'ApiError' && (err.status === 401 || err.status === 403)) {
      window.location.href = 'index.html';
      return;
    }

    existsNotice.hidden = false;
    builder.hidden = true;
    existsNotice.textContent = 'Unable to check existing team: ' + (err?.message || 'Connection error');
    return;
  }
}

/** Edit Team: the only place a saved team can be modified. Loads team from server using GET /team. */
async function renderEditTeam() {
  const existsNotice = document.getElementById('team-exists-notice');
  const nothingNotice = document.getElementById('team-builder-empty-notice');
  const builder = document.getElementById('team-builder');

  existsNotice.hidden = true;
  nothingNotice.hidden = true;
  builder.hidden = true;
  document.getElementById('team-builder-title').textContent = 'Edit Team';

  try {
    await ensureApiLoaded();
    const resp = await window.Api.getTeam();
    if (resp && resp.data && resp.data.slots) {
      // Map server team to teamDraft shape and cache move metadata
      const slots = resp.data.slots;
      const mapped = new Array(TEAM_SIZE).fill(null);
      slots.forEach((slot) => {
        const idx = slot.slot - 1;
        mapped[idx] = { pokemonId: slot.pokemon_id, moveIds: slot.move_ids.map((id) => Number(id)) };
        if (slot.moves && Array.isArray(slot.moves)) {
          if (!moveOptionsCache[slot.pokemon_id]) {
            moveOptionsCache[slot.pokemon_id] = [];
          }
          slot.moves.forEach((m) => {
            if (!moveOptionsCache[slot.pokemon_id].some((existing) => existing.id === Number(m.id))) {
              moveOptionsCache[slot.pokemon_id].push({
                id: Number(m.id),
                display_name: m.display_name || m.move_name,
                move_type: m.move_type,
                category: m.category,
                base_power: m.base_power,
              });
            }
          });
        }
      });
      enterTeamBuilder(mapped);
      builder.hidden = false;
      return;
    }
  } catch (err) {
    if (err && err.name === 'ApiError' && err.status === 404) {
      // No team to edit
      nothingNotice.hidden = false;
      builder.hidden = true;
      return;
    }
    if (err && err.name === 'ApiError' && (err.status === 401 || err.status === 403)) {
      window.location.href = 'index.html';
      return;
    }

    nothingNotice.hidden = false;
    builder.hidden = true;
    nothingNotice.textContent = 'Unable to load your team: ' + (err?.message || 'Connection error');
    return;
  }
}

/** Shared setup once either entry point has decided the builder should show. */
function enterTeamBuilder(initialDraft) {
  teamDraft = initialDraft;
  renderTeamSlots();
  renderValidation();
  document.getElementById('save-feedback').textContent = '';
}

/* ============================================================
   SLOT GRID
   ============================================================ */
function renderTeamSlots() {
  const grid = document.getElementById('team-slot-grid');
  grid.innerHTML = teamDraft
    .map((slot, index) => {
      if (!slot) {
        return `
          <button class="team-slot slot-empty reticle" type="button" data-slot="${index}">
            <span class="plus" aria-hidden="true">+</span>
            <span class="plus-label">Add Pokémon</span>
          </button>
        `;
      }

      const mon = DemoData.getPokemonById(slot.pokemonId);
      const moveCount = slot.moveIds.length;
      const moveSummaryClass = moveCount === MOVES_PER_POKEMON ? '' : 'incomplete';
      const moveSummaryText =
        moveCount === MOVES_PER_POKEMON
          ? slot.moveIds.map((id) => getMoveName(id, slot.pokemonId)).join(' · ')
          : `${moveCount}/${MOVES_PER_POKEMON} moves selected`;

      return `
        <button class="team-slot slot-filled reticle" type="button" data-slot="${index}">
          <div class="slot-top">
            <div class="mon-portrait">${pokemonPortraitHTML(mon, 40)}</div>
            <div>
              <div class="mon-name">${mon.name}</div>
              <div>${typePillsHTML(mon.types)}</div>
            </div>
          </div>
          <div class="move-summary ${moveSummaryClass}">${moveSummaryText}</div>
        </button>
      `;
    })
    .join('');

  grid.querySelectorAll('.team-slot').forEach((slotEl) => {
    slotEl.addEventListener('click', () => {
      const index = Number(slotEl.getAttribute('data-slot'));
      activeSlotIndex = index;
      teamDraft[index] ? openPokemonEditModal(index) : openPokemonPicker(index);
    });
  });
}

/* ============================================================
   POKÉMON ACTION MODAL (Edit Moves / Replace Pokémon / Remove)
   ============================================================ */
function openPokemonEditModal(index) {
  activeSlotIndex = index;
  const mon = DemoData.getPokemonById(teamDraft[index].pokemonId);
  document.getElementById('pokemon-action-title').textContent = mon.name;
  openModal('pokemon-action-modal');
}

function initPokemonActionButtons() {
  document.getElementById('action-edit-moves').addEventListener('click', () => {
    closeModal('pokemon-action-modal');
    editPokemonMoves(activeSlotIndex);
  });

  document.getElementById('action-replace-pokemon').addEventListener('click', () => {
    closeModal('pokemon-action-modal');
    replacePokemon(activeSlotIndex);
  });

  document.getElementById('action-remove-pokemon').addEventListener('click', () => {
    closeModal('pokemon-action-modal');
    promptRemovePokemon(activeSlotIndex);
  });
}

/** Edit Moves: only touches this slot's moveIds — the Pokémon itself never changes. */
function editPokemonMoves(index) {
  activeSlotIndex = index;
  openMovePicker(index);
}

/** Replace Pokémon: picking a new Pokémon for this slot, then its four moves. */
function replacePokemon(index) {
  activeSlotIndex = index;
  openPokemonPicker(index);
}

/* ---------- Remove, with confirmation ---------- */
function promptRemovePokemon(index) {
  activeSlotIndex = index;
  const mon = DemoData.getPokemonById(teamDraft[index].pokemonId);
  document.getElementById('confirm-remove-title').textContent = `Remove ${mon.name}?`;
  document.getElementById('confirm-remove-text').textContent =
    `Are you sure you want to remove ${mon.name} from your team?`;
  openModal('confirm-remove-modal');
}

function removePokemon(index) {
  teamDraft[index] = null;
  renderTeamSlots();
  renderValidation();
}

function initConfirmRemoveButton() {
  document.getElementById('confirm-remove-btn').addEventListener('click', () => {
    removePokemon(activeSlotIndex);
    closeModal('confirm-remove-modal');
  });
}

/* ============================================================
   POKÉMON PICKER (used for filling an empty slot AND for Replace)
   ============================================================ */
function pickerBlockReason(pokemonEntry) {
  const alreadyInTeam = teamDraft.some(
    (slot, i) => slot && slot.pokemonId === pokemonEntry.id && i !== activeSlotIndex
  );
  if (alreadyInTeam) return 'Already on your team';

  if (DemoData.isRestrictedCategory(pokemonEntry)) {
    const hasRestrictedAlready = teamDraft.some((slot, i) => {
      if (!slot || i === activeSlotIndex) return false;
      return DemoData.isRestrictedCategory(DemoData.getPokemonById(slot.pokemonId));
    });
    if (hasRestrictedAlready) return 'Team already has a Legendary/Mythical/Ultra Beast';
  }

  return null;
}

function renderPokemonPickerResults() {
  const query = document.getElementById('picker-search').value;
  const type = document.getElementById('picker-type-filter').value;
  const results = DemoData.filterPokemon(query, type);
  const grid = document.getElementById('picker-grid');

  if (results.length === 0) {
    grid.innerHTML = '<p class="picker-empty">No Pokémon match those filters.</p>';
    return;
  }

  grid.innerHTML = results
    .map((mon) => {
      const blockReason = pickerBlockReason(mon);
      return `
        <button class="picker-option" type="button" data-pokemon-id="${mon.id}" ${blockReason ? 'disabled' : ''}>
          <div class="mon-portrait">${pokemonPortraitHTML(mon, 56)}</div>
          <div class="mon-name">${mon.name}</div>
          <div>${typePillsHTML(mon.types)}</div>
          ${DemoData.isRestrictedCategory(mon) ? `<span class="category-badge">${mon.category}</span>` : ''}
          ${blockReason ? `<span class="block-reason">${blockReason}</span>` : ''}
        </button>
      `;
    })
    .join('');

  grid.querySelectorAll('.picker-option:not([disabled])').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pokemonId = Number(btn.getAttribute('data-pokemon-id'));
      selectPokemonForSlot(activeSlotIndex, pokemonId);
    });
  });
}

function openPokemonPicker(index) {
  activeSlotIndex = index;
  document.getElementById('picker-search').value = '';
  document.getElementById('picker-type-filter').value = '';
  renderPokemonPickerResults();
  openModal('pokemon-picker-modal');
}

/** Fills (or replaces) a slot with a new Pokémon and always moves on to move
 *  selection — a replacement Pokémon must get its own four moves configured. */
function selectPokemonForSlot(index, pokemonId) {
  teamDraft[index] = { pokemonId, moveIds: [] };
  closeModal('pokemon-picker-modal');
  renderTeamSlots();
  renderValidation();
  openMovePicker(index);
}

function initPokemonPickerFilters() {
  document.getElementById('picker-search').addEventListener('input', renderPokemonPickerResults);
  document.getElementById('picker-type-filter').addEventListener('change', renderPokemonPickerResults);

  const typeSelect = document.getElementById('picker-type-filter');
  typeSelect.innerHTML =
    '<option value="">All Types</option>' +
    DemoData.getAllTypes()
      .map((type) => `<option value="${type}">${type}</option>`)
      .join('');
}

/* ============================================================
   MOVE PICKER
   Used both for a fresh/replacement Pokémon and for Edit Moves —
   in every case it only ever writes to teamDraft[index].moveIds.
   ============================================================ */
async function renderMovePicker() {
  const slot = teamDraft[activeSlotIndex];
  const mon = DemoData.getPokemonById(slot.pokemonId);

  document.getElementById('move-picker-mon-portrait').innerHTML = pokemonPortraitHTML(mon, 48);
  document.getElementById('move-picker-mon-name').textContent = mon ? mon.name : `Pokémon #${slot.pokemonId}`;

  const slotsContainer = document.getElementById('move-slots');
  slotsContainer.innerHTML = Array.from({ length: MOVES_PER_POKEMON })
    .map((_, i) => {
      const moveId = slot.moveIds[i];
      if (!moveId) return `<div class="move-slot-chip is-empty">Move ${i + 1} — empty</div>`;
      const moveName = getMoveName(moveId, slot.pokemonId);
      return `
        <div class="move-slot-chip is-filled">
          ${moveName}
          <button type="button" data-remove-move="${moveId}" aria-label="Remove ${moveName}">✕</button>
        </div>
      `;
    })
    .join('');

  slotsContainer.querySelectorAll('[data-remove-move]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const moveId = Number(btn.getAttribute('data-remove-move'));
      slot.moveIds = slot.moveIds.filter((id) => Number(id) !== moveId);
      renderMovePicker();
    });
  });

  const pool = document.getElementById('move-pool');
  const atLimit = slot.moveIds.length >= MOVES_PER_POKEMON;

  // Ensure we have move options from backend
  try {
    await ensureApiLoaded();
    if (!moveOptionsCache[slot.pokemonId] || moveOptionsCache[slot.pokemonId].length < 10) {
      const resp = await window.Api.getMoveOptions(slot.pokemonId);
      if (resp && resp.data && Array.isArray(resp.data)) {
        const existing = moveOptionsCache[slot.pokemonId] || [];
        const newOptions = resp.data.map((m) => ({
          id: Number(m.id),
          display_name: m.display_name || m.move_name,
          move_type: m.move_type,
          category: m.category,
          base_power: m.base_power,
        }));
        const combined = [...existing];
        newOptions.forEach((opt) => {
          if (!combined.some((c) => c.id === opt.id)) {
            combined.push(opt);
          }
        });
        moveOptionsCache[slot.pokemonId] = combined;
      }
    }
  } catch (err) {
    if (err && err.name === 'ApiError' && (err.status === 401 || err.status === 403)) {
      window.location.href = 'index.html';
      return;
    }
    pool.innerHTML = `<div class="picker-empty">Unable to load move options: ${err?.message || 'Connection error'}</div>`;
    return;
  }

  const options = moveOptionsCache[slot.pokemonId] || [];

  pool.innerHTML = options
    .map((move) => {
      const alreadySelected = slot.moveIds.map(Number).includes(move.id);
      const disabled = alreadySelected || atLimit;
      return `
        <button class="move-option" type="button" data-move-id="${move.id}" ${disabled ? 'disabled' : ''}>
          <span class="move-name">${move.display_name}</span>
          <span class="move-meta">
            <span class="type-pill" data-type="${move.move_type}">${move.move_type}</span>
            <span>${move.category}</span>
            <span>PWR ${move.base_power}</span>
          </span>
        </button>
      `;
    })
    .join('');

  pool.querySelectorAll('.move-option:not([disabled])').forEach((btn) => {
    btn.addEventListener('click', () => {
      const moveId = Number(btn.getAttribute('data-move-id'));
      if (slot.moveIds.length < MOVES_PER_POKEMON) {
        slot.moveIds.push(moveId);
        renderMovePicker();
      }
    });
  });
}

function openMovePicker(index) {
  activeSlotIndex = index;
  renderMovePicker();
  openModal('move-picker-modal');
}

function initMovePickerDone() {
  document.getElementById('move-picker-done').addEventListener('click', () => {
    closeModal('move-picker-modal');
    renderTeamSlots();
    renderValidation();
  });
}

/* ============================================================
   VALIDATION
   ============================================================ */
function validateTeam(draft) {
  const errors = [];
  const filledSlots = draft.filter(Boolean);
  const missingCount = TEAM_SIZE - filledSlots.length;

  if (missingCount === TEAM_SIZE) {
    errors.push('Team must contain 6 Pokémon.');
  } else if (missingCount > 0) {
    errors.push(`Choose ${missingCount} more Pokémon.`);
  }

  const idCounts = {};
  filledSlots.forEach((slot) => {
    idCounts[slot.pokemonId] = (idCounts[slot.pokemonId] || 0) + 1;
  });
  const hasDuplicatePokemon = Object.values(idCounts).some((count) => count > 1);
  if (hasDuplicatePokemon) {
    errors.push('Duplicate Pokémon detected.');
  }

  const restrictedCount = filledSlots.filter((slot) =>
    DemoData.isRestrictedCategory(DemoData.getPokemonById(slot.pokemonId))
  ).length;
  if (restrictedCount > 1) {
    errors.push('Only one Legendary, Mythical, or Ultra Beast is allowed per team.');
  }

  filledSlots.forEach((slot) => {
    const mon = DemoData.getPokemonById(slot.pokemonId);
    const movesMissing = MOVES_PER_POKEMON - slot.moveIds.length;
    if (movesMissing > 0) {
      errors.push(`${mon.name} needs ${movesMissing} more move${movesMissing === 1 ? '' : 's'}.`);
    }
    const hasDuplicateMoves = slot.moveIds.length !== new Set(slot.moveIds.map(Number)).size;
    if (hasDuplicateMoves) {
      errors.push(`${mon.name} has a duplicate move selected.`);
    }
  });

  return { valid: errors.length === 0, errors };
}

function renderValidation() {
  const { valid, errors } = validateTeam(teamDraft);
  const panel = document.getElementById('validation-panel');
  const saveBtn = document.getElementById('save-team-btn');

  panel.classList.toggle('is-valid', valid);
  panel.classList.toggle('has-errors', !valid);
  saveBtn.disabled = !valid;

  if (valid) {
    panel.innerHTML = '<span class="v-title">Team Ready</span>All requirements met — this team can be saved.';
  } else {
    panel.innerHTML = `
      <span class="v-title">Fix Before Saving</span>
      <ul class="validation-list">${errors.map((e) => `<li>${e}</li>`).join('')}</ul>
    `;
  }
}

/* ============================================================
   SAVE
   ============================================================ */
async function saveTeam() {
  const { valid } = validateTeam(teamDraft);
  if (!valid) return;

  const feedbackEl = document.getElementById('save-feedback');
  feedbackEl.textContent = 'Saving team...';

  // Build payload expected by backend TeamCreate schema
  const payload = {
    slots: teamDraft.map((slot, idx) => ({
      slot: idx + 1,
      pokemon_id: Number(slot.pokemonId),
      move_ids: slot.moveIds.map((m) => Number(m)),
    })),
  };

  try {
    await ensureApiLoaded();
    let resp;
    if (currentSection === 'create-team') {
      resp = await window.Api.createTeam(payload);
      feedbackEl.textContent = 'Team created successfully!';
    } else if (currentSection === 'edit-team') {
      resp = await window.Api.updateTeam(payload);
      feedbackEl.textContent = 'Team updated successfully!';
    } else {
      feedbackEl.textContent = 'Unknown save context.';
      return;
    }

    // Populate teamDraft and cache from authoritative server response
    if (resp && resp.data && Array.isArray(resp.data.slots)) {
      const slots = resp.data.slots;
      const mapped = new Array(TEAM_SIZE).fill(null);
      slots.forEach((s) => {
        mapped[s.slot - 1] = { pokemonId: s.pokemon_id, moveIds: s.move_ids.map(Number) };
        if (s.moves && Array.isArray(s.moves)) {
          if (!moveOptionsCache[s.pokemon_id]) {
            moveOptionsCache[s.pokemon_id] = [];
          }
          s.moves.forEach((m) => {
            if (!moveOptionsCache[s.pokemon_id].some((existing) => existing.id === Number(m.id))) {
              moveOptionsCache[s.pokemon_id].push({
                id: Number(m.id),
                display_name: m.display_name || m.move_name,
                move_type: m.move_type,
                category: m.category,
                base_power: m.base_power,
              });
            }
          });
        }
      });
      teamDraft = mapped;
    }

    renderTeamSlots();
    renderValidation();

    // Re-render views so Create Team locks into "Team Already Exists"
    if (currentSection === 'create-team') {
      await renderCreateTeam();
    } else if (currentSection === 'edit-team') {
      await renderEditTeam();
    }

    // Refresh Overview dashboard so roster preview stays synchronized
    if (typeof loadTrainerDashboardData === 'function') {
      loadTrainerDashboardData();
    }
  } catch (err) {
    if (err && err.name === 'ApiError') {
      if (err.status === 401 || err.status === 403) {
        window.location.href = 'index.html';
        return;
      }
      const msg = err.body?.detail || err.message || 'Error saving team.';
      feedbackEl.textContent = 'Save failed: ' + msg;
      return;
    }

    feedbackEl.textContent = 'Save failed: ' + (err?.message || 'Connection error');
  }
}

function initTeamBuilder() {
  initPokemonPickerFilters();
  initPokemonActionButtons();
  initConfirmRemoveButton();
  initMovePickerDone();
  document.getElementById('save-team-btn').addEventListener('click', () => { saveTeam(); });
}

document.addEventListener('DOMContentLoaded', initTeamBuilder);
