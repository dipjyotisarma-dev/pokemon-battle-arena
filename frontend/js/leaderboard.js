/* ============================================================
   LEADERBOARD — POKÉMON BATTLE ARENA (EMERGENT SYSTEM)
   - Public page — no authentication required
   - Renders Top 3 as an Emergent desktop podium composition
   - Renders remaining trainers in a competitive ranking table
   - Authoritative source: FastAPI backend GET /leaderboard
   - Context-aware navigation: ?from=home vs ?from=dashboard
   ============================================================ */

function registerCurrentPage() {
  if (window.NavigationSession) {
    NavigationSession.setCurrentPage('leaderboard.html');
  }
}

function getAuthenticatedUsername() {
  try {
    if (window.Session && typeof window.Session.getTrainer === 'function') {
      const t = window.Session.getTrainer();
      if (t && t.username) return t.username.toLowerCase();
    }
  } catch (e) {
    // Ignore error
  }
  return null;
}

function renderPodium(top3) {
  const podium = document.getElementById('podium');
  if (!podium) return;

  if (!top3 || top3.length === 0) {
    podium.innerHTML = `
      <div class="leaderboard-empty-state">
        <p class="eyebrow">NO RANKINGS YET</p>
        <p class="heading-desc">Complete arena matches to appear on the official leaderboard.</p>
      </div>
    `;
    return;
  }

  // Find 1st, 2nd, and 3rd place from the top 3 slice
  const first = top3.find((e) => e.rank === 1) || top3[0];
  const second = top3.find((e) => e.rank === 2) || top3[1];
  const third = top3.find((e) => e.rank === 3) || top3[2];

  const cards = [];

  // Card 2: Silver (Rendered first on left)
  if (second) {
    cards.push(`
      <div class="podium-card" data-place="2" data-testid="podium-rank-2">
        <div class="podium-top">
          <span class="podium-rank-badge">RANK #02</span>
        </div>
        <div class="podium-name">${second.username}</div>
        <div class="podium-stats-grid">
          <div class="podium-stat-item">
            <span class="stat-label">Matches</span>
            <span class="stat-val">${second.total_matches}</span>
          </div>
          <div class="podium-stat-item">
            <span class="stat-label">Wins</span>
            <span class="stat-val">${second.wins}</span>
          </div>
          <div class="podium-stat-item points-item">
            <span class="stat-label">Points</span>
            <span class="stat-val">${(second.points ?? 0).toLocaleString()}</span>
          </div>
        </div>
      </div>
    `);
  }

  // Card 1: Champion (Rendered center)
  if (first) {
    cards.push(`
      <div class="podium-card" data-place="1" data-testid="podium-rank-1">
        <div class="podium-top">
          <span class="podium-rank-badge">RANK #01</span>
          <span class="podium-crown">CHAMPION</span>
        </div>
        <div class="podium-name">${first.username}</div>
        <div class="podium-stats-grid">
          <div class="podium-stat-item">
            <span class="stat-label">Matches</span>
            <span class="stat-val">${first.total_matches}</span>
          </div>
          <div class="podium-stat-item">
            <span class="stat-label">Wins</span>
            <span class="stat-val">${first.wins}</span>
          </div>
          <div class="podium-stat-item points-item">
            <span class="stat-label">Points</span>
            <span class="stat-val">${(first.points ?? 0).toLocaleString()}</span>
          </div>
        </div>
      </div>
    `);
  }

  // Card 3: Bronze (Rendered right)
  if (third) {
    cards.push(`
      <div class="podium-card" data-place="3" data-testid="podium-rank-3">
        <div class="podium-top">
          <span class="podium-rank-badge">RANK #03</span>
        </div>
        <div class="podium-name">${third.username}</div>
        <div class="podium-stats-grid">
          <div class="podium-stat-item">
            <span class="stat-label">Matches</span>
            <span class="stat-val">${third.total_matches}</span>
          </div>
          <div class="podium-stat-item">
            <span class="stat-label">Wins</span>
            <span class="stat-val">${third.wins}</span>
          </div>
          <div class="podium-stat-item points-item">
            <span class="stat-label">Points</span>
            <span class="stat-val">${(third.points ?? 0).toLocaleString()}</span>
          </div>
        </div>
      </div>
    `);
  }

  podium.innerHTML = cards.join('');
}

function renderRankTable(rest) {
  const tbody = document.getElementById('rank-table-body');
  if (!tbody) return;

  if (!rest || rest.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; padding: 28px 16px; color: var(--text-muted); font-family: var(--font-mono); font-size: 11px; text-transform: uppercase;">
          No additional ranked trainers in standings.
        </td>
      </tr>
    `;
    return;
  }

  const currentUser = getAuthenticatedUsername();

  tbody.innerHTML = rest
    .map((entry) => {
      const isCurrent = currentUser && entry.username && entry.username.toLowerCase() === currentUser;
      const rankClass = entry.rank === 1 ? 'rank-top-1' : entry.rank === 2 ? 'rank-top-2' : entry.rank === 3 ? 'rank-top-3' : '';
      const rowClass = isCurrent ? 'current-user-row' : '';

      return `
        <tr class="${rowClass}" data-testid="leaderboard-row-${entry.rank}">
          <td class="col-rank ${rankClass}" data-label="Rank">#${String(entry.rank).padStart(2, '0')}</td>
          <td class="col-trainer" data-label="Trainer">${entry.username}</td>
          <td class="col-stat" style="text-align: right;" data-label="Matches">${entry.total_matches}</td>
          <td class="col-stat" style="text-align: right;" data-label="Wins">${entry.wins}</td>
          <td class="col-points" style="text-align: right;" data-label="Points">${(entry.points ?? 0).toLocaleString()}</td>
        </tr>
      `;
    })
    .join('');
}

async function loadLeaderboardData() {
  const podium = document.getElementById('podium');
  const tbody = document.getElementById('rank-table-body');
  const totalTag = document.getElementById('leaderboard-total-tag');

  if (podium) {
    podium.innerHTML = `
      <div class="leaderboard-empty-state">
        <p class="heading-desc">Loading official standings from arena database…</p>
      </div>
    `;
  }

  try {
    const resp = await window.Api.getLeaderboard();
    const entries = resp && resp.data ? resp.data : [];

    if (totalTag) {
      totalTag.textContent = `${entries.length} TRAINERS`;
    }

    const top3 = entries.slice(0, 3);
    const rest = entries.slice(3);

    renderPodium(top3);
    renderRankTable(rest);
  } catch (err) {
    if (podium) {
      podium.innerHTML = `
        <div class="leaderboard-empty-state">
          <p class="eyebrow" style="color: var(--accent-danger, #ef4444);">STANDINGS UNAVAILABLE</p>
          <p class="heading-desc">Unable to load leaderboard data. Please check your connection.</p>
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
    if (backLink) {
      backLink.textContent = '← Back to Home';
      backLink.href = 'index.html';
    }
    if (brandLink) {
      brandLink.href = 'index.html';
    }
  }

  // Propagate origin context to header navigation links
  const navPokedex = document.querySelector('[data-testid="nav-pokedex"]') || document.querySelector('header a[href*="pokedex"]');
  if (navPokedex) {
    navPokedex.href = `pokedex.html?from=${context}`;
  }
  const navLeaderboard = document.querySelector('[data-testid="nav-leaderboard"]') || document.querySelector('header a[href*="leaderboard"]');
  if (navLeaderboard) {
    navLeaderboard.href = `leaderboard.html?from=${context}`;
  }

  // Propagate origin context to footer navigation links
  const footerPokedex = document.querySelector('.footer-links a[href*="pokedex"]');
  if (footerPokedex) {
    footerPokedex.href = `pokedex.html?from=${context}`;
  }
  const footerLeaderboard = document.querySelector('.footer-links a[href*="leaderboard"]');
  if (footerLeaderboard) {
    footerLeaderboard.href = `leaderboard.html?from=${context}`;
  }
}

// Run immediately for instant link accuracy
initContextAwareNavigation();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    registerCurrentPage();
    initContextAwareNavigation();
    loadLeaderboardData();
  });
} else {
  registerCurrentPage();
  initContextAwareNavigation();
  loadLeaderboardData();
}