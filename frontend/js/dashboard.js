/* ============================================================
   POKÉMON BATTLE ARENA — TRAINER DASHBOARD (EMERGENT SYSTEM)
   Handles live data loading from FastAPI backend:
   - GET /trainer/dashboard (Trainer stats, rank, last battle)
   - GET /team (6-slot roster)
   - POST /auth/logout (Session logout)
   ============================================================ */

function registerCurrentPage() {
  if (!window.NavigationSession) {
    window.location.href = 'index.html';
    return false;
  }

  if (!NavigationSession.isSessionActive()) {
    window.location.href = 'index.html';
    return false;
  }

  NavigationSession.setCurrentPage('dashboard.html');
  return true;
}

function formatTypeName(t) {
  if (!t) return '';
  const s = String(t).trim();
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function typeChipsHTML(types) {
  if (!types || types.length === 0) return '';
  return types
    .filter(Boolean)
    .map((t) => `<span class="type-chip">${formatTypeName(t)}</span>`)
    .join('');
}

function renderTrainerStats(stats) {
  const nameEl = document.getElementById('trainer-name');
  const rankEl = document.getElementById('stat-rank');
  const matchesEl = document.getElementById('stat-matches');
  const winsEl = document.getElementById('stat-wins');
  const pointsEl = document.getElementById('stat-points');

  if (nameEl) nameEl.textContent = stats.username || 'Candidate';
  if (rankEl) rankEl.textContent = stats.rank ? `#${stats.rank}` : '#—';
  if (matchesEl) matchesEl.textContent = String(stats.total_matches ?? 0);
  if (winsEl) winsEl.textContent = String(stats.wins ?? 0);
  if (pointsEl) pointsEl.textContent = (stats.points ?? 0).toLocaleString();
}

function renderLastBattle(lastBattle) {
  const container = document.getElementById('last-battle-container');
  if (!container) return;

  if (!lastBattle) {
    container.innerHTML = `
      <div class="empty-state" data-testid="dashboard-last-battle-empty">
        <strong>NO COMPLETED BATTLE</strong>
        <span>Your first result will appear here after a full 6-match arena run.</span>
      </div>
    `;
    return;
  }

  // lastBattle schema from backend: { status: str, matches: int, wins: int, points: float }
  const isCompleted = lastBattle.status === 'completed';
  const statusClass = isCompleted ? 'completed' : 'abandoned';
  const statusLabel = isCompleted ? 'Run Completed' : 'Run Abandoned';

  container.innerHTML = `
    <div class="last-battle-card">
      <div class="last-battle-header">
        <span class="status-badge ${statusClass}">${statusLabel}</span>
        <span class="muted" style="font-family: var(--font-mono); font-size: 11px;">6-Match Sequential Arena</span>
      </div>
      <div class="last-metrics">
        <div>
          <b>${lastBattle.matches ?? 0}</b>
          <span>Matches</span>
        </div>
        <div>
          <b>${lastBattle.wins ?? 0}</b>
          <span>Wins</span>
        </div>
        <div>
          <b style="color: var(--accent-primary);">${(lastBattle.points ?? 0).toLocaleString()}</b>
          <span>Points</span>
        </div>
      </div>
      <p class="muted">Summary from your most recent arena run.</p>
    </div>
  `;
}

function renderTeamGrid(team) {
  const grid = document.getElementById('team-grid');
  const headAction = document.getElementById('roster-head-action');
  const actionBand = document.getElementById('action-band');
  if (!grid) return;

  const hasCompleteTeam =
    team &&
    Array.isArray(team.slots) &&
    team.slots.length === 6 &&
    team.slots.every((s) => s && s.pokemon);

  if (hasCompleteTeam) {
    // 1. Render 6 .pokemon-slot cards
    grid.innerHTML = team.slots
      .map((slot) => {
        const p = slot.pokemon;
        const displayName = p.display_name || p.name || `Slot ${slot.slot}`;
        const types = [p.type1].concat(p.type2 ? [p.type2] : []).filter(Boolean);
        const moves = (slot.moves || []).map((m) => m.display_name || m.move_name || m);
        const moveList = moves.length > 0 ? moves.join(' · ') : 'No moves set';
        const imgPath = `assets/images/pokemon/${p.id}.png`;

        return `
          <article class="pokemon-slot" data-slot="${slot.slot}" data-testid="dashboard-pokemon-slot-${slot.slot}">
            <span class="slot-num">0${slot.slot}</span>
            <img src="${imgPath}" alt="${displayName}" onerror="this.style.opacity='0.2'" />
            <strong>${displayName}</strong>
            <div>${typeChipsHTML(types)}</div>
            <div class="slot-moves">${moveList}</div>
          </article>
        `;
      })
      .join('');

    // 2. Roster header CTA -> Edit team
    if (headAction) {
      headAction.innerHTML = `
        <a class="button button-outline" href="team.html" data-testid="dashboard-edit-team-button">
          Edit team <span>→</span>
        </a>
      `;
    }

    // 3. Battle Gate -> Ready for Battle
    if (actionBand) {
      actionBand.innerHTML = `
        <div class="action-band-copy">
          <p class="eyebrow">BATTLE GATE</p>
          <strong id="team-status" data-testid="dashboard-team-status">READY FOR BATTLE</strong>
          <span id="team-status-note">Your six are registered. Enter the arena when you're ready.</span>
        </div>
        <a class="button button-cyan" id="start-battle" href="battle.html" data-testid="dashboard-start-battle">
          Start battle <span>→</span>
        </a>
      `;
    }
  } else {
    // No team yet -> 6 .empty-slot placeholders
    let emptySlotsHTML = '';
    for (let i = 1; i <= 6; i++) {
      emptySlotsHTML += `
        <div class="empty-slot" data-slot="${i}" data-testid="dashboard-empty-slot-${i}">
          <b>0${i}</b>
          <span>Empty Slot</span>
        </div>
      `;
    }
    grid.innerHTML = emptySlotsHTML;

    // Roster header CTA -> Create team
    if (headAction) {
      headAction.innerHTML = `
        <a class="button button-gold" href="team.html" data-testid="dashboard-create-team-button">
          Create team <span>→</span>
        </a>
      `;
    }

    // Battle Gate -> Team Required (points to team.html)
    if (actionBand) {
      actionBand.innerHTML = `
        <div class="action-band-copy">
          <p class="eyebrow">BATTLE GATE</p>
          <strong id="team-status" data-testid="dashboard-team-status">TEAM REQUIRED</strong>
          <span id="team-status-note">Build a six-Pokémon roster and assign four valid moves before entering the arena.</span>
        </div>
        <a class="button button-gold" id="start-battle" href="team.html" data-testid="dashboard-start-battle">
          Create team <span>→</span>
        </a>
      `;
    }
  }
}

async function loadTrainerDashboardData() {
  try {
    if (!window.Api) {
      window.location.href = 'index.html';
      return;
    }

    const resp = await window.Api.getDashboard();
    const stats = resp && resp.data ? resp.data : null;
    if (!stats) {
      window.location.href = 'index.html';
      return;
    }

    renderTrainerStats(stats);
    renderLastBattle(stats.last_battle ?? null);

    // Load team
    try {
      const teamResp = await window.Api.getTeam();
      if (teamResp && teamResp.data) {
        renderTeamGrid(teamResp.data);
      } else {
        renderTeamGrid(null);
      }
    } catch (teamErr) {
      renderTeamGrid(null);
    }
  } catch (err) {
    if (err && err.name === 'ApiError' && (err.status === 401 || err.status === 403)) {
      window.location.href = 'index.html';
      return;
    }
    console.error('Error loading dashboard data:', err);
  }
}

function initLogout() {
  const logoutBtn = document.getElementById('logout-btn');
  if (!logoutBtn) return;

  logoutBtn.addEventListener('click', async () => {
    if (typeof logoutTrainer === 'function') {
      await logoutTrainer();
    } else if (window.Api && typeof window.Api.logout === 'function') {
      try {
        await window.Api.logout();
      } catch (e) {
        // ignore network error
      }
    }
    if (window.NavigationSession) {
      NavigationSession.clear();
    }

    window.location.href = 'index.html';
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (!registerCurrentPage()) return;

    initLogout();
    loadTrainerDashboardData();
  });
} else {
  if (!registerCurrentPage()) {
    // Redirect initiated by registerCurrentPage().
  } else {
    initLogout();
    loadTrainerDashboardData();
  }
}