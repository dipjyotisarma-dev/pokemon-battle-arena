// ==========================================================
// BATTLE-UI.JS — battle page rendering & animations
// ==========================================================

function renderBattlePage() {
  const b = APP.battle;
  const wrap = el("div", { class: "battle-page" });

  wrap.appendChild(el("div", { class: "battle-topbar" },
    el("div", { class: "brand" }, "POKÉMON ", el("span", {}, "BATTLE ARENA")),
    el("button", { class: "btn btn-danger btn-sm", onclick: () => { Modal.current = "exit-confirm"; render(); } }, "Exit Battle")
  ));

  const body = el("div", { class: "battle-body" });

  switch (b.state) {
    case BATTLE_STATES.TEAM_REVEAL: body.appendChild(renderTeamReveal()); break;
    case BATTLE_STATES.OPPONENT_DISPLAY: body.appendChild(renderMatchIntroThenOpponent()); break;
    case BATTLE_STATES.TRAINER_SELECTION: body.appendChild(renderTrainerSelection()); break;
    case BATTLE_STATES.VS_SCREEN: body.appendChild(renderVsScreen()); break;
    case BATTLE_STATES.BATTLE_INTRO: body.appendChild(renderBattleIntro()); break;
    case BATTLE_STATES.IN_PROGRESS: body.appendChild(renderBattlefield()); break;
    case BATTLE_STATES.MATCH_RESULT: body.appendChild(renderMatchResult()); break;
    case BATTLE_STATES.FINAL_RESULT: body.appendChild(renderFinalResult()); break;
    default: body.appendChild(el("div", {}, "..."));
  }

  wrap.appendChild(body);
  return wrap;
}

// ---------- TEAM REVEAL ----------
function renderTeamReveal() {
  const b = APP.battle;
  const container = el("div", { style: "width:100%;" });
  const cols = el("div", { class: "reveal-columns" });

  const trainerCol = el("div", { class: "reveal-col" }, el("h4", {}, "Your Team"));
  b.trainerTeam.forEach((entry, i) => {
    trainerCol.appendChild(el("div", { class: "reveal-slot", style: `animation-delay:${i * 80}ms` },
      el("img", { src: entry.pokemon.image }), el("span", {}, entry.pokemon.displayName)));
  });

  const oppCol = el("div", { class: "reveal-col" }, el("h4", {}, "AI Team"));
  b.opponentTeam.forEach((entry, i) => {
    if (i < b.revealedOpponentCount) {
      oppCol.appendChild(el("div", { class: "reveal-slot", style: `animation-delay:${i * 80}ms` },
        el("img", { src: entry.pokemon.image }), el("span", {}, entry.pokemon.displayName)));
    } else {
      oppCol.appendChild(el("div", { class: "reveal-slot mystery" }, "???"));
    }
  });

  cols.appendChild(trainerCol);
  cols.appendChild(oppCol);
  container.appendChild(cols);

  if (b.revealedOpponentCount < b.opponentTeam.length) {
    container.appendChild(el("div", { class: "preparing-text" }, "Preparing opponent…"));
    if (!b._revealTimerSet) {
      b._revealTimerSet = true;
      setTimeout(() => {
        b.revealedOpponentCount += 1;
        b._revealTimerSet = false;
        render();
      }, 550);
    }
  } else {
    container.appendChild(el("div", { style: "text-align:center;margin-top:26px;" },
      el("button", { class: "btn btn-primary", onclick: () => { b.state = BATTLE_STATES.MATCH_PREPARATION; startMatchSequence(); } }, "Start")
    ));
  }
  return container;
}

function startMatchSequence() {
  render();
  setTimeout(() => { beginMatch(); }, 900);
}

// ---------- MATCH INTRO -> OPPONENT DISPLAY ----------
function renderMatchIntroThenOpponent() {
  const b = APP.battle;
  if (!b._introShown) {
    b._introShown = true;
    setTimeout(() => { render(); }, 1100);
    return el("div", { class: "match-intro" },
      el("div", { class: "match-num" }, `MATCH ${b.matchNumber}`),
      el("div", { class: "sub" }, "Choosing opponent…")
    );
  }
  const entry = b.currentOpponent;
  const container = el("div", { class: "opponent-display" },
    el("img", { src: entry.pokemon.image }),
    el("h2", {}, entry.pokemon.displayName),
    el("div", { class: "types" }, typeBadge(entry.pokemon.type1), entry.pokemon.type2 ? typeBadge(entry.pokemon.type2) : null)
  );
  container.appendChild(statBar("HP", entry.pokemon.hp));
  container.appendChild(statBar("Attack", entry.pokemon.attack));
  container.appendChild(statBar("Defense", entry.pokemon.defense));
  container.appendChild(statBar("Sp. Atk", entry.pokemon.specialAttack));
  container.appendChild(statBar("Sp. Def", entry.pokemon.specialDefense));
  container.appendChild(statBar("Speed", entry.pokemon.speed));
  container.appendChild(el("button", { class: "btn btn-primary", style: "margin-top:20px;", onclick: () => {
    b._introShown = false;
    b.state = BATTLE_STATES.TRAINER_SELECTION;
    render();
  } }, "Choose Your Pokémon"));
  return container;
}

// ---------- TRAINER SELECTION ----------
function renderTrainerSelection() {
  const b = APP.battle;
  const container = el("div", { style: "width:100%;text-align:center;" });
  container.appendChild(el("h3", { style: "margin-bottom:16px;" }, `Match ${b.matchNumber} — Choose your Pokémon`));
  const grid = el("div", { class: "trainer-select-grid", style: "margin:0 auto;" });
  b.trainerTeam.forEach(entry => {
    const used = b.usedTrainerIds.has(entry.pokemon.id);
    const card = el("div", { class: `trainer-pick-card ${used ? "used" : ""}` },
      el("img", { src: entry.pokemon.image }),
      el("div", { style: "font-weight:700;margin-top:6px;" }, entry.pokemon.displayName),
      el("div", { class: "types", style: "display:flex;gap:4px;justify-content:center;margin-top:4px;" }, typeBadge(entry.pokemon.type1), entry.pokemon.type2 ? typeBadge(entry.pokemon.type2) : null)
    );
    if (!used) card.addEventListener("click", () => selectTrainerPokemonForMatch(entry));
    grid.appendChild(card);
  });
  container.appendChild(grid);
  return container;
}

// ---------- VS SCREEN ----------
function renderVsScreen() {
  const b = APP.battle;
  const container = el("div", { class: "vs-overlay" });
  container.appendChild(el("button", { class: "modal-close", style: "position:absolute;top:10px;right:20px;font-size:26px;", onclick: backToTrainerSelection }, "×"));
  container.appendChild(el("div", { class: "vs-cards" },
    el("div", { class: "vs-card" }, el("img", { src: b.currentTrainerPokemon.pokemon.image }), el("div", {}, b.currentTrainerPokemon.pokemon.displayName)),
    el("div", { class: "vs-label" }, "VS"),
    el("div", { class: "vs-card" }, el("img", { src: b.currentOpponent.pokemon.image }), el("div", {}, b.currentOpponent.pokemon.displayName))
  ));
  const winner = b.firstAttacker === "trainer" ? b.currentTrainerPokemon.pokemon : b.currentOpponent.pokemon;
  container.appendChild(el("div", { class: "first-attacker-box" },
    el("div", { style: "color:var(--text-dim);font-size:13px;text-transform:uppercase;letter-spacing:0.06em;" }, "First Attacker"),
    el("div", { style: "display:flex;gap:24px;justify-content:center;margin-top:10px;" },
      el("div", {}, el("div", {}, b.currentTrainerPokemon.pokemon.displayName), el("div", { style: "color:var(--text-faint);font-size:12px;" }, `Speed: ${b.currentTrainerPokemon.pokemon.speed}`)),
      el("div", {}, el("div", {}, b.currentOpponent.pokemon.displayName), el("div", { style: "color:var(--text-faint);font-size:12px;" }, `Speed: ${b.currentOpponent.pokemon.speed}`))
    ),
    el("div", { class: "winner" }, `${winner.displayName} attacks first.`)
  ));
  container.appendChild(el("button", { class: "btn btn-primary", style: "margin-top:24px;", onclick: confirmMatchup }, "Continue"));
  return container;
}

// ---------- BATTLE INTRO (countdown) ----------
function renderBattleIntro() {
  const b = APP.battle;
  if (b._countdown === undefined) b._countdown = 3;
  const container = el("div", { style: "text-align:center;" });
  if (b._countdown > 0) {
    container.appendChild(el("div", { class: "countdown-num" }, String(b._countdown)));
    setTimeout(() => { b._countdown -= 1; render(); }, 600);
  } else {
    container.appendChild(el("div", { class: "countdown-num" }, "BATTLE!"));
    setTimeout(() => { b._countdown = undefined; b.state = BATTLE_STATES.IN_PROGRESS; render(); }, 600);
  }
  return container;
}

// ---------- MAIN BATTLEFIELD ----------
function renderBattlefield() {
  const b = APP.battle;
  const c = b.combat;
  const field = el("div", { class: "battlefield" });

  const oppHpPct = (c.opponentHP / c.opponentMaxHP) * 100;
  const trHpPct = (c.trainerHP / c.trainerMaxHP) * 100;
  const oppClass = oppHpPct <= 20 ? "critical" : oppHpPct <= 50 ? "low" : "";
  const trClass = trHpPct <= 20 ? "critical" : trHpPct <= 50 ? "low" : "";

  field.appendChild(el("div", { class: "hp-panel opponent-hp" },
    el("div", { class: "name" }, b.currentOpponent.pokemon.displayName),
    el("div", { class: "hp-bar-track" }, el("div", { class: `hp-bar-fill ${oppClass}`, style: `width:${oppHpPct}%` })),
    el("div", { class: "hp-numbers" }, `${c.opponentHP} / ${c.opponentMaxHP}`)
  ));
  field.appendChild(el("div", { class: "hp-panel trainer-hp" },
    el("div", { class: "name" }, b.currentTrainerPokemon.pokemon.displayName),
    el("div", { class: "hp-bar-track" }, el("div", { class: `hp-bar-fill ${trClass}`, style: `width:${trHpPct}%` })),
    el("div", { class: "hp-numbers" }, `${c.trainerHP} / ${c.trainerMaxHP}`)
  ));

  field.appendChild(el("div", { class: `combatant opponent ${c.animClass === "opp-hit" ? "hit" : c.animClass === "opp-attack" ? "attack-lunge" : c.opponentHP <= 0 ? "fainted" : ""}`, id: "opp-sprite" },
    el("img", { src: b.currentOpponent.pokemon.image })));
  field.appendChild(el("div", { class: `combatant trainer ${c.animClass === "tr-hit" ? "hit" : c.animClass === "tr-attack" ? "attack-lunge" : c.trainerHP <= 0 ? "fainted" : ""}`, id: "tr-sprite" },
    el("img", { src: b.currentTrainerPokemon.pokemon.image })));

  if (c.centerEvent) {
    field.appendChild(el("div", { class: "center-event" },
      el("div", { class: "line1" }, c.centerEvent.line1),
      c.centerEvent.line2 ? el("div", { class: "line2" }, c.centerEvent.line2) : null
    ));
  }

  const logPanel = el("div", { class: "battle-log-panel" }, el("div", { class: "log-title" }, "Battle Log"));
  [...c.log].reverse().slice(0, 8).forEach(line => logPanel.appendChild(el("div", { class: "log-line" }, line)));
  field.appendChild(logPanel);

  const canAct = c.turn === "trainer" && !c.locked;
  const moveBtns = el("div", { class: "move-buttons" });
  b.currentTrainerPokemon.moves.forEach(m => {
    moveBtns.appendChild(el("button", { class: "move-btn", disabled: !canAct ? true : null, onclick: () => handleTrainerMoveClick(m) },
      el("span", { class: "mv-name" }, m.displayName),
      el("span", { class: "mv-meta" }, `${m.type.toUpperCase()} · ${m.category === "physical" ? "PHY" : "SPC"} · ${m.basePower} BP`)
    ));
  });
  field.appendChild(moveBtns);

  if (!c.centerEvent && c.turn === "opponent" && !c.locked) {
    c.locked = true;
    setTimeout(() => runOpponentTurn(), 500);
  }

  return field;
}

function handleTrainerMoveClick(move) {
  const b = APP.battle;
  const c = b.combat;
  if (c.turn !== "trainer" || c.locked) return;
  c.locked = true;
  c.animClass = "tr-attack";
  render();
  setTimeout(() => {
    const result = performTrainerMove(move);
    c.animClass = "opp-hit";
    c.centerEvent = { line1: result.line1, line2: result.line2 };
    render();
    setTimeout(() => {
      c.animClass = null;
      if (result.fainted) {
        c.centerEvent = { line1: `${b.currentOpponent.pokemon.displayName} fainted!`, line2: null };
        c.log.push(`${b.currentOpponent.pokemon.displayName} fainted.`);
        render();
        setTimeout(() => finishMatch(true), 1200);
        return;
      }
      c.turn = "opponent";
      c.centerEvent = { line1: `${b.currentOpponent.pokemon.displayName}'s Turn`, line2: null };
      render();
      setTimeout(() => { c.centerEvent = null; c.locked = false; render(); }, 800);
    }, 750);
  }, 350);
}

function runOpponentTurn() {
  const b = APP.battle;
  const c = b.combat;
  c.animClass = "opp-attack";
  render();
  setTimeout(() => {
    const result = performOpponentMove();
    c.animClass = "tr-hit";
    c.centerEvent = { line1: result.line1, line2: result.line2 };
    render();
    setTimeout(() => {
      c.animClass = null;
      if (result.fainted) {
        c.centerEvent = { line1: `${b.currentTrainerPokemon.pokemon.displayName} fainted!`, line2: null };
        c.log.push(`${b.currentTrainerPokemon.pokemon.displayName} fainted.`);
        render();
        setTimeout(() => finishMatch(false), 1200);
        return;
      }
      c.turn = "trainer";
      c.centerEvent = { line1: `${b.currentTrainerPokemon.pokemon.displayName}'s Turn`, line2: "Select a move" };
      render();
      setTimeout(() => { c.centerEvent = null; c.locked = false; render(); }, 800);
    }, 750);
  }, 350);
}

// ---------- MATCH RESULT ----------
function renderMatchResult() {
  const b = APP.battle;
  const s = b.lastMatchSummary;
  const container = el("div", { class: "result-overlay" });
  container.appendChild(el("div", { class: "badge" }, `Match ${s.matchNumber} Complete`));
  container.appendChild(el("h2", {}, s.trainerWon ? "Winner: Trainer" : "Winner: Opponent"));
  container.appendChild(el("p", { style: "margin-top:8px;" }, s.trainerWon
    ? `${s.trainerName} defeated ${s.opponentName}`
    : `${s.opponentName} defeated ${s.trainerName}`));
  container.appendChild(el("div", { class: "points" }, `${s.matchPoints >= 0 ? "+" : ""}${s.matchPoints.toFixed(2)}`));
  container.appendChild(el("div", { style: "font-size:12px;color:var(--text-faint);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;" }, "Battle Progress"));
  container.appendChild(el("div", { class: "progress-row" },
    el("div", { class: "stat" }, el("div", { class: "num" }, String(b.completedMatches)), el("div", { class: "lbl" }, "Matches")),
    el("div", { class: "stat" }, el("div", { class: "num" }, String(b.wins)), el("div", { class: "lbl" }, "Wins")),
    el("div", { class: "stat" }, el("div", { class: "num" }, b.points.toFixed(2)), el("div", { class: "lbl" }, "Points"))
  ));
  container.appendChild(el("button", { class: "btn btn-primary", onclick: goToNextMatch }, b.completedMatches >= 6 ? "Finish Battle" : "Next Match"));
  return container;
}

// ---------- FINAL RESULT ----------
function renderFinalResult() {
  const b = APP.battle;
  const rank = getTrainerRank(APP.currentUser.username);
  const container = el("div", { class: "result-overlay" });
  container.appendChild(el("h2", {}, b.finalStatus === "completed" ? "Battle Complete" : "Battle Ended"));
  container.appendChild(el("div", { class: "progress-row" },
    el("div", { class: "stat" }, el("div", { class: "num" }, String(b.completedMatches)), el("div", { class: "lbl" }, "Matches")),
    el("div", { class: "stat" }, el("div", { class: "num" }, String(b.wins)), el("div", { class: "lbl" }, "Wins")),
    el("div", { class: "stat" }, el("div", { class: "num" }, b.points.toFixed(2)), el("div", { class: "lbl" }, "Points"))
  ));
  container.appendChild(el("p", { style: "margin-top:6px;" }, `Rank: #${rank}`));
  container.appendChild(el("button", { class: "btn btn-primary", style: "margin-top:20px;", onclick: returnToDashboardFromBattle }, "Return to Dashboard"));
  return container;
}

// ---------- EXIT CONFIRMATION MODAL ----------
function renderExitConfirmModal() {
  const b = APP.battle;
  const modal = el("div", { class: "modal" });
  modal.appendChild(el("div", { class: "modal-header" }, el("h3", {}, "Exit Battle?"), el("button", { class: "modal-close", onclick: closeModal }, "×")));
  modal.appendChild(el("p", {}, "Your current unfinished match will be discarded."));
  modal.appendChild(el("div", { class: "progress-row" },
    el("div", { class: "stat" }, el("div", { class: "num" }, String(b.completedMatches)), el("div", { class: "lbl" }, "Completed")),
    el("div", { class: "stat" }, el("div", { class: "num" }, String(b.wins)), el("div", { class: "lbl" }, "Wins")),
    el("div", { class: "stat" }, el("div", { class: "num" }, b.points.toFixed(2)), el("div", { class: "lbl" }, "Points"))
  ));
  modal.appendChild(el("div", { style: "margin-top:18px;display:flex;gap:10px;" },
    el("button", { class: "btn btn-danger", onclick: () => { Modal.current = null; exitBattle(); } }, "Exit Battle"),
    el("button", { class: "btn btn-ghost", onclick: closeModal }, "Cancel")
  ));
  return modal;
}
