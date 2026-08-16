// ==========================================================
// NAVIGATION.JS — page-level rendering (home, dashboard, leaderboard)
// ==========================================================

const Modal = { current: null }; // "rules" | "register" | "login" | "picker" | "moves" | "dexdetail"

function closeModal() { Modal.current = null; render(); }

function renderRoot() {
  const root = $("#app");
  root.innerHTML = "";
  if (APP.page === "home") root.appendChild(renderHome());
  else if (APP.page === "leaderboard") root.appendChild(renderLeaderboard());
  else if (APP.page === "dashboard") root.appendChild(renderDashboard());
  else if (APP.page === "battle") root.appendChild(renderBattlePage());

  if (Modal.current) root.appendChild(renderModal());
}

function render() { renderRoot(); }

// ---------------- HOME ----------------
function renderHome() {
  const wrap = el("div", {});
  wrap.appendChild(el("div", { class: "topbar" },
    el("div", { class: "brand" }, "POKÉMON ", el("span", {}, "BATTLE ARENA")),
    el("div", {}, isLoggedIn()
      ? el("button", { class: "btn btn-sm", onclick: () => { APP.page = "dashboard"; render(); } }, "Dashboard")
      : "")
  ));

  const hero = el("div", { class: "home-hero" },
    el("div", { class: "hero-glow-left" }),
    el("div", { class: "hero-glow-right" }),
    el("div", { class: "hero-glass" },
      el("div", { class: "eyebrow" }, "Six on six · Turn based · No mercy"),
      el("h1", {}, "POKÉMON", el("span", {}, "BATTLE ARENA")),
      el("p", { class: "tagline" }, "Build your team. Choose your strategy. Battle your opponent and rise to the top!"),
      el("div", { class: "home-actions" },
        el("button", { class: "action-card", onclick: () => { Modal.current = "rules"; render(); } },
          icon("book"), el("div", { class: "a-title" }, "Game Rules"), el("div", { class: "a-sub" }, "Learn how to play")),
        el("button", { class: "action-card", onclick: () => { Modal.current = "register"; render(); } },
          icon("userPlus"), el("div", { class: "a-title" }, "Register Trainer"), el("div", { class: "a-sub" }, "Create your account")),
        el("button", { class: "action-card primary", onclick: () => { Modal.current = "login"; render(); } },
          icon("sword"), el("div", { class: "a-title" }, "Enter Arena"), el("div", { class: "a-sub" }, "Login & battle")),
        el("button", { class: "action-card", onclick: () => { APP.page = "leaderboard"; render(); } },
          icon("trophy"), el("div", { class: "a-title" }, "View Leaderboard"), el("div", { class: "a-sub" }, "See top trainers"))
      ),
      renderFeedbackSection()
    ),
    el("div", { class: "home-footer" }, `© ${new Date().getFullYear()} Pokémon Battle Arena · Fan-made project`)
  );
  wrap.appendChild(hero);
  return wrap;
}

function renderFeedbackSection() {
  const section = el("div", { class: "feedback-section" },
    el("h3", {}, "Have an idea?"),
    el("p", { class: "sub" }, "Send your thoughts straight to the developer.")
  );
  const emailField = el("input", { placeholder: "Your email" });
  const msgField = el("input", { placeholder: "Your message…" });
  const msg = el("div", { class: "form-success", style: "display:none" });
  const err = el("div", { class: "form-error", style: "display:none" });

  const submit = el("button", { class: "btn btn-primary", onclick: () => {
    err.style.display = "none"; msg.style.display = "none";
    if (!emailField.value.trim() || !validEmail(emailField.value.trim())) {
      err.textContent = "Please enter a valid email."; err.style.display = "block"; return;
    }
    if (!msgField.value.trim()) {
      err.textContent = "Please enter a message."; err.style.display = "block"; return;
    }
    msg.textContent = "Thanks for your feedback!"; msg.style.display = "block";
    emailField.value = ""; msgField.value = "";
  } }, icon("send"), " Send Feedback");

  const row = el("div", { class: "feedback-row" },
    el("div", { class: "field-inline" }, iconInline("mail"), emailField),
    el("div", { class: "field-inline" }, iconInline("message"), msgField),
    submit
  );

  section.appendChild(row);
  section.appendChild(msg);
  section.appendChild(err);
  return section;
}

// ---------------- LEADERBOARD ----------------
function renderLeaderboard() {
  const wrap = el("div", {});
  wrap.appendChild(el("div", { class: "topbar" },
    el("div", { class: "brand" }, "POKÉMON ", el("span", {}, "BATTLE ARENA"))
  ));

  const container = el("div", { class: "container", style: "padding-top:30px;padding-bottom:60px;" });
  container.appendChild(el("div", { class: "lb-title-row" }, icon("trophy"), el("h2", {}, "Leaderboard")));
  container.appendChild(el("p", { style: "margin-top:8px;" }, "Ranked by total battle points across completed matches."));

  const table = el("table", { class: "lb-table" });
  table.appendChild(el("thead", {}, el("tr", {},
    el("th", {}, "Rank"), el("th", {}, "Trainer"), el("th", {}, "Total Matches"), el("th", {}, "Wins"), el("th", {}, "Points")
  )));
  const tbody = el("tbody", {});
  const medalClass = ["gold", "silver", "bronze"];
  getLeaderboard().forEach((t, i) => {
    const isMe = APP.currentUser && APP.currentUser.username === t.username;
    const rank = i + 1;
    const rankCell = rank <= 3
      ? el("span", { class: `rank-medal ${medalClass[i]}` }, String(rank))
      : el("span", { class: "rank-cell" }, `#${rank}`);
    const avatarSeed = encodeURIComponent(t.username);
    tbody.appendChild(el("tr", { class: `${isMe ? "me" : ""} ${rank === 1 ? "rank-1" : ""}` },
      el("td", {}, rankCell),
      el("td", {}, el("div", { class: "trainer-cell" },
        el("img", { class: "trainer-avatar", src: `https://api.dicebear.com/7.x/adventurer/svg?seed=${avatarSeed}` }),
        el("span", {}, t.username.charAt(0).toUpperCase() + t.username.slice(1))
      )),
      el("td", {}, String(t.totalMatches)),
      el("td", {}, String(t.wins)),
      el("td", {}, el("div", { class: `points-cell ${t.points > 500 ? "hot" : ""}` }, el("span", { class: "flame", html: ICONS.flame }), t.points.toFixed(2)))
    ));
  });
  table.appendChild(tbody);
  container.appendChild(table);
  container.appendChild(el("div", { style: "text-align:center;margin-top:24px;" },
    el("button", { class: "btn", onclick: () => { APP.page = isLoggedIn() ? "dashboard" : "home"; render(); } }, "Back to Home")
  ));
  wrap.appendChild(container);
  return wrap;
}

// ---------------- DASHBOARD ----------------
function renderDashboard() {
  const wrap = el("div", { class: "dash-layout" });
  const sidebar = el("div", { class: "dash-sidebar" },
    el("div", { class: "brand" }, "POKÉMON ", el("span", {}, "BATTLE ARENA"))
  );
  const nav = el("div", { class: "dash-nav" });
  const items = [
    ["dashboard", "Dashboard"], ["create-team", "Create Team"], ["edit-team", "Edit Team"],
    ["pokedex", "Pokédex"], ["leaderboard-link", "Leaderboard"]
  ];
  items.forEach(([key, label]) => {
    if (key === "create-team" && APP.currentUser.team) return;
    if (key === "edit-team" && !APP.currentUser.team) return;
    nav.appendChild(el("button", {
      class: APP.dashboardSection === key ? "active" : "",
      onclick: () => {
        if (key === "leaderboard-link") { APP.page = "leaderboard"; render(); return; }
        if (key === "create-team") openTeamBuilder(null);
        if (key === "edit-team") openTeamBuilder(APP.currentUser.team);
        APP.dashboardSection = key; render();
      }
    }, label));
  });
  sidebar.appendChild(nav);
  sidebar.appendChild(el("button", { class: "logout-btn", onclick: logout }, "Logout"));
  wrap.appendChild(sidebar);

  const main = el("div", { class: "dash-main" });
  if (APP.dashboardSection === "dashboard") main.appendChild(renderDashboardHome());
  else if (APP.dashboardSection === "create-team" || APP.dashboardSection === "edit-team") main.appendChild(renderTeamBuilderSection());
  else if (APP.dashboardSection === "pokedex") main.appendChild(renderPokedexSection());
  wrap.appendChild(main);
  return wrap;
}

function renderDashboardHome() {

  // ----------------------------------------------------------
  // If dashboard data has not been loaded yet,
  // show a loading message and request it from the backend.
  // ----------------------------------------------------------

  if (
    !APP.dashboardData ||
    APP.dashboardData.username !== APP.currentUser.username
  ) {

    const container = el("div", {});

    container.appendChild(
      el(
        "div",
        { class: "card" },
        el("p", {}, "Loading dashboard...")
      )
    );

    API.getDashboard(APP.accessToken)
      .then((data) => {

        APP.dashboardData = data;

        render();

      })
      .catch((error) => {

        APP.dashboardData = {
          username: APP.currentUser.username,
          error: error.message
        };

        render();

      });

    return container;
  }


  // ----------------------------------------------------------
  // Backend dashboard data is now available.
  // ----------------------------------------------------------

  const dashboard = APP.dashboardData;

  const container = el("div", {});


  // ----------------------------------------------------------
  // Dashboard heading
  // ----------------------------------------------------------

  container.appendChild(
    el(
      "h2",
      {},
      `Welcome back, ${
        dashboard.username.charAt(0).toUpperCase() +
        dashboard.username.slice(1)
      }`
    )
  );


  // ----------------------------------------------------------
  // Handle dashboard API error
  // ----------------------------------------------------------

  if (dashboard.error) {

    container.appendChild(
      el(
        "div",
        { class: "card" },

        el(
          "p",
          {},
          `Could not load dashboard: ${dashboard.error}`
        ),

        el(
          "button",
          {
            class: "btn btn-primary",
            style: "margin-top:14px;",

            onclick: () => {
              APP.dashboardData = null;
              render();
            }
          },
          "Retry"
        )
      )
    );

    return container;
  }


  // ----------------------------------------------------------
  // Statistics
  // ----------------------------------------------------------

  const statGrid = el(
    "div",
    { class: "stat-grid" },

    el(
      "div",
      { class: "stat-card" },

      el(
        "div",
        { class: "label" },
        "Rank"
      ),

      el(
        "div",
        { class: "value" },
        `#${dashboard.rank}`
      )
    ),

    el(
      "div",
      { class: "stat-card" },

      el(
        "div",
        { class: "label" },
        "Total Matches"
      ),

      el(
        "div",
        { class: "value" },
        String(dashboard.total_matches)
      )
    ),

    el(
      "div",
      { class: "stat-card" },

      el(
        "div",
        { class: "label" },
        "Wins"
      ),

      el(
        "div",
        { class: "value" },
        String(dashboard.wins)
      )
    ),

    el(
      "div",
      { class: "stat-card" },

      el(
        "div",
        { class: "label" },
        "Points"
      ),

      el(
        "div",
        { class: "value" },
        Number(dashboard.points).toFixed(2)
      )
    )
  );

  container.appendChild(statGrid);


  // ----------------------------------------------------------
  // Last Battle
  // ----------------------------------------------------------

  container.appendChild(
    el(
      "div",
      { class: "section-title" },
      "Last Battle"
    )
  );


  if (dashboard.last_battle) {

    const lastBattle = dashboard.last_battle;

    container.appendChild(
      el(
        "div",
        { class: "card" },

        el(
          "span",
          {
            class: `status-pill ${lastBattle.status}`
          },
          lastBattle.status
        ),

        el(
          "div",
          { class: "last-battle-card" },

          el(
            "div",
            {},

            el(
              "div",
              { class: "label" },
              "Matches"
            ),

            el(
              "div",
              { class: "value" },
              String(lastBattle.matches)
            )
          ),

          el(
            "div",
            {},

            el(
              "div",
              { class: "label" },
              "Wins"
            ),

            el(
              "div",
              { class: "value" },
              String(lastBattle.wins)
            )
          ),

          el(
            "div",
            {},

            el(
              "div",
              { class: "label" },
              "Points"
            ),

            el(
              "div",
              { class: "value" },
              Number(lastBattle.points).toFixed(2)
            )
          )
        )
      )
    );

  } else {

    container.appendChild(
      el(
        "div",
        { class: "card" },
        el(
          "p",
          {},
          "No battles played yet."
        )
      )
    );
  }

  // ----------------------------------------------------------
  // Team section
  //
  // Team integration will be handled separately.
  // For now we leave the existing frontend team behaviour.
  // ----------------------------------------------------------

  container.appendChild(
    el(
      "div",
      { class: "section-title" },
      "Your Team"
    )
  );

  const team = APP.currentUser.team;


  if (team) {

    const grid = el(
      "div",
      { class: "team-grid-preview" }
    );

    team.forEach((entry) => {

      grid.appendChild(
        el(
          "div",
          { class: "mini-pokemon-card" },

          el(
            "img",
            {
              src: entry.pokemon.image,
              alt: entry.pokemon.displayName
            }
          ),

          el(
            "div",
            { class: "name" },
            entry.pokemon.displayName
          ),

          el(
            "div",
            { class: "types" },

            typeBadge(entry.pokemon.type1),

            entry.pokemon.type2
              ? typeBadge(entry.pokemon.type2)
              : null
          )
        )
      );

    });

    container.appendChild(grid);

    container.appendChild(
      el(
        "div",
        {
          style: "margin-top:18px;display:flex;gap:10px;"
        },

        el(
          "button",
          {
            class: "btn",

            onclick: () => {
              openTeamBuilder(team);
              APP.dashboardSection = "edit-team";
              render();
            }
          },
          "Edit Team"
        ),

        el(
          "button",
          {
            class: "btn btn-primary",

            onclick: () => startBattle(APP.currentUser)
          },
          "Start Battle"
        )
      )
    );

  } else {

    container.appendChild(
      el(
        "div",
        { class: "card" },

        el(
          "p",
          {},
          "You don't have a team yet."
        ),

        el(
          "button",
          {
            class: "btn btn-primary",
            style: "margin-top:14px;",

            onclick: () => {
              openTeamBuilder(null);
              APP.dashboardSection = "create-team";
              render();
            }
          },
          "Create Team"
        )
      )
    );
  }

  return container;
}