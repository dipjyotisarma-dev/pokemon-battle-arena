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
    const existing = document.querySelector(`script[src="${src}"]`);
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
  if (!window.Session) await _loadScript('/js/session.js');
  if (!window.Api) await _loadScript('/js/api.js');
}

// Helper to get display name for a move id, preferring DemoData (if present) then cached moveOptions
function getMoveName(moveId, pokemonId) {
  try {
    const idNum = Number(moveId);
    const demoMove = typeof DemoData !== 'undefined' ? DemoData.getMoveById(idNum) : null;
    if (demoMove) return demoMove.name;
    if (moveOptionsCache[pokemonId]) {
      const m = moveOptionsCache[pokemonId].find((mo) => mo.id === idNum);
      if (m) return m.display_name || m.move_name || String(idNum);
    }
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
  const trainer = AppSession.getActiveTrainer();
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
    // Api client throws ApiError for non-2xx responses
    if (err && err.name === 'ApiError' && err.status === 404) {
      // No team yet -> allow create
      existsNotice.hidden = true;
      builder.hidden = false;
      enterTeamBuilder(new Array(TEAM_SIZE).fill(null));
      return;
    }

    // Other errors (network / 401 / 500)
    existsNotice.hidden = false;
    builder.hidden = true;
    existsNotice.textContent = 'Unable to check existing team: ' + (err?.message || 'Connection error');
    return;
  }
}

/** Edit Team: the only place a saved team can be modified. Loads team from server using GET /team. */
async function renderEditTeam() {
  const trainer = AppSession.getActiveTrainer();
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
      // Map server team to teamDraft shape
      const slots = resp.data.slots;
      const mapped = new Array(TEAM_SIZE).fill(null);
      slots.forEach((slot) => {
        const idx = slot.slot - 1;
        mapped[idx] = { pokemonId: slot.pokemon_id, moveIds: slot.move_ids.map((id) => Number(id)) };
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

    // Other errors
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
  document.getElementById('move-picker-mon-name').textContent = mon.name;

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
    if (!moveOptionsCache[slot.pokemonId]) {
      const resp = await window.Api.getMoveOptions(slot.pokemonId);
      moveOptionsCache[slot.pokemonId] = resp.data.map((m) => ({ id: Number(m.id), display_name: m.display_name || m.move_name, move_type: m.move_type, category: m.category, base_power: m.base_power }));
    }
  } catch (err) {
    // Show connection error in the pool and disable adding moves
    pool.innerHTML = `<div class="picker-empty">Unable to load move options: ${err?.message || 'Connection error'}</div>`;
    return;
  }

  const options = moveOptionsCache[slot.pokemonId];

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

  const trainer = AppSession.getActiveTrainer();
  const feedbackEl = document.getElementById('save-feedback');

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
    if (currentSection === 'create-team') {
      const resp = await window.Api.createTeam(payload);
      feedbackEl.textContent = 'Team created on server.';
      // populate teamDraft with server response
      const slots = resp.data.slots || [];
      const mapped = new Array(TEAM_SIZE).fill(null);
      slots.forEach((s) => { mapped[s.slot - 1] = { pokemonId: s.pokemon_id, moveIds: s.move_ids.map(Number) }; });
      teamDraft = mapped;
    } else if (currentSection === 'edit-team') {
      const resp = await window.Api.updateTeam(payload);
      feedbackEl.textContent = 'Team updated on server.';
      const slots = resp.data.slots || [];
      const mapped = new Array(TEAM_SIZE).fill(null);
      slots.forEach((s) => { mapped[s.slot - 1] = { pokemonId: s.pokemon_id, moveIds: s.move_ids.map(Number) }; });
      teamDraft = mapped;
    } else {
      feedbackEl.textContent = 'Unknown save context.';
      return;
    }

    renderTeamSlots();
    renderValidation();

    // Re-render whichever of the two sections is active so Create Team
    // immediately locks into "Team Already Exists" once a team is saved.
    if (currentSection === 'create-team') renderCreateTeam();
    if (currentSection === 'edit-team') renderEditTeam();
  } catch (err) {
    // Surface backend validation messages where possible
    if (err && err.name === 'ApiError') {
      const body = err.body;
      const msg = body?.detail || err.message || 'Error saving team.';
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
