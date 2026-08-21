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
  const previousSection = currentSection;
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

  // When switching to the Overview section, load live dashboard data
  // but avoid duplicate loads if we are already on the overview.
  if (sectionName === 'overview' && previousSection !== 'overview') {
    // loadTrainerDashboardData gracefully handles auth/errors
    if (typeof loadTrainerDashboardData === 'function') loadTrainerDashboardData();
  }

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

// Ensure Api and Session are available when needed
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

function renderTrainerChip(trainer) {
  const chip = document.getElementById('trainer-chip-name');
  const name = typeof trainer === 'string' ? trainer : (trainer && trainer.username) ? trainer.username : '';
  if (chip) chip.innerHTML = `<strong>${name}</strong>`;
}

function renderStatRail(stats) {
  // stats may come from backend (total_matches) or demo (matches)
  const rankEl = document.getElementById('stat-rank');
  const matchesEl = document.getElementById('stat-matches');
  const winsEl = document.getElementById('stat-wins');
  const pointsEl = document.getElementById('stat-points');

  if (rankEl) rankEl.textContent = `#${stats.rank ?? ''}`;
  if (matchesEl) matchesEl.textContent = String(stats.total_matches ?? stats.matches ?? 0);
  if (winsEl) winsEl.textContent = String(stats.wins ?? 0);
  if (pointsEl) pointsEl.textContent = (stats.points ?? 0).toLocaleString();
}

function renderLastBattle(lastBattle) {
  const container = document.getElementById('last-battle');
  if (!container) return;

  if (!lastBattle) {
    container.innerHTML = `
      <div>
        <span class="label">Last Battle</span>
        <span class="data-readout" style="color: var(--text-faint);">No completed matches yet</span>
      </div>
    `;
    return;
  }

  // lastBattle schema: { status, matches, wins, points }
  container.innerHTML = `
    <div>
      <span class="label">Last Battle</span>
      <span class="data-readout">${String(lastBattle.status)}</span>
      <span class="data-readout" style="color: var(--text-muted);"> · Matches: ${lastBattle.matches}</span>
    </div>
    <div>
      <span class="label">Wins</span>
      <span class="data-readout">${lastBattle.wins}</span>
    </div>
    <div>
      <span class="label">Points</span>
      <span class="data-readout" style="color: var(--accent-primary);">${(lastBattle.points ?? 0)}</span>
    </div>
  `;
}

function renderTeamFromApi(team) {
  const noTeamEl = document.getElementById('no-team-state');
  const hasTeamEl = document.getElementById('has-team-state');
  const roster = document.getElementById('roster-preview');

  if (!team || !Array.isArray(team.slots) || team.slots.length !== 6 || !team.slots.every((s) => s && s.pokemon)) {
    if (noTeamEl) noTeamEl.hidden = false;
    if (hasTeamEl) hasTeamEl.hidden = true;
    if (roster) roster.innerHTML = '';
    return;
  }

  if (noTeamEl) noTeamEl.hidden = true;
  if (hasTeamEl) hasTeamEl.hidden = false;

  roster.innerHTML = team.slots
    .map((slot) => {
      const p = slot.pokemon;
      const moveList = (slot.moves || []).map((m) => m.display_name || m.move_name || m).join(' · ');
      const types = [p.type1].concat(p.type2 ? [p.type2] : []);
      const displayName = p.display_name || p.name;
      const portraitHTML = pokemonPortraitHTML({ id: p.id, name: displayName }, 40);
      return `
        <div class="roster-card">
          <div class="mon-portrait">${portraitHTML}</div>
          <div>
            <div class="mon-name">${displayName}</div>
            <div>${typePillsHTML(types)}</div>
            <div class="mon-moves">${moveList}</div>
          </div>
        </div>
      `;
    })
    .join('');
}

async function loadTrainerDashboardData() {
  const lastBattleEl = document.getElementById('last-battle');
  if (lastBattleEl) lastBattleEl.textContent = 'Loading trainer data...';

  // Hide team areas while loading
  const noTeamEl = document.getElementById('no-team-state');
  const hasTeamEl = document.getElementById('has-team-state');
  if (noTeamEl) noTeamEl.hidden = true;
  if (hasTeamEl) hasTeamEl.hidden = true;

  try {
    await ensureApiLoaded();
    const resp = await window.Api.getDashboard();
    const stats = resp && resp.data ? resp.data : null;
    if (!stats) {
      if (lastBattleEl) lastBattleEl.textContent = 'Unable to load trainer data';
      return;
    }

    renderTrainerChip(stats.username);
    renderStatRail(stats);
    renderLastBattle(stats.last_battle ?? null);

    // Now load team (may return 404 if trainer has no team yet)
    try {
      const teamResp = await window.Api.getTeam();
      if (teamResp && teamResp.data) {
        renderTeamFromApi(teamResp.data);
      } else {
        if (noTeamEl) noTeamEl.hidden = false;
        if (hasTeamEl) hasTeamEl.hidden = true;
      }
    } catch (teamErr) {
      if (teamErr && teamErr.name === 'ApiError' && teamErr.status === 404) {
        // No team yet — normal empty state
        if (noTeamEl) noTeamEl.hidden = false;
        if (hasTeamEl) hasTeamEl.hidden = true;
      } else if (teamErr && teamErr.name === 'ApiError' && (teamErr.status === 401 || teamErr.status === 403)) {
        window.location.href = 'index.html';
      } else {
        if (lastBattleEl) lastBattleEl.innerHTML = `<div class="error">Unable to load team data.</div>`;
      }
    }
  } catch (err) {
    if (err && err.name === 'ApiError' && (err.status === 401 || err.status === 403)) {
      window.location.href = 'index.html';
    } else {
      if (lastBattleEl) lastBattleEl.innerHTML = `<div class="error">Unable to load trainer data</div>`;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initSidebarNav();
  initMobileSidebarToggle();
  initLogout();
  // Load live dashboard data from backend
  loadTrainerDashboardData();
  setActiveSection('overview');
});