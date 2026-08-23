/* ============================================================
   TEAM BUILDER — POKÉMON BATTLE ARENA (EMERGENT SYSTEM)
   - Integrated with FastAPI backend for Pokémon Catalog (GET /pokemon),
     Create (POST /team), Edit (PUT /team), Load (GET /team), and Move Options
   - 3x2 Desktop Roster Grid with reactive dynamic counter & validation
   - Category mapping: basic -> STANDARD, legendary -> LEGENDARY, mythical -> MYTHICAL, ultra_beast -> ULTRA BEAST
   - Preserves all authoritative backend data contracts and navigation flows
   ============================================================ */

const TEAM_SIZE = 6;
const MOVES_PER_POKEMON = 4;

/** @type {(null | {pokemonId:number, moveIds:number[]})[]} */
let teamDraft = new Array(TEAM_SIZE).fill(null);
let activeSlotIndex = null;

// In-memory Pokémon catalog loaded from backend GET /pokemon
/** @type {any[]} */
let pokemonCatalog = [];
/** @type {Record<number, any>} */
let pokemonCatalogById = {};
let pokemonCatalogLoaded = false;
let pokemonCatalogPromise = null;

// Cache move options per pokemon id (from GET /team/{pokemon_id}/move-options or GET /pokemon/{id}/moves)
const moveOptionsCache = {};
let currentSection = 'create-team';

/* ---------- Helper: Category Formatting & Badges ---------- */
function formatCategoryName(category) {
  if (!category) return 'Standard';
  const c = String(category).toLowerCase().trim();
  if (c === 'basic') return 'Standard';
  if (c === 'legendary') return 'Legendary';
  if (c === 'mythical') return 'Mythical';
  if (c === 'ultra_beast' || c === 'ultra-beast' || c === 'ultra beast') return 'Ultra Beast';
  return c.charAt(0).toUpperCase() + c.slice(1);
}

function categoryBadgeHTML(category) {
  if (!category) return '<span class="category-chip category-basic">STANDARD</span>';
  const c = String(category).toLowerCase().trim();
  if (c === 'basic' || c === 'standard') {
    return '<span class="category-chip category-basic">STANDARD</span>';
  }
  if (c === 'legendary') {
    return '<span class="category-chip category-legendary">LEGENDARY</span>';
  }
  if (c === 'mythical') {
    return '<span class="category-chip category-mythical">MYTHICAL</span>';
  }
  if (c === 'ultra_beast' || c === 'ultra-beast' || c === 'ultra beast') {
    return '<span class="category-chip category-ultra-beast">ULTRA BEAST</span>';
  }
  return `<span class="category-chip">${c.toUpperCase()}</span>`;
}

/* ---------- Helper: Type Formatting & Chips ---------- */
function formatTypeName(t) {
  if (!t) return '';
  const s = String(t).trim();
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function getPokemonTypes(p) {
  if (!p) return [];
  const raw = [];
  if (Array.isArray(p.types) && p.types.length > 0) {
    p.types.forEach((t) => raw.push(t));
  } else {
    if (p.type1) raw.push(p.type1);
    if (p.type2) raw.push(p.type2);
  }
  return raw.map(formatTypeName);
}

function typeChipsHTML(types) {
  if (!types || !Array.isArray(types)) return '';
  return types.map((t) => `<span class="type-chip">${formatTypeName(t)}</span>`).join('');
}

function pokemonPortraitHTML(pokemonEntry, size = 48) {
  const path = `assets/images/pokemon/${pokemonEntry.id}.png`;
  const displayName = pokemonEntry.display_name || pokemonEntry.name || 'Pokémon';
  const initials = displayName.slice(0, 2).toUpperCase();
  return `<img src="${path}" alt="${displayName}" width="${size}" height="${size}" onerror="this.replaceWith(Object.assign(document.createElement('span'), {textContent:'${initials}', style:'font-family:var(--font-mono);font-size:0.75rem;font-weight:700;color:var(--text-muted);'}))" />`;
}

function getPokemonDisplayName(p) {
  if (!p) return '';
  return p.display_name || p.name || '';
}

function isRestrictedCategory(pokemonEntry) {
  if (!pokemonEntry) return false;
  const cat = String(pokemonEntry.pokemon_category || pokemonEntry.category || '').toLowerCase().trim();
  return cat === 'legendary' || cat === 'mythical' || cat === 'ultra_beast' || cat === 'ultra-beast' || cat === 'ultra beast';
}

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

async function ensurePokemonCatalogLoaded() {
  if (pokemonCatalogLoaded && pokemonCatalog.length > 0) return pokemonCatalog;
  if (pokemonCatalogPromise) return pokemonCatalogPromise;

  pokemonCatalogPromise = (async () => {
    await ensureApiLoaded();
    const resp = await window.Api.getAllPokemon();
    if (resp && resp.data && Array.isArray(resp.data)) {
      pokemonCatalog = resp.data.map((p) => ({
        ...p,
        types: getPokemonTypes(p),
        name: getPokemonDisplayName(p),
      }));
      pokemonCatalogById = {};
      pokemonCatalog.forEach((p) => {
        pokemonCatalogById[p.id] = p;
      });
      pokemonCatalogLoaded = true;
      initPokemonPickerTypeOptions();
      return pokemonCatalog;
    }
    throw new Error('Failed to load Pokémon catalog from server.');
  })();

  try {
    const res = await pokemonCatalogPromise;
    return res;
  } finally {
    pokemonCatalogPromise = null;
  }
}

function getPokemonById(id) {
  const numId = Number(id);
  return pokemonCatalogById[numId] || null;
}

// Helper to get display name for a move id from cached moveOptions or slot metadata
function getMoveName(moveId, pokemonId) {
  try {
    const idNum = Number(moveId);
    if (moveOptionsCache[pokemonId]) {
      const m = moveOptionsCache[pokemonId].find((mo) => mo.id === idNum);
      if (m) return m.display_name || m.move_name || String(idNum);
    }
    return `Move #${moveId}`;
  } catch (e) {
    return String(moveId);
  }
}

/* ---------- Dynamic Roster Counter ---------- */
function updateRosterCounter() {
  const badge = document.getElementById('roster-count-badge');
  if (!badge) return;
  const filledCount = teamDraft.filter(Boolean).length;
  badge.textContent = `${filledCount} / ${TEAM_SIZE} POKÉMON`;
  badge.classList.toggle('is-complete', filledCount === TEAM_SIZE);
}

/* ============================================================
   ENTRY POINTS
   ============================================================ */
function enterTeamBuilder(initialDraft) {
  teamDraft = initialDraft;
  updateRosterCounter();
  renderTeamSlots();
  renderValidation();
  const feedback = document.getElementById('save-feedback');
  if (feedback) feedback.textContent = '';
  
  const saveBtn = document.getElementById('save-team-btn');
  if (saveBtn) {
    saveBtn.textContent = currentSection === 'create-team' ? 'Save team →' : 'Update team →';
  }
}

/* ============================================================
   SLOT GRID (3x2 Desktop Layout)
   ============================================================ */
function renderTeamSlots() {
  const grid = document.getElementById('team-slot-grid');
  if (!grid) return;

  grid.innerHTML = teamDraft
    .map((slot, index) => {
      const slotNumStr = String(index + 1).padStart(2, '0');

      if (!slot) {
        return `
          <button class="team-slot slot-empty" type="button" data-slot="${index}" data-testid="team-slot-${index + 1}" aria-label="Slot ${index + 1}: Empty. Click to add Pokémon">
            <span class="plus" aria-hidden="true">+</span>
            <span class="slot-empty-title">Add Pokémon</span>
            <span class="slot-empty-sub">Slot #${slotNumStr} · 4 Moves Required</span>
          </button>
        `;
      }

      const mon = getPokemonById(slot.pokemonId);
      const displayName = mon ? (mon.display_name || mon.name) : `Pokémon #${slot.pokemonId}`;
      const types = mon ? getPokemonTypes(mon) : [];
      const categoryBadge = categoryBadgeHTML(mon ? (mon.pokemon_category || mon.category) : 'basic');
      const moveCount = slot.moveIds.length;

      return `
        <button class="team-slot slot-filled" type="button" data-slot="${index}" data-testid="team-slot-${index + 1}" aria-label="Slot ${index + 1}: ${displayName}. Click to manage">
          <div class="slot-header">
            <span class="slot-index-badge">SLOT #${slotNumStr}</span>
            ${categoryBadge}
          </div>
          <div class="slot-top-row">
            <div class="slot-portrait">${pokemonPortraitHTML({ id: slot.pokemonId, name: displayName }, 52)}</div>
            <div>
              <div class="slot-name">${displayName}</div>
              <div class="type-chips-wrap">${typeChipsHTML(types)}</div>
            </div>
          </div>
          <div class="slot-moves-list">
            ${Array.from({ length: MOVES_PER_POKEMON })
              .map((_, mi) => {
                const mid = slot.moveIds[mi];
                if (!mid) return '<span class="slot-move-item is-empty">—</span>';
                return `<span class="slot-move-item">${getMoveName(mid, slot.pokemonId)}</span>`;
              })
              .join('')}
            ${moveCount < MOVES_PER_POKEMON ? `<div class="slot-move-warning">${moveCount}/4 moves selected</div>` : ''}
          </div>
        </button>
      `;
    })
    .join('');

  grid.querySelectorAll('.team-slot').forEach((slotEl) => {
    slotEl.addEventListener('click', () => {
      const index = Number(slotEl.getAttribute('data-slot'));
      activeSlotIndex = index;
      if (teamDraft[index]) {
        openPokemonEditModal(index);
      } else {
        openPokemonPicker(index);
      }
    });
  });

  updateRosterCounter();
}

/* ============================================================
   POKÉMON ACTION MODAL (Edit Moves / Replace Pokémon / Remove)
   ============================================================ */
function openPokemonEditModal(index) {
  activeSlotIndex = index;
  const slot = teamDraft[index];
  if (!slot) return;
  const mon = getPokemonById(slot.pokemonId);
  const displayName = mon ? (mon.display_name || mon.name) : `Pokémon #${slot.pokemonId}`;
  const types = mon ? getPokemonTypes(mon) : [];

  document.getElementById('pokemon-action-title').textContent = displayName;
  document.getElementById('action-modal-portrait').innerHTML = pokemonPortraitHTML({ id: slot.pokemonId, name: displayName }, 56);
  document.getElementById('action-modal-mon-name').textContent = displayName;
  document.getElementById('action-modal-types').innerHTML = typeChipsHTML(types);

  openModal('pokemon-action-modal');
}

function initPokemonActionButtons() {
  const editMovesBtn = document.getElementById('action-edit-moves');
  const replaceMonBtn = document.getElementById('action-replace-pokemon');
  const removeMonBtn = document.getElementById('action-remove-pokemon');

  if (editMovesBtn) {
    editMovesBtn.addEventListener('click', () => {
      closeModal('pokemon-action-modal');
      editPokemonMoves(activeSlotIndex);
    });
  }

  if (replaceMonBtn) {
    replaceMonBtn.addEventListener('click', () => {
      closeModal('pokemon-action-modal');
      replacePokemon(activeSlotIndex);
    });
  }

  if (removeMonBtn) {
    removeMonBtn.addEventListener('click', () => {
      closeModal('pokemon-action-modal');
      promptRemovePokemon(activeSlotIndex);
    });
  }
}

function editPokemonMoves(index) {
  activeSlotIndex = index;
  openMovePicker(index);
}

function replacePokemon(index) {
  activeSlotIndex = index;
  openPokemonPicker(index);
}

function promptRemovePokemon(index) {
  activeSlotIndex = index;
  const slot = teamDraft[index];
  if (!slot) return;
  const mon = getPokemonById(slot.pokemonId);
  const displayName = mon ? (mon.display_name || mon.name) : `Pokémon #${slot.pokemonId}`;
  document.getElementById('confirm-remove-title').textContent = `Remove ${displayName}?`;
  document.getElementById('confirm-remove-text').textContent =
    `Are you sure you want to remove ${displayName} from your team?`;
  openModal('confirm-remove-modal');
}

function removePokemon(index) {
  teamDraft[index] = null;
  renderTeamSlots();
  renderValidation();
  updateRosterCounter();
}

function initConfirmRemoveButton() {
  const btn = document.getElementById('confirm-remove-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      removePokemon(activeSlotIndex);
      closeModal('confirm-remove-modal');
    });
  }
}

/* ============================================================
   POKÉMON PICKER (Search, Type, Category Filters)
   ============================================================ */
function pickerBlockReason(pokemonEntry) {
  const alreadyInTeam = teamDraft.some(
    (slot, i) => slot && slot.pokemonId === pokemonEntry.id && i !== activeSlotIndex
  );
  if (alreadyInTeam) return 'Already on your team';

  if (isRestrictedCategory(pokemonEntry)) {
    const hasRestrictedAlready = teamDraft.some((slot, i) => {
      if (!slot || i === activeSlotIndex) return false;
      return isRestrictedCategory(getPokemonById(slot.pokemonId));
    });
    if (hasRestrictedAlready) return 'Team already has a Legendary/Mythical/Ultra Beast';
  }

  return null;
}

function filterPokemonCatalog(query, type, category) {
  const q = (query || '').trim().toLowerCase();
  const t = (type || '').trim().toLowerCase();
  const c = (category || '').trim().toLowerCase();

  return pokemonCatalog.filter((p) => {
    const nameStr = (p.display_name || p.name || '').toLowerCase();
    const idStr = String(p.id);
    const matchesName = !q || nameStr.includes(q) || idStr.includes(q);

    const types = getPokemonTypes(p).map((x) => x.toLowerCase());
    const matchesType = !t || types.includes(t);

    const pCat = String(p.pokemon_category || p.category || 'basic').toLowerCase().trim();
    const matchesCategory = !c || pCat === c;

    return matchesName && matchesType && matchesCategory;
  });
}

function renderPokemonPickerResults() {
  const query = document.getElementById('picker-search')?.value || '';
  const type = document.getElementById('picker-type-filter')?.value || '';
  const category = document.getElementById('picker-category-filter')?.value || '';
  const results = filterPokemonCatalog(query, type, category);
  const grid = document.getElementById('picker-grid');
  if (!grid) return;

  if (results.length === 0) {
    grid.innerHTML = '<p class="picker-empty" style="grid-column:1/-1; text-align:center; padding:32px; color:var(--text-muted); font-family:var(--font-mono); font-size:12px; text-transform:uppercase;">No Pokémon match those filters.</p>';
    return;
  }

  grid.innerHTML = results
    .map((mon) => {
      const blockReason = pickerBlockReason(mon);
      const displayName = mon.display_name || mon.name;
      const types = getPokemonTypes(mon);
      const catBadge = categoryBadgeHTML(mon.pokemon_category || mon.category);
      return `
        <button class="picker-option" type="button" data-pokemon-id="${mon.id}" ${blockReason ? 'disabled' : ''} aria-label="Select ${displayName}">
          <div class="mon-portrait">${pokemonPortraitHTML({ id: mon.id, name: displayName }, 56)}</div>
          <div class="mon-name">${displayName}</div>
          <div class="type-chips-wrap">${typeChipsHTML(types)}</div>
          ${catBadge}
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

async function openPokemonPicker(index) {
  activeSlotIndex = index;
  const searchInput = document.getElementById('picker-search');
  const typeFilter = document.getElementById('picker-type-filter');
  const catFilter = document.getElementById('picker-category-filter');
  if (searchInput) searchInput.value = '';
  if (typeFilter) typeFilter.value = '';
  if (catFilter) catFilter.value = '';

  const grid = document.getElementById('picker-grid');
  if (grid) grid.innerHTML = '<p class="picker-empty" style="grid-column:1/-1; text-align:center; padding:32px; color:var(--text-muted); font-family:var(--font-mono); font-size:12px; text-transform:uppercase;">Loading Pokémon roster…</p>';
  openModal('pokemon-picker-modal');

  try {
    await ensurePokemonCatalogLoaded();
    renderPokemonPickerResults();
  } catch (err) {
    if (grid) {
      grid.innerHTML = `<p class="picker-empty" style="grid-column:1/-1; text-align:center; padding:32px; color:var(--accent-danger, #ef4444); font-family:var(--font-mono); font-size:12px;">Unable to load Pokémon list: ${err?.message || 'Error'}</p>`;
    }
  }
}

function selectPokemonForSlot(index, pokemonId) {
  teamDraft[index] = { pokemonId, moveIds: [] };
  closeModal('pokemon-picker-modal');
  renderTeamSlots();
  renderValidation();
  updateRosterCounter();
  openMovePicker(index);
}

function initPokemonPickerTypeOptions() {
  const typeSelect = document.getElementById('picker-type-filter');
  if (!typeSelect) return;
  const currentVal = typeSelect.value;

  const typeSet = new Set();
  pokemonCatalog.forEach((p) => {
    getPokemonTypes(p).forEach((t) => typeSet.add(t));
  });
  const sortedTypes = Array.from(typeSet).sort();

  typeSelect.innerHTML =
    '<option value="">All Types</option>' +
    sortedTypes.map((type) => `<option value="${type}">${type}</option>`).join('');

  if (currentVal && sortedTypes.includes(currentVal)) {
    typeSelect.value = currentVal;
  }
}

function initPokemonPickerFilters() {
  document.getElementById('picker-search')?.addEventListener('input', renderPokemonPickerResults);
  document.getElementById('picker-type-filter')?.addEventListener('change', renderPokemonPickerResults);
  document.getElementById('picker-category-filter')?.addEventListener('change', renderPokemonPickerResults);
  initPokemonPickerTypeOptions();
}

/* ============================================================
   MOVE PICKER
   ============================================================ */
async function renderMovePicker() {
  const slot = teamDraft[activeSlotIndex];
  if (!slot) return;
  const mon = getPokemonById(slot.pokemonId);
  const displayName = mon ? (mon.display_name || mon.name) : `Pokémon #${slot.pokemonId}`;

  document.getElementById('move-picker-mon-portrait').innerHTML = pokemonPortraitHTML({ id: slot.pokemonId, name: displayName }, 48);
  document.getElementById('move-picker-mon-name').textContent = displayName;

  const slotsContainer = document.getElementById('move-slots');
  slotsContainer.innerHTML = Array.from({ length: MOVES_PER_POKEMON })
    .map((_, i) => {
      const moveId = slot.moveIds[i];
      if (!moveId) return `<div class="move-slot-chip is-empty">Move ${i + 1} — empty</div>`;
      const moveName = getMoveName(moveId, slot.pokemonId);
      return `
        <div class="move-slot-chip is-filled">
          <span>${moveName}</span>
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

  if (pool && (!moveOptionsCache[slot.pokemonId] || moveOptionsCache[slot.pokemonId].length < 10)) {
    pool.innerHTML = '<div class="picker-empty" style="grid-column:1/-1; text-align:center; padding:24px; color:var(--text-muted); font-family:var(--font-mono); font-size:11px;">Loading learnable moves…</div>';
  }

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
    pool.innerHTML = `<div class="picker-empty" style="grid-column:1/-1; text-align:center; padding:24px; color:var(--accent-danger, #ef4444); font-family:var(--font-mono); font-size:11px;">Unable to load move options: ${err?.message || 'Connection error'}</div>`;
    return;
  }

  const options = moveOptionsCache[slot.pokemonId] || [];

  pool.innerHTML = options
    .map((move) => {
      const alreadySelected = slot.moveIds.map(Number).includes(move.id);
      const disabled = alreadySelected || atLimit;
      const powerDisplay = move.base_power ? `PWR ${move.base_power}` : 'STATUS';
      return `
        <button class="move-option" type="button" data-move-id="${move.id}" ${disabled ? 'disabled' : ''} aria-label="Select ${move.display_name}">
          <span class="move-name">${move.display_name}</span>
          <span class="move-meta">
            <span class="type-chip">${formatTypeName(move.move_type)}</span>
            <span>${move.category}</span>
            <span>${powerDisplay}</span>
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
  document.getElementById('move-picker-done')?.addEventListener('click', () => {
    closeModal('move-picker-modal');
    renderTeamSlots();
    renderValidation();
  });
}

/* ============================================================
   VALIDATION (Dynamic Feedback based on active draft)
   ============================================================ */
function validateTeam(draft) {
  const errors = [];
  const filledSlots = draft.filter(Boolean);
  const missingCount = TEAM_SIZE - filledSlots.length;

  if (missingCount === TEAM_SIZE) {
    errors.push('Choose 6 Pokémon for your roster.');
  } else if (missingCount > 0) {
    errors.push(`Choose ${missingCount} more Pokémon to complete the 6-Pokémon requirement.`);
  }

  const idCounts = {};
  filledSlots.forEach((slot) => {
    idCounts[slot.pokemonId] = (idCounts[slot.pokemonId] || 0) + 1;
  });
  const hasDuplicatePokemon = Object.values(idCounts).some((count) => count > 1);
  if (hasDuplicatePokemon) {
    errors.push('Each Pokémon on your team must be unique (no duplicate species).');
  }

  const restrictedCount = filledSlots.filter((slot) =>
    isRestrictedCategory(getPokemonById(slot.pokemonId))
  ).length;
  if (restrictedCount > 1) {
    errors.push('Maximum 1 Legendary, Mythical, or Ultra Beast allowed per team.');
  }

  filledSlots.forEach((slot, idx) => {
    const mon = getPokemonById(slot.pokemonId);
    const displayName = mon ? (mon.display_name || mon.name) : `Slot #${idx + 1}`;
    const movesMissing = MOVES_PER_POKEMON - slot.moveIds.length;
    if (movesMissing > 0) {
      errors.push(`${displayName} (Slot #${idx + 1}) needs ${movesMissing} more move${movesMissing === 1 ? '' : 's'}.`);
    }
    const hasDuplicateMoves = slot.moveIds.length !== new Set(slot.moveIds.map(Number)).size;
    if (hasDuplicateMoves) {
      errors.push(`${displayName} has duplicate moves selected.`);
    }
  });

  return { valid: errors.length === 0, errors };
}

function renderValidation() {
  const { valid, errors } = validateTeam(teamDraft);
  const panel = document.getElementById('validation-panel');
  const saveBtn = document.getElementById('save-team-btn');
  if (!panel) return;

  panel.classList.toggle('is-valid', valid);
  panel.classList.toggle('has-errors', !valid);
  if (saveBtn) saveBtn.disabled = !valid;

  if (valid) {
    panel.innerHTML = `
      <span class="v-title">Team Ready</span>
      <div class="validation-success-text">All requirements met — 6 unique Pokémon with 4 valid moves each. Ready for battle.</div>
    `;
  } else {
    panel.innerHTML = `
      <span class="v-title">Team Requirements</span>
      <ul class="validation-list">${errors.map((e) => `<li>${e}</li>`).join('')}</ul>
    `;
  }
}

/* ============================================================
   SAVE & UPDATE TEAM
   ============================================================ */
async function saveTeam() {
  const { valid } = validateTeam(teamDraft);
  if (!valid) return;

  const feedbackEl = document.getElementById('save-feedback');
  const saveBtn = document.getElementById('save-team-btn');
  if (feedbackEl) feedbackEl.textContent = 'Saving team to arena database…';
  if (saveBtn) saveBtn.disabled = true;

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
      if (feedbackEl) feedbackEl.textContent = 'Team created successfully! Returning to Dashboard…';
    } else {
      resp = await window.Api.updateTeam(payload);
      if (feedbackEl) feedbackEl.textContent = 'Team updated successfully! Returning to Dashboard…';
    }

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

    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 650);
  } catch (err) {
    if (saveBtn) saveBtn.disabled = false;
    if (err && err.name === 'ApiError') {
      if (err.status === 401 || err.status === 403) {
        window.location.href = 'index.html';
        return;
      }
      const msg = err.body?.detail || err.message || 'Error saving team.';
      if (feedbackEl) feedbackEl.textContent = 'Save failed: ' + msg;
      return;
    }

    if (feedbackEl) feedbackEl.textContent = 'Save failed: ' + (err?.message || 'Connection error');
  }
}

/* ============================================================
   INITIALIZATION
   ============================================================ */
async function initTeamBuilder() {
  initPokemonPickerFilters();
  initPokemonActionButtons();
  initConfirmRemoveButton();
  initMovePickerDone();

  const saveBtn = document.getElementById('save-team-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => { saveTeam(); });
  }

  // Load team or initialize blank
  try {
    await ensureApiLoaded();
    await ensurePokemonCatalogLoaded();
    const resp = await window.Api.getTeam();
    if (resp && resp.data && Array.isArray(resp.data.slots) && resp.data.slots.length > 0) {
      currentSection = 'edit-team';
      const existsNotice = document.getElementById('team-exists-notice');
      if (existsNotice) existsNotice.hidden = false;
      const titleEl = document.getElementById('team-builder-title');
      if (titleEl) titleEl.innerHTML = 'Edit <em>Team</em>';

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
    } else {
      currentSection = 'create-team';
      const emptyNotice = document.getElementById('team-builder-empty-notice');
      if (emptyNotice) emptyNotice.hidden = false;
      const titleEl = document.getElementById('team-builder-title');
      if (titleEl) titleEl.innerHTML = 'Create <em>Team</em>';
      enterTeamBuilder(new Array(TEAM_SIZE).fill(null));
    }
  } catch (err) {
    if (err && err.name === 'ApiError' && err.status === 404) {
      currentSection = 'create-team';
      const emptyNotice = document.getElementById('team-builder-empty-notice');
      if (emptyNotice) emptyNotice.hidden = false;
      const titleEl = document.getElementById('team-builder-title');
      if (titleEl) titleEl.innerHTML = 'Create <em>Team</em>';
      enterTeamBuilder(new Array(TEAM_SIZE).fill(null));
      return;
    }
    if (err && err.name === 'ApiError' && (err.status === 401 || err.status === 403)) {
      window.location.href = 'index.html';
      return;
    }
    console.error('Error loading team:', err);
    currentSection = 'create-team';
    enterTeamBuilder(new Array(TEAM_SIZE).fill(null));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTeamBuilder);
} else {
  initTeamBuilder();
}
