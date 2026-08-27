/* ============================================================
   POKÉDEX — POKÉMON BATTLE ARENA (EMERGENT SYSTEM)
   - Fetches 441 Pokémon list from FastAPI backend (GET /pokemon)
   - Real-time client-side search, type filtering, category filtering, and multi-field sorting
   - Detail modal with base stats, Battle HP, and learnable moves (GET /pokemon/{id}/moves)
   - Context-aware back navigation (?from=home vs ?from=dashboard)
   ============================================================ */

/** @type {any[]} */
let allPokemon = [];
const pokemonDetailCache = {};
const moveOptionsCache = {};

function registerCurrentPage() {
  if (window.NavigationSession) {
    NavigationSession.setCurrentPage('pokedex.html');
  }
}

/* ---------- Helper: Category Formatting ---------- */
function formatCategoryName(category) {
  if (!category) return 'Standard';
  const c = String(category).toLowerCase();
  if (c === 'basic') return 'Standard';
  if (c === 'legendary') return 'Legendary';
  if (c === 'mythical') return 'Mythical';
  if (c === 'ultra_beast' || c === 'ultra-beast') return 'Ultra Beast';
  return c.charAt(0).toUpperCase() + c.slice(1);
}

function categoryBadgeHTML(category) {
  if (!category) return '<span class="category-chip category-basic">STANDARD</span>';
  const c = String(category).toLowerCase();
  if (c === 'basic' || c === 'standard') {
    return '<span class="category-chip category-basic">STANDARD</span>';
  }
  if (c === 'legendary') {
    return '<span class="category-chip category-legendary">LEGENDARY</span>';
  }
  if (c === 'mythical') {
    return '<span class="category-chip category-mythical">MYTHICAL</span>';
  }
  if (c === 'ultra_beast' || c === 'ultra-beast') {
    return '<span class="category-chip category-ultra-beast">ULTRA BEAST</span>';
  }
  return `<span class="category-chip">${c.toUpperCase()}</span>`;
}

/* ---------- Helper: Type Formatting ---------- */
function formatTypeName(t) {
  if (!t) return '';
  const s = String(t).trim();
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function getPokemonTypes(p) {
  const types = [];
  if (p.type1) types.push(formatTypeName(p.type1));
  if (p.type2) types.push(formatTypeName(p.type2));
  return types;
}

function typeChipsHTML(types) {
  if (!types || !Array.isArray(types) || types.length === 0) return '';
  return `<div class="type-chips-wrap">${types
    .map((t) => `<span class="type-chip">${formatTypeName(t)}</span>`)
    .join('')}</div>`;
}

/* ---------- Helper: Portrait HTML ---------- */
function pokemonPortraitHTML(pokemonEntry, size = 36) {
  const path = `assets/images/pokemon/${pokemonEntry.id}.png`;
  const displayName = pokemonEntry.display_name || pokemonEntry.name || 'Pokémon';
  const initials = displayName.slice(0, 2).toUpperCase();
  return `<img src="${path}" alt="${displayName}" width="${size}" height="${size}" onerror="this.replaceWith(Object.assign(document.createElement('span'), {textContent:'${initials}', style:'font-family:var(--font-mono);font-size:0.75rem;font-weight:700;color:var(--text-muted);'}))" />`;
}

/* ---------- Helper: Battle HP Calculation ---------- */
function calculateBattleHP(hp, bst) {
  return (3 * Number(hp || 0)) + Math.floor(Number(bst || 0) / 2);
}

/* ---------- Table Row Rendering ---------- */
function renderDexRow(pokemonEntry) {
  const displayName = pokemonEntry.display_name || pokemonEntry.name;
  const types = getPokemonTypes(pokemonEntry);
  const bst = Number(pokemonEntry.bst || 0);
  const battleHp = calculateBattleHP(pokemonEntry.hp, bst);
  const categoryBadge = categoryBadgeHTML(pokemonEntry.pokemon_category);

  return `
    <tr data-pokemon-id="${pokemonEntry.id}" data-testid="pokedex-row-${pokemonEntry.id}">
      <td class="col-id" data-label="Official ID">#${String(pokemonEntry.id).padStart(3, '0')}</td>
      <td class="col-pokemon" data-label="Pokémon">
        <div class="mon-cell">
          <div class="mon-thumb">${pokemonPortraitHTML(pokemonEntry, 36)}</div>
          <span class="mon-name">${displayName}</span>
        </div>
      </td>
      <td data-label="Types">${typeChipsHTML(types)}</td>
      <td data-label="Category">${categoryBadge}</td>
      <td class="stat-metric" style="text-align: right;" data-label="BST">${bst}</td>
      <td class="battle-hp-metric" style="text-align: right;" data-label="Battle HP">${battleHp}</td>
      <td style="text-align: right;" data-label="Action">
        <button class="view-button" type="button" data-view-pokemon="${pokemonEntry.id}" data-testid="pokedex-view-${pokemonEntry.id}" aria-label="View ${displayName} details">
          VIEW <span>↗</span>
        </button>
      </td>
    </tr>
  `;
}

/* ---------- Filtering & Sorting Engine ---------- */
function filterAndSortPokemon(list, { query, type, category, sort }) {
  const q = (query || '').trim().toLowerCase();
  const t = (type || '').trim().toLowerCase();
  const c = (category || '').trim().toLowerCase();

  // 1. Filter
  const filtered = list.filter((p) => {
    const nameMatch =
      !q ||
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.display_name && p.display_name.toLowerCase().includes(q)) ||
      String(p.id).includes(q);

    const types = getPokemonTypes(p).map((x) => x.toLowerCase());
    const typeMatch = !t || types.includes(t);

    const pCat = String(p.pokemon_category || 'basic').toLowerCase();
    const categoryMatch = !c || pCat === c;

    return nameMatch && typeMatch && categoryMatch;
  });

  // 2. Sort
  const sorted = [...filtered];
  sorted.sort((a, b) => {
    switch (sort) {
      case 'id_desc':
        return b.id - a.id;
      case 'name_asc': {
        const nameA = a.display_name || a.name || '';
        const nameB = b.display_name || b.name || '';
        return nameA.localeCompare(nameB);
      }
      case 'bst_desc':
        return (b.bst - a.bst) || (a.id - b.id);
      case 'battle_hp_desc': {
        const hpA = calculateBattleHP(a.hp, a.bst);
        const hpB = calculateBattleHP(b.hp, b.bst);
        return (hpB - hpA) || (a.id - b.id);
      }
      case 'speed_desc':
        return (b.speed - a.speed) || (a.id - b.id);
      case 'attack_desc':
        return (b.attack - a.attack) || (a.id - b.id);
      case 'id_asc':
      default:
        return a.id - b.id;
    }
  });

  return sorted;
}

function renderDexTable() {
  const query = document.getElementById('dex-search')?.value || '';
  const type = document.getElementById('dex-type')?.value || '';
  const category = document.getElementById('dex-category')?.value || '';
  const sort = document.getElementById('dex-sort')?.value || 'id_asc';

  const results = filterAndSortPokemon(allPokemon, { query, type, category, sort });

  const tbody = document.getElementById('dex-body');
  const countEl = document.getElementById('dex-count');

  if (countEl) {
    countEl.textContent = `Showing ${results.length} of ${allPokemon.length} Pokémon`;
  }

  if (!tbody) return;

  if (results.length === 0) {
    tbody.innerHTML = `
      <tr class="dex-status-row">
        <td colspan="7">No Pokémon match the current filters.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = results.map(renderDexRow).join('');

  // Attach click handler exclusively to VIEW ↗ button (no whole-row click)
  tbody.querySelectorAll('[data-view-pokemon]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = Number(btn.getAttribute('data-view-pokemon'));
      openDexDetail(id);
    });
  });
}

/* ---------- Initialize Filter Dropdowns & Listeners ---------- */
function initDexFilters() {
  const typeSelect = document.getElementById('dex-type');
  const categorySelect = document.getElementById('dex-category');
  const sortSelect = document.getElementById('dex-sort');
  const searchInput = document.getElementById('dex-search');
  const resetBtn = document.getElementById('dex-reset');

  if (typeSelect) {
    const typeSet = new Set();
    allPokemon.forEach((p) => {
      getPokemonTypes(p).forEach((t) => typeSet.add(t));
    });

    const sortedTypes = Array.from(typeSet).sort();
    typeSelect.innerHTML =
      '<option value="">All Types</option>' +
      sortedTypes
        .map((t) => `<option value="${t.toLowerCase()}">${t}</option>`)
        .join('');
  }

  if (searchInput) searchInput.addEventListener('input', renderDexTable);
  if (typeSelect) typeSelect.addEventListener('change', renderDexTable);
  if (categorySelect) categorySelect.addEventListener('change', renderDexTable);
  if (sortSelect) sortSelect.addEventListener('change', renderDexTable);

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (typeSelect) typeSelect.value = '';
      if (categorySelect) categorySelect.value = '';
      if (sortSelect) sortSelect.value = 'id_asc';
      renderDexTable();
    });
  }
}

/* ---------- Detail Modal & Moves Arsenal ---------- */
async function openDexDetail(pokemonId) {
  let mon = pokemonDetailCache[pokemonId] || allPokemon.find((p) => p.id === pokemonId);

  if (!mon || typeof mon.attack === 'undefined') {
    try {
      const resp = await window.Api.getPokemon(pokemonId);
      if (resp && resp.data) {
        mon = resp.data;
        pokemonDetailCache[pokemonId] = mon;
      }
    } catch (err) {
      // Keep existing mon fallback
    }
  }

  if (!mon) return;

  const displayName = mon.display_name || mon.name;
  const types = getPokemonTypes(mon);
  const bst = Number(mon.bst || 0);
  const battleHp = calculateBattleHP(mon.hp, bst);
  const categoryBadge = categoryBadgeHTML(mon.pokemon_category, true);

  const container = document.getElementById('pokemon-detail');
  const eyebrowEl = document.getElementById('dex-detail-eyebrow');
  if (eyebrowEl) {
    eyebrowEl.textContent = `#${String(mon.id).padStart(3, '0')} / FIELD RECORD`;
  }

  if (container) {
    container.innerHTML = `
      <div class="pokemon-detail">
        <div class="pokemon-detail-art">
          ${pokemonPortraitHTML(mon, 140)}
        </div>
        <div class="pokemon-detail-meta">
          <p class="eyebrow" style="margin-bottom: 4px;">#${String(mon.id).padStart(3, '0')} / DATA MATRIX</p>
          <h2 id="dex-detail-name">${displayName}</h2>
          <div class="types-and-category">
            ${typeChipsHTML(types)}
            ${categoryBadge}
          </div>
          <div class="detail-stats">
            <span>HP <b>${mon.hp ?? 0}</b></span>
            <span>Attack <b>${mon.attack ?? 0}</b></span>
            <span>Defense <b>${mon.defense ?? 0}</b></span>
            <span>Sp. Atk <b>${mon.special_attack ?? 0}</b></span>
            <span>Sp. Def <b>${mon.special_defense ?? 0}</b></span>
            <span>Speed <b>${mon.speed ?? 0}</b></span>
            <span class="highlight">BST <b>${bst}</b></span>
            <span class="highlight">Battle HP <b>${battleHp}</b></span>
          </div>
        </div>
      </div>

      <div class="moves-section">
        <div class="moves-header">
          <p class="eyebrow">LEARNABLE MOVES ARSENAL</p>
          <span class="pokedex-count" id="dex-moves-count">Loading moves…</span>
        </div>
        <div class="moves-table-wrap" id="dex-moves-container">
          <div style="padding: 24px; text-align: center; font-family: var(--font-mono); font-size: 11px; color: var(--text-muted);">
            Loading learnable moves from database…
          </div>
        </div>
      </div>
    `;
  }

  openModal('pokemon-detail-modal');

  // Fetch learnable moves from backend
  await loadPokemonMoves(pokemonId);
}

async function loadPokemonMoves(pokemonId) {
  const container = document.getElementById('dex-moves-container');
  const countEl = document.getElementById('dex-moves-count');
  if (!container) return;

  try {
    let moves = moveOptionsCache[pokemonId];

    if (!moves) {
      const resp = await window.Api.getPokemonMoves(pokemonId);
      moves = (resp && resp.data && Array.isArray(resp.data)) ? resp.data : [];
      moveOptionsCache[pokemonId] = moves;
    }

    if (countEl) {
      countEl.textContent = `${moves.length} MOVES`;
    }

    if (moves.length === 0) {
      container.innerHTML = `
        <div style="padding: 24px; text-align: center; font-family: var(--font-mono); font-size: 11px; color: var(--text-muted);">
          No moves recorded for this Pokémon.
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <table class="moves-table">
        <thead>
          <tr>
            <th scope="col">Move Name</th>
            <th scope="col">Type</th>
            <th scope="col">Category</th>
            <th scope="col" style="text-align: right;">Power</th>
          </tr>
        </thead>
        <tbody>
          ${moves
            .map((m) => {
              const moveName = m.display_name || m.move_name;
              const moveType = formatTypeName(m.move_type);
              const category = formatTypeName(m.category);
              const power = Number(m.base_power || 0);
              const powerHTML = power > 0
                ? `<span class="move-power-cell">${power}</span>`
                : `<span class="move-power-zero">—</span>`;

              return `
                <tr>
                  <td class="move-name-cell">${moveName}</td>
                  <td><span class="type-chip">${moveType}</span></td>
                  <td class="move-category-cell">${category}</td>
                  <td style="text-align: right;">${powerHTML}</td>
                </tr>
              `;
            })
            .join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    if (countEl) countEl.textContent = 'ERROR';
    container.innerHTML = `
      <div style="padding: 24px; text-align: center; font-family: var(--font-mono); font-size: 11px; color: var(--accent-danger, #ef4444);">
        Failed to load move arsenal for this Pokémon.
      </div>
    `;
  }
}

/* ---------- Load Initial Pokédex Data ---------- */
async function loadPokedexData() {
  const tbody = document.getElementById('dex-body');
  const countEl = document.getElementById('dex-count');
  const datasetTag = document.getElementById('dex-dataset-tag');

  if (tbody) {
    tbody.innerHTML = `
      <tr class="dex-status-row">
        <td colspan="7">Loading Pokédex roster from database…</td>
      </tr>
    `;
  }

  try {
    let rawData = window._pokemonCatalogRaw;
    if (!rawData) {
      const resp = await window.Api.getAllPokemon();
      rawData = (resp && resp.data && Array.isArray(resp.data)) ? resp.data : [];
      window._pokemonCatalogRaw = rawData;
    }
    allPokemon = rawData;

    allPokemon.forEach((p) => {
      pokemonDetailCache[p.id] = p;
    });

    if (datasetTag) {
      datasetTag.textContent = `${allPokemon.length} POKÉMON`;
    }

    initDexFilters();
    renderDexTable();
  } catch (err) {
    if (tbody) {
      tbody.innerHTML = `
        <tr class="dex-status-row">
          <td colspan="7" style="color: var(--accent-danger, #ef4444);">
            Unable to load Pokédex. Please verify the backend service is running.
          </td>
        </tr>
      `;
    }
    if (countEl) countEl.textContent = 'Error loading dataset';
  }
}

/* ---------- Context-Aware Navigation ---------- */
function initContextAwareNavigation() {
  const params = new URLSearchParams(window.location.search);
  const context = params.get('from') === 'dashboard' ? 'dashboard' : 'home';
  const backLink = document.getElementById('nav-back-link');
  const brandLink = document.getElementById('brand-link');

  if (context === 'dashboard') {
    if (backLink) {
      backLink.textContent = '← Back to Dashboard';
      backLink.href = 'dashboard.html';
    }
    if (brandLink) {
      brandLink.href = 'dashboard.html';
    }
  } else {
    // Default fallback to Home
    if (backLink) {
      backLink.textContent = '← Back to Home';
      backLink.href = 'index.html';
    }
    if (brandLink) {
      brandLink.href = 'index.html';
    }
  }

  // Propagate origin context to header navigation links
  const navLeaderboard = document.querySelector('[data-testid="nav-leaderboard"]') || document.querySelector('header a[href*="leaderboard"]');
  if (navLeaderboard) {
    navLeaderboard.href = `leaderboard.html?from=${context}`;
  }
  const navPokedex = document.querySelector('[data-testid="nav-pokedex"]') || document.querySelector('header a[href*="pokedex"]');
  if (navPokedex) {
    navPokedex.href = `pokedex.html?from=${context}`;
  }

  // Propagate origin context to footer navigation links
  const footerLeaderboard = document.querySelector('.footer-links a[href*="leaderboard"]');
  if (footerLeaderboard) {
    footerLeaderboard.href = `leaderboard.html?from=${context}`;
  }
  const footerPokedex = document.querySelector('.footer-links a[href*="pokedex"]');
  if (footerPokedex) {
    footerPokedex.href = `pokedex.html?from=${context}`;
  }
}

// Immediate execution for instant link resolution
initContextAwareNavigation();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    registerCurrentPage();
    initContextAwareNavigation();
    loadPokedexData();
  });
} else {
  registerCurrentPage();
  initContextAwareNavigation();
  loadPokedexData();
}