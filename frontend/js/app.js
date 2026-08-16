// ==========================================================
// APP.JS — modal router, auth modals, game-rules modal, bootstrap
// ==========================================================

function renderModal() {
  const backdrop = el("div", { class: "modal-backdrop", onclick: (e) => { if (e.target === backdrop) closeModal(); } });
  let inner;
  switch (Modal.current) {
    case "rules": inner = renderRulesModal(); break;
    case "register": inner = renderRegisterModal(); break;
    case "login": inner = renderLoginModal(); break;
    case "picker": inner = renderPickerModal(); break;
    case "moves": inner = renderMoveModal(); break;
    case "dexdetail": inner = renderDexDetailModal(); break;
    case "exit-confirm": inner = renderExitConfirmModal(); break;
    default: inner = el("div", { class: "modal" });
  }
  backdrop.appendChild(inner);
  return backdrop;
}

const RulesModalState = { tab: "overview" };

const RULES_TABS = [
  { key: "overview", label: "Overview", icon: "checkCircle" },
  { key: "team", label: "Team & Battles", icon: "users" },
  { key: "flow", label: "Battle Flow", icon: "swords" },
  { key: "calc", label: "Calculations", icon: "calculator" },
  { key: "other", label: "Other Mechanics", icon: "star" }
];

function renderRulesModal() {
  const modal = el("div", { class: "modal rules-modal" });
  modal.appendChild(el("div", { class: "rules-modal-header" },
    el("div", { class: "lb-title-row" }, icon("book"), el("h3", {}, "Game Rules & Mechanics")),
    el("button", { class: "modal-close", onclick: closeModal }, "×")
  ));

  const body = el("div", { class: "rules-body" });
  const tabs = el("div", { class: "rules-tabs" });
  RULES_TABS.forEach(t => {
    tabs.appendChild(el("button", { class: RulesModalState.tab === t.key ? "active" : "", onclick: () => { RulesModalState.tab = t.key; render(); } },
      el("span", { html: ICONS[t.icon] }), t.label));
  });
  body.appendChild(tabs);
  body.appendChild(el("div", { class: "rules-content" }, renderRulesTabContent(RulesModalState.tab)));
  modal.appendChild(body);
  return modal;
}

function rbox(iconName, title, items) {
  const box = el("div", { class: "rules-box" },
    el("div", { class: "rb-title" }, el("span", { html: ICONS[iconName] }), title)
  );
  if (Array.isArray(items)) {
    const ul = el("ul", {});
    items.forEach(i => ul.appendChild(el("li", {}, i)));
    box.appendChild(ul);
  } else {
    box.appendChild(el("p", {}, items));
  }
  return box;
}

function renderRulesTabContent(tab) {
  if (tab === "overview") {
    return el("div", {},
      el("h4", {}, "Overview"),
      el("p", { style: "color:var(--text-dim);font-size:13px;line-height:1.7;margin-bottom:16px;" },
        "Pokémon Battle Arena is a turn-based strategy game where trainers build teams of six Pokémon and compete in intense battles. Each battle consists of up to six individual matches — one for each Pokémon."),
      el("div", { class: "rules-grid" },
        rbox("target", "Objective", "Defeat the opponent's six Pokémon by winning individual matches and earn the highest battle points."),
        rbox("users", "Team Rules", ["Build a team of exactly 6 Pokémon.", "Each Pokémon must have 4 moves.", "Only one Legendary, Mythical, or Ultra Beast is allowed per team."]),
        rbox("shield", "Key Rules", ["Each Pokémon can only be used once per battle.", "Speed decides who attacks first.", "Choose your Pokémon and moves strategically.", "You can exit anytime (unfinished match will be discarded)."]),
        rbox("star", "Scoring System Overview", "Points are awarded after each match based on damage dealt and damage taken. Win more matches. Earn more points. Climb the leaderboard!")
      )
    );
  }
  if (tab === "team") {
    return el("div", {},
      el("h4", {}, "Team & Battles"),
      el("div", { class: "rules-grid" },
        rbox("users", "Building Your Team", ["Exactly six Pokémon per team.", "Each Pokémon needs exactly four selected moves.", "No duplicate Pokémon within a team.", "No duplicate moves on the same Pokémon."]),
        rbox("shield", "Restricted Category Rule", "A team may contain at most one Legendary, Mythical, or Ultra Beast Pokémon — the rest must be standard Pokémon."),
        rbox("swords", "Battle Structure", "A battle is made up of up to six matches. Each of your Pokémon can participate in exactly one match per battle."),
        rbox("target", "Match Participants", "For every match, the AI reveals one of its remaining Pokémon first. You then choose which of your remaining Pokémon to send out against it.")
      )
    );
  }
  if (tab === "flow") {
    return el("div", {},
      el("h4", {}, "Battle Flow"),
      el("div", { class: "rules-grid" },
        rbox("swords", "Team Reveal", "Your team appears immediately. The AI's six Pokémon are revealed one by one before the battle begins."),
        rbox("target", "Opponent Selection", "At the start of each match, a random unused AI Pokémon is chosen and displayed with its full stats."),
        rbox("users", "Choosing Your Pokémon", "You pick one of your remaining, unused Pokémon to face the revealed opponent. You can back out and choose a different Pokémon before confirming."),
        rbox("zap", "Turn Order", "Speed determines who attacks first. Turns alternate — select a move, watch the exchange, repeat until one Pokémon faints."),
        rbox("checkCircle", "Match Completion", "A match ends the moment a Pokémon's HP reaches zero. The result and points are shown before moving to the next match."),
        rbox("shield", "Exiting a Battle", "You can exit at any point. Completed matches are kept; the current unfinished match is discarded and does not count.")
      )
    );
  }
  if (tab === "calc") {
    return el("div", {},
      el("h4", {}, "Calculations"),
      el("div", { class: "rules-grid" },
        rbox("calculator", "Battle HP", "Battle HP is derived from base HP and BST: battleMaxHP = (HP × 3) + floor(BST / 2). This is used only during matches."),
        rbox("swords", "Damage Formula", "Physical moves compare Attack vs. Defense; Special moves compare Special Attack vs. Special Defense, adjusted by base power and type effectiveness."),
        rbox("target", "Type Effectiveness", "Super effective, not very effective, or normal damage multipliers apply based on the move's type against the defender's type(s)."),
        rbox("star", "Match Points", ["damage_ratio = damage dealt ÷ opponent max HP", "loss_ratio = damage taken ÷ your max HP", "base_points = (damage_ratio − loss_ratio) × 100", "Win: 10 + base_points  ·  Loss: 0 + base_points"])
      )
    );
  }
  return el("div", {},
    el("h4", {}, "Other Mechanics"),
    el("div", { class: "rules-grid" },
      rbox("checkCircle", "Fainting", "When a Pokémon's HP reaches zero it faints immediately, ending the current match and triggering the result screen."),
      rbox("shield", "Completed vs. Discarded Matches", "Only fully completed matches count toward your battle statistics. An unfinished match at exit time is discarded entirely — no points, win, or match count from it."),
      rbox("trophy", "Final Battle Statistics", "After finishing or exiting, your total matches, wins, and points are updated using only completed matches, and your leaderboard rank is recalculated."),
      rbox("star", "Leaderboard Ranking", "Trainers are ranked by points first, then wins, then fewer total matches, then alphabetically as a final tiebreaker.")
    )
  );
}

function renderRegisterModal() {
  const modal = el("div", { class: "modal" });
  modal.appendChild(el("div", { class: "modal-header" }, el("h3", {}, "Register Trainer"), el("button", { class: "modal-close", onclick: closeModal }, "×")));

  const uField = el("input", { placeholder: "e.g. Ash" });
  const eField = el("input", { placeholder: "you@example.com" });
  const pField = el("input", { type: "password", placeholder: "Choose a password" });
  const err = el("div", { class: "form-error", style: "display:none" });
  const success = el("div", { class: "form-success", style: "display:none" });

  modal.appendChild(el("div", { class: "field" }, el("label", {}, "Username"), uField));
  modal.appendChild(el("div", { class: "field" }, el("label", {}, "Email"), eField));
  modal.appendChild(el("div", { class: "field" }, el("label", {}, "Password"), pField));
  modal.appendChild(err);
  modal.appendChild(success);

  modal.appendChild(el("div", { style: "margin-top:14px;display:flex;gap:10px;" },
    el("button", { class: "btn btn-primary", onclick: () => {
      err.style.display = "none"; success.style.display = "none";
      const username = uField.value.trim();
      const email = eField.value.trim();
      const password = pField.value;
      if (!username) { err.textContent = "Username is required."; err.style.display = "block"; return; }
      if (!email || !validEmail(email)) { err.textContent = "Please enter a valid email."; err.style.display = "block"; return; }
      if (!password) { err.textContent = "Password is required."; err.style.display = "block"; return; }
      if (TRAINERS.some(t => t.username.toLowerCase() === username.toLowerCase())) {
        err.textContent = "That username is already taken."; err.style.display = "block"; return;
      }
      TRAINERS.push({ username, email, password, totalMatches: 0, wins: 0, points: 0, team: null, lastBattle: null });
      success.textContent = "Registration successful! You can now enter the arena.";
      success.style.display = "block";
      uField.value = ""; eField.value = ""; pField.value = "";
    } }, "Register"),
    el("button", { class: "btn btn-ghost", onclick: closeModal }, "Cancel")
  ));
  return modal;
}

function renderLoginModal() {
  const modal = el("div", { class: "modal" });
  modal.appendChild(el("div", { class: "modal-header" }, el("h3", {}, "Enter Arena"), el("button", { class: "modal-close", onclick: closeModal }, "×")));

  const idField = el("input", { placeholder: "Username or email" });
  const pField = el("input", { type: "password", placeholder: "Password" });
  const err = el("div", { class: "form-error", style: "display:none" });

  modal.appendChild(el("div", { class: "field" }, el("label", {}, "Username or Email"), idField));
  modal.appendChild(el("div", { class: "field" }, el("label", {}, "Password"), pField));
  modal.appendChild(err);

  modal.appendChild(el("div", { style: "margin-top:14px;display:flex;gap:10px;" },
    el("button", { class: "btn btn-primary", onclick: () => {
      const id = idField.value.trim().toLowerCase();
      const pass = pField.value;
      const trainer = TRAINERS.find(t => (t.username.toLowerCase() === id || t.email.toLowerCase() === id) && t.password === pass);
      if (!trainer) {
        err.textContent = "Invalid username/email or password.";
        err.style.display = "block";
        return;
      }
      APP.currentUser = trainer;
      APP.page = "dashboard";
      APP.dashboardSection = "dashboard";
      Modal.current = null;
      render();
    } }, "Enter Arena"),
    el("button", { class: "btn btn-ghost", onclick: closeModal }, "Cancel")
  ));
  return modal;
}

// ---------------- BOOTSTRAP ----------------
document.addEventListener("DOMContentLoaded", () => {
  render();
});