/* ============================================================
   POKÉDEX
   Renders the full Pokémon list as a responsive table, supports
   combined name/ID + type filtering, and opens a detail modal with
   full stats. All data comes from DemoData.pokemon (js/data.js) so
   this file only ever deals with rendering and filtering.
   ============================================================ */

function renderDexRow(pokemonEntry) {
  const bst = DemoData.getBST(pokemonEntry);
  const battleHP = DemoData.getBattleHP(pokemonEntry);

  return `
    <tr>
      <td class="col-id" data-label="ID">#${String(pokemonEntry.id).padStart(3, '0')}</td>
      <td class="col-name">
        <span class="mon-portrait-sm">${pokemonPortraitHTML(pokemonEntry, 28)}</span>
        ${pokemonEntry.name}
      </td>
      <td data-label="Types">${typePillsHTML(pokemonEntry.types)}</td>
      <td class="col-stat" data-label="BST">${bst}</td>
      <td class="col-battle-hp" data-label="Battle HP">${battleHP}</td>
      <td data-label="View">
        <button class="view-btn" type="button" data-view-pokemon="${pokemonEntry.id}" aria-label="View ${pokemonEntry.name} details">👁</button>
      </td>
    </tr>
  `;
}

function renderDexTable() {
  const query = document.getElementById('dex-search').value;
  const type = document.getElementById('dex-type-filter').value;
  const results = DemoData.filterPokemon(query, type);

  const tbody = document.getElementById('dex-table-body');
  const count = document.getElementById('dex-count');

  count.textContent = `${results.length} of ${DemoData.pokemon.length} Pokémon`;

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
  typeSelect.innerHTML =
    '<option value="">All Types</option>' +
    DemoData.getAllTypes()
      .map((type) => `<option value="${type}">${type}</option>`)
      .join('');

  document.getElementById('dex-search').addEventListener('input', renderDexTable);
  typeSelect.addEventListener('change', renderDexTable);

  document.getElementById('dex-clear-filters').addEventListener('click', () => {
    document.getElementById('dex-search').value = '';
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

function openDexDetail(pokemonId) {
  const mon = DemoData.getPokemonById(pokemonId);
  if (!mon) return;

  document.getElementById('dex-detail-portrait').innerHTML = pokemonPortraitHTML(mon, 80);
  document.getElementById('dex-detail-id').textContent = `#${String(mon.id).padStart(3, '0')}`;
  document.getElementById('dex-detail-name').textContent = mon.name;
  document.getElementById('dex-detail-types').innerHTML = typePillsHTML(mon.types);
  document.getElementById('dex-detail-category').innerHTML = DemoData.isRestrictedCategory(mon)
    ? `<span class="category-badge">${mon.category}</span>`
    : '';

  const s = mon.stats;
  document.getElementById('dex-detail-stats').innerHTML = [
    dexStatCell('HP', s.hp),
    dexStatCell('Attack', s.atk),
    dexStatCell('Defense', s.def),
    dexStatCell('Sp. Attack', s.spa),
    dexStatCell('Sp. Defense', s.spd),
    dexStatCell('Speed', s.spe),
    dexStatCell('BST', DemoData.getBST(mon)),
    dexStatCell('Battle HP', DemoData.getBattleHP(mon), true),
  ].join('');

  openModal('pokemon-detail-modal');
}

document.addEventListener('DOMContentLoaded', () => {
  initDexFilters();
  renderDexTable();
});