/* ============================================================
   LEADERBOARD
   Public page — no authentication required. Renders the top three
   trainers as a podium and everyone else as a competitive ranking
   table, both sourced from DemoData.leaderboard.
   ============================================================ */

function renderPodium() {
  const top3 = DemoData.leaderboard.slice(0, 3);
  const podium = document.getElementById('podium');

  podium.innerHTML = top3
    .map(
      (entry) => `
        <div class="podium-card" data-place="${entry.rank}">
          <div class="podium-rank">Rank ${entry.rank}</div>
          <div class="podium-number">#${entry.rank}</div>
          <div class="podium-name">${entry.trainerName}</div>
          <div class="podium-stats">
            <div class="stat-block"><span class="n">${entry.matches}</span><span class="l">Matches</span></div>
            <div class="stat-block"><span class="n">${entry.wins}</span><span class="l">Wins</span></div>
            <div class="stat-block"><span class="n">${entry.points.toLocaleString()}</span><span class="l">Points</span></div>
          </div>
        </div>
      `
    )
    .join('');
}

function renderRankTable() {
  const rest = DemoData.leaderboard.slice(3);
  const tbody = document.getElementById('rank-table-body');

  if (rest.length === 0) {
    tbody.innerHTML = '';
    return;
  }

  tbody.innerHTML = rest
    .map(
      (entry) => `
        <tr>
          <td class="col-rank" data-label="Rank">#${entry.rank}</td>
          <td class="col-name" data-label="Trainer">${entry.trainerName}</td>
          <td class="col-stat" data-label="Matches">${entry.matches}</td>
          <td class="col-stat" data-label="Wins">${entry.wins}</td>
          <td class="col-points" data-label="Points">${entry.points.toLocaleString()}</td>
        </tr>
      `
    )
    .join('');
}

document.addEventListener('DOMContentLoaded', () => {
  renderPodium();
  renderRankTable();
});