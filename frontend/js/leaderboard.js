/* ============================================================
   LEADERBOARD
   Public page — no authentication required. Renders the top three
   trainers as a podium and everyone else as a competitive ranking
   table, both sourced from the FastAPI backend (GET /leaderboard).
   The backend is the sole authority for ranking and ordering.
   ============================================================ */

function renderPodium(top3) {
  const podium = document.getElementById('podium');
  if (!podium) return;

  if (!top3 || top3.length === 0) {
    podium.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: var(--text-faint); padding: var(--space-6);">
        No ranked trainers yet.
      </div>
    `;
    return;
  }

  podium.innerHTML = top3
    .map(
      (entry) => `
        <div class="podium-card" data-place="${entry.rank}">
          <div class="podium-rank">Rank ${entry.rank}</div>
          <div class="podium-number">#${entry.rank}</div>
          <div class="podium-name">${entry.username}</div>
          <div class="podium-stats">
            <div class="stat-block"><span class="n">${entry.total_matches}</span><span class="l">Matches</span></div>
            <div class="stat-block"><span class="n">${entry.wins}</span><span class="l">Wins</span></div>
            <div class="stat-block"><span class="n">${(entry.points ?? 0).toLocaleString()}</span><span class="l">Points</span></div>
          </div>
        </div>
      `
    )
    .join('');
}

function renderRankTable(rest) {
  const tbody = document.getElementById('rank-table-body');
  if (!tbody) return;

  if (!rest || rest.length === 0) {
    tbody.innerHTML = '';
    return;
  }

  tbody.innerHTML = rest
    .map(
      (entry) => `
        <tr>
          <td class="col-rank" data-label="Rank">#${entry.rank}</td>
          <td class="col-name" data-label="Trainer">${entry.username}</td>
          <td class="col-stat" data-label="Matches">${entry.total_matches}</td>
          <td class="col-stat" data-label="Wins">${entry.wins}</td>
          <td class="col-points" data-label="Points">${(entry.points ?? 0).toLocaleString()}</td>
        </tr>
      `
    )
    .join('');
}

async function loadLeaderboardData() {
  const podium = document.getElementById('podium');
  const tbody = document.getElementById('rank-table-body');

  if (podium) {
    podium.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: var(--text-faint); padding: var(--space-6);">
        Loading leaderboard...
      </div>
    `;
  }

  try {
    const resp = await window.Api.getLeaderboard();
    const entries = resp && resp.data ? resp.data : [];

    const top3 = entries.slice(0, 3);
    const rest = entries.slice(3);

    renderPodium(top3);
    renderRankTable(rest);
  } catch (err) {
    if (podium) {
      podium.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; color: var(--accent-danger, #ef4444); padding: var(--space-6);">
          Unable to load leaderboard. Please check your connection.
        </div>
      `;
    }
    if (tbody) {
      tbody.innerHTML = '';
    }
  }
}
/* ---------- Context-Aware Navigation ---------- */
function initContextAwareNavigation() {
  const params = new URLSearchParams(window.location.search);
  const from = params.get('from');
  const backLink = document.getElementById('nav-back-link');
  const brandLink = document.getElementById('brand-link');

  if (from === 'dashboard') {
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
}

// Run immediately for instant link accuracy
initContextAwareNavigation();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initContextAwareNavigation();
    loadLeaderboardData();
  });
} else {
  initContextAwareNavigation();
  loadLeaderboardData();
}