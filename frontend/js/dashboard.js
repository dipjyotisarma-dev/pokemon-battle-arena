/* ============================================================
   DASHBOARD SHELL
   Handles the section-switching inside dashboard.html (Overview vs
   Create Team vs Edit Team). This is NOT a client-side router — it
   just toggles which <section> is visible on this one page, per the
   project's "Create/Edit Team are views inside dashboard.html"
   requirement.

   IMPORTANT: Create Team and Edit Team both render into the same
   underlying <section id="view-team"> element, so the active-state
   logic cannot key off which <section> is visible — two different
   nav buttons point at the same section. Instead every trigger
   carries a unique data-section value ("overview" / "create-team" /
   "edit-team"), and that exact value is what both drives which
   content renders AND which single sidebar link gets highlighted.
   ============================================================ */

const SECTION_TO_VIEW_ID = {
  overview: 'view-overview',
  'create-team': 'view-team',
  'edit-team': 'view-team',
};

let currentSection = 'overview';

function setActiveSection(sectionName) {
  currentSection = sectionName;
  const viewId = SECTION_TO_VIEW_ID[sectionName];

  document.querySelectorAll('.dash-view').forEach((view) => {
    view.hidden = view.id !== viewId;
  });

  // Exactly one sidebar link matches this exact section value, so
  // exactly one gets the active class — Create Team and Edit Team
  // can never both be active at once.
  document.querySelectorAll('.sidebar-link[data-section]').forEach((link) => {
    link.classList.toggle('is-active', link.getAttribute('data-section') === sectionName);
  });

  if (sectionName === 'create-team') renderCreateTeam();
  if (sectionName === 'edit-team') renderEditTeam();

  closeMobileSidebar();

  const main = document.getElementById('main');
  if (main) main.focus();
}

function initSidebarNav() {
  // Covers sidebar links AND any in-page trigger with the same
  // data-section attribute (e.g. the "Edit Team" button inside the
  // "Team Already Exists" notice, or "Create Team" inside the
  // "Nothing to Edit Yet" notice).
  document.querySelectorAll('[data-section]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      setActiveSection(trigger.getAttribute('data-section'));
    });
  });
}

/* ---------- Mobile sidebar ---------- */
function openMobileSidebar() {
  document.querySelector('.sidebar')?.classList.add('is-open');
  document.querySelector('.sidebar-scrim')?.classList.add('is-open');
}

function closeMobileSidebar() {
  document.querySelector('.sidebar')?.classList.remove('is-open');
  document.querySelector('.sidebar-scrim')?.classList.remove('is-open');
}

function initMobileSidebarToggle() {
  const toggle = document.querySelector('.mobile-nav-toggle');
  const scrim = document.querySelector('.sidebar-scrim');
  if (toggle) toggle.addEventListener('click', openMobileSidebar);
  if (scrim) scrim.addEventListener('click', closeMobileSidebar);
}

/* ---------- Logout ---------- */
function initLogout() {
  const logoutLink = document.getElementById('logout-link');
  if (!logoutLink) return;

  logoutLink.addEventListener('click', () => {
    logoutTrainer();
    window.location.href = 'index.html';
  });
}

/* ============================================================
   OVERVIEW RENDERING
   ============================================================ */

function renderTrainerChip(trainer) {
  const chip = document.getElementById('trainer-chip-name');
  if (chip) chip.innerHTML = `<strong>${trainer.username}</strong>`;
}

function renderStatRail(stats) {
  document.getElementById('stat-rank').textContent = `#${stats.rank}`;
  document.getElementById('stat-matches').textContent = stats.matches;
  document.getElementById('stat-wins').textContent = stats.wins;
  document.getElementById('stat-points').textContent = stats.points.toLocaleString();
}

function renderLastBattle(stats) {
  const container = document.getElementById('last-battle');
  if (!container) return;

  if (!stats.lastBattle) {
    container.innerHTML = `
      <div>
        <span class="label">Last Battle</span>
        <span class="data-readout" style="color: var(--text-faint);">No completed matches yet</span>
      </div>
    `;
    return;
  }

  const { result, points, matchNumber } = stats.lastBattle;
  const resultClass = result === 'Win' ? 'result-win' : 'result-loss';
  container.innerHTML = `
    <div>
      <span class="label">Last Battle</span>
      <span class="data-readout ${resultClass}">${result}</span>
      <span class="data-readout" style="color: var(--text-muted);"> · Match ${matchNumber}</span>
    </div>
    <div>
      <span class="label">Points Earned</span>
      <span class="data-readout" style="color: var(--accent-primary);">+${points}</span>
    </div>
  `;
}

function renderTeamState(trainerId) {
  const noTeamEl = document.getElementById('no-team-state');
  const hasTeamEl = document.getElementById('has-team-state');
  const roster = document.getElementById('roster-preview');

  const team = DemoData.getTeam(trainerId);
  const isComplete = team && team.slots.every((s) => s && s.pokemonId);

  if (!isComplete) {
    noTeamEl.hidden = false;
    hasTeamEl.hidden = true;
    return;
  }

  noTeamEl.hidden = true;
  hasTeamEl.hidden = false;

  roster.innerHTML = team.slots
    .map((slot) => {
      const mon = DemoData.getPokemonById(slot.pokemonId);
      return `
        <div class="roster-card">
          <div class="mon-portrait">${pokemonPortraitHTML(mon, 40)}</div>
          <div>
            <div class="mon-name">${mon.name}</div>
            <div>${typePillsHTML(mon.types)}</div>
          </div>
        </div>
      `;
    })
    .join('');
}

function renderOverview() {
  const trainer = AppSession.getActiveTrainer();
  if (!trainer) return;

  const stats = DemoData.getTrainerStats(trainer.id);

  renderTrainerChip(trainer);
  renderStatRail(stats);
  renderLastBattle(stats);
  renderTeamState(trainer.id);
}

document.addEventListener('DOMContentLoaded', () => {
  initSidebarNav();
  initMobileSidebarToggle();
  initLogout();
  renderOverview();
  setActiveSection('overview');
});