/* ============================================================
   TEAM BUILDER
   Powers both the Create Team and Edit Team sections inside
   dashboard.html. They share one underlying grid/picker UI, but are
   deliberately kept behaviorally separate:

     - renderCreateTeam(): only ever offers a BLANK builder. If a
       team is already saved, it shows a locked "Team Already
       Exists" notice instead — it never re-opens the saved team.
     - renderEditTeam(): the only place a saved team can be modified.
       If nothing is saved yet, it shows a "Nothing to Edit Yet"
       notice instead of a builder.

   All draft state lives in `teamDraft` until Save Team runs, at
   which point it's written into DemoData.teams[trainerId]. This
   mirrors the shape a future PUT /trainers/{id}/team request would
   send.
   ============================================================ */

const TEAM_SIZE = 6;
const MOVES_PER_POKEMON = 4;

/** @type {(null | {pokemonId:number, moveIds:string[]})[]} */
let teamDraft = new Array(TEAM_SIZE).fill(null);
let activeSlotIndex = null;

/* ============================================================
   ENTRY POINTS (called by setActiveSection in dashboard.js)
   ============================================================ */

/** Create Team: blank builder only. Locked once a team already exists. */
function renderCreateTeam() {
  const trainer = AppSession.getActiveTrainer();
  const existingTeam = DemoData.getTeam(trainer.id);

  const existsNotice = document.getElementById('team-exists-notice');
  const nothingNotice = document.getElementById('team-builder-empty-notice');
  const builder = document.getElementById('team-builder');

  nothingNotice.hidden = true;

  if (existingTeam) {
    existsNotice.hidden = false;
    builder.hidden = true;
    return;
  }

  existsNotice.hidden = true;
  builder.hidden = false;
  document.getElementById('team-builder-title').textContent = 'Create Team';

  enterTeamBuilder(new Array(TEAM_SIZE).fill(null));
}

/** Edit Team: the only place a saved team can be modified. */
function renderEditTeam() {
  const trainer = AppSession.getActiveTrainer();
  const existingTeam = DemoData.getTeam(trainer.id);

  const existsNotice = document.getElementById('team-exists-notice');
  const nothingNotice = document.getElementById('team-builder-empty-notice');
  const builder = document.getElementById('team-builder');

  existsNotice.hidden = true;

  if (!existingTeam) {
    nothingNotice.hidden = false;
    builder.hidden = true;
    return;
  }

  nothingNotice.hidden = true;
  builder.hidden = false;
  document.getElementById('team-builder-title').textContent = 'Edit Team';

  const clonedSlots = existingTeam.slots.map((slot) =>
    slot ? { ...slot, moveIds: [...slot.moveIds] } : null
  );
  enterTeamBuilder(clonedSlots);
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
          ? slot.moveIds.map((id) => DemoData.getMoveById(id).name).join(' · ')
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
function renderMovePicker() {
  const slot = teamDraft[activeSlotIndex];
  const mon = DemoData.getPokemonById(slot.pokemonId);

  document.getElementById('move-picker-mon-portrait').innerHTML = pokemonPortraitHTML(mon, 48);
  document.getElementById('move-picker-mon-name').textContent = mon.name;

  const slotsContainer = document.getElementById('move-slots');
  slotsContainer.innerHTML = Array.from({ length: MOVES_PER_POKEMON })
    .map((_, i) => {
      const moveId = slot.moveIds[i];
      if (!moveId) return `<div class="move-slot-chip is-empty">Move ${i + 1} — empty</div>`;
      const move = DemoData.getMoveById(moveId);
      return `
        <div class="move-slot-chip is-filled">
          ${move.name}
          <button type="button" data-remove-move="${moveId}" aria-label="Remove ${move.name}">✕</button>
        </div>
      `;
    })
    .join('');

  slotsContainer.querySelectorAll('[data-remove-move]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const moveId = btn.getAttribute('data-remove-move');
      slot.moveIds = slot.moveIds.filter((id) => id !== moveId);
      renderMovePicker();
    });
  });

  const pool = document.getElementById('move-pool');
  const atLimit = slot.moveIds.length >= MOVES_PER_POKEMON;

  pool.innerHTML = DemoData.moves
    .map((move) => {
      const alreadySelected = slot.moveIds.includes(move.id);
      const disabled = alreadySelected || atLimit;
      return `
        <button class="move-option" type="button" data-move-id="${move.id}" ${disabled ? 'disabled' : ''}>
          <span class="move-name">${move.name}</span>
          <span class="move-meta">
            <span class="type-pill" data-type="${move.type}">${move.type}</span>
            <span>${move.category}</span>
            <span>PWR ${move.power}</span>
          </span>
        </button>
      `;
    })
    .join('');

  pool.querySelectorAll('.move-option:not([disabled])').forEach((btn) => {
    btn.addEventListener('click', () => {
      const moveId = btn.getAttribute('data-move-id');
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
    const hasDuplicateMoves = slot.moveIds.length !== new Set(slot.moveIds).size;
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
function saveTeam() {
  const { valid } = validateTeam(teamDraft);
  if (!valid) return;

  const trainer = AppSession.getActiveTrainer();
  DemoData.teams[trainer.id] = { slots: teamDraft.map((slot) => ({ ...slot, moveIds: [...slot.moveIds] })) };

  document.getElementById('save-feedback').textContent = 'Team saved.';
  renderTeamState(trainer.id);

  // Re-render whichever of the two sections is active so Create Team
  // immediately locks into "Team Already Exists" once a team is saved.
  if (currentSection === 'create-team') renderCreateTeam();
  if (currentSection === 'edit-team') renderEditTeam();
}

function initTeamBuilder() {
  initPokemonPickerFilters();
  initPokemonActionButtons();
  initConfirmRemoveButton();
  initMovePickerDone();
  document.getElementById('save-team-btn').addEventListener('click', saveTeam);
}

document.addEventListener('DOMContentLoaded', initTeamBuilder);