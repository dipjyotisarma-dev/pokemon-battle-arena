/* ============================================================
   POKÉDEX
   Renders the full Pokémon list as a responsive table from the
   FastAPI backend (GET /pokemon), supports name/ID + type filtering,
   and opens a detail modal with full base stats and Battle HP.
   ============================================================ */

/** @type {any[]} */
let allPokemon = [];
const pokemonDetailCache = {};

function getPokemonTypes(p) {
  const types = [];
  if (p.type1) types.push(p.type1);
  if (p.type2) types.push(p.type2);
  return types;
}

function renderDexRow(pokemonEntry) {
  const bst = pokemonEntry.bst;
  const battleHP = pokemonEntry.hp * 5;
  const types = getPokemonTypes(pokemonEntry);
  const displayName = pokemonEntry.display_name || pokemonEntry.name;

  return `
    <tr>
      <td class="col-id" data-label="ID">#${String(pokemonEntry.id).padStart(3, '0')}</td>
      <td class="col-name">
        <span class="mon-portrait-sm">${pokemonPortraitHTML({ id: pokemonEntry.id, name: displayName }, 28)}</span>
        ${displayName}
      </td>
      <td data-label="Types">${typePillsHTML(types)}</td>
      <td class="col-stat" data-label="BST">${bst}</td>
      <td class="col-battle-hp" data-label="Battle HP">${battleHP}</td>
      <td data-label="View">
        <button class="view-btn" type="button" data-view-pokemon="${pokemonEntry.id}" aria-label="View ${displayName} details">👁</button>
      </td>
    </tr>
  `;
}

function filterPokemonList(pokemonList, query, type) {
  const q = (query || '').trim().toLowerCase();
  const t = (type || '').trim().toLowerCase();

  return pokemonList.filter((p) => {
    const nameMatch = !q ||
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.display_name && p.display_name.toLowerCase().includes(q)) ||
      String(p.id).includes(q);

    const types = getPokemonTypes(p).map((x) => x.toLowerCase());
    const typeMatch = !t || types.includes(t);

    return nameMatch && typeMatch;
  });
}

function renderDexTable() {
  const query = document.getElementById('dex-search')?.value || '';
  const type = document.getElementById('dex-type-filter')?.value || '';
  const results = filterPokemonList(allPokemon, query, type);

  const tbody = document.getElementById('dex-table-body');
  const count = document.getElementById('dex-count');

  if (count) {
    count.textContent = `${results.length} of ${allPokemon.length} Pokémon`;
  }

  if (!tbody) return;

  if (results.length === 0) {
    tbody.innerHTML = '<tr class="dex-empty-row"><td colspan="6">No Pokémon match those filters.</td></tr>';
    return;
  }

  tbody.innerHTML = results.map(renderDexRow).join('');

  tbody.querySelectorAll('[data-view-pokemon]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number(btn.getAttribute('data-view-pokemon'));
      openDexDetail(id);
    });
  });
}

/* ---------- Filters ---------- */
function initDexFilters() {
  const typeSelect = document.getElementById('dex-type-filter');
  if (!typeSelect) return;

  // Collect distinct types from loaded Pokémon
  const typeSet = new Set();
  allPokemon.forEach((p) => {
    getPokemonTypes(p).forEach((t) => typeSet.add(t));
  });

  const sortedTypes = Array.from(typeSet).sort();

  typeSelect.innerHTML =
    '<option value="">All Types</option>' +
    sortedTypes
      .map((type) => {
        const label = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
        return `<option value="${type}">${label}</option>`;
      })
      .join('');

  document.getElementById('dex-search')?.addEventListener('input', renderDexTable);
  typeSelect.addEventListener('change', renderDexTable);

  document.getElementById('dex-clear-filters')?.addEventListener('click', () => {
    const searchInput = document.getElementById('dex-search');
    if (searchInput) searchInput.value = '';
    typeSelect.value = '';
    renderDexTable();
  });
}

/* ---------- Detail modal ---------- */
function dexStatCell(label, value, highlight) {
  return `
    <div class="dex-stat-cell ${highlight ? 'highlight' : ''}">
      <span class="label">${label}</span>
      <span class="value">${value}</span>
    </div>
  `;
}

async function openDexDetail(pokemonId) {
  let mon = pokemonDetailCache[pokemonId] || allPokemon.find((p) => p.id === pokemonId);

  if (!mon || !mon.attack) {
    try {
      const resp = await window.Api.getPokemon(pokemonId);
      if (resp && resp.data) {
        mon = resp.data;
        pokemonDetailCache[pokemonId] = mon;
      }
    } catch (err) {
      // Fall back to existing mon if fetch fails
    }
  }

  if (!mon) return;

  const displayName = mon.display_name || mon.name;
  const types = getPokemonTypes(mon);
  const battleHP = mon.hp * 5;

  const portraitEl = document.getElementById('dex-detail-portrait');
  const idEl = document.getElementById('dex-detail-id');
  const nameEl = document.getElementById('dex-detail-name');
  const typesEl = document.getElementById('dex-detail-types');
  const categoryEl = document.getElementById('dex-detail-category');
  const statsEl = document.getElementById('dex-detail-stats');

  if (portraitEl) portraitEl.innerHTML = pokemonPortraitHTML({ id: mon.id, name: displayName }, 80);
  if (idEl) idEl.textContent = `#${String(mon.id).padStart(3, '0')}`;
  if (nameEl) nameEl.textContent = displayName;
  if (typesEl) typesEl.innerHTML = typePillsHTML(types);

  if (categoryEl) {
    const isSpecial = mon.pokemon_category && mon.pokemon_category.toLowerCase() !== 'standard';
    categoryEl.innerHTML = isSpecial
      ? `<span class="category-badge">${mon.pokemon_category.toUpperCase()}</span>`
      : '';
  }

  if (statsEl) {
    statsEl.innerHTML = [
      dexStatCell('HP', mon.hp),
      dexStatCell('Attack', mon.attack),
      dexStatCell('Defense', mon.defense),
      dexStatCell('Sp. Attack', mon.special_attack),
      dexStatCell('Sp. Defense', mon.special_defense),
      dexStatCell('Speed', mon.speed),
      dexStatCell('BST', mon.bst),
      dexStatCell('Battle HP', battleHP, true),
    ].join('');
  }

  openModal('pokemon-detail-modal');
}

async function loadPokedexData() {
  const tbody = document.getElementById('dex-table-body');
  if (tbody) {
    tbody.innerHTML = '<tr class="dex-empty-row"><td colspan="6">Loading Pokédex data...</td></tr>';
  }

  try {
    const resp = await window.Api.getAllPokemon();
    allPokemon = (resp && resp.data && Array.isArray(resp.data)) ? resp.data : [];

    // Pre-populate details cache
    allPokemon.forEach((p) => {
      pokemonDetailCache[p.id] = p;
    });

    initDexFilters();
    renderDexTable();
  } catch (err) {
    if (tbody) {
      tbody.innerHTML = '<tr class="dex-empty-row"><td colspan="6" style="color: var(--accent-danger, #ef4444);">Unable to load Pokédex. Please check your connection.</td></tr>';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadPokedexData();
});