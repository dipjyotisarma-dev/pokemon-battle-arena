// ==========================================================
// TEAM-UI.JS — team builder & pokédex section rendering
// ==========================================================

function renderTeamBuilderSection() {
  const container = el("div", {});
  const isEdit = APP.dashboardSection === "edit-team";
  container.appendChild(el("h2", {}, isEdit ? "Edit Team" : "Create Team"));
  container.appendChild(el("p", { style: "margin-top:8px" }, "Select six Pokémon and four moves each. Only one Legendary, Mythical, or Ultra Beast allowed."));

  const grid = el("div", { class: "team-grid" });
  TeamBuilder.slots.forEach((slot, idx) => {
    if (slot) {
      grid.appendChild(el("div", { class: "team-slot filled" },
        el("img", { src: slot.pokemon.image, alt: slot.pokemon.displayName }),
        el("div", { class: "name" }, slot.pokemon.displayName),
        el("div", { class: "types" }, typeBadge(slot.pokemon.type1), slot.pokemon.type2 ? typeBadge(slot.pokemon.type2) : null),
        el("div", { class: "slot-actions" },
          el("button", { class: "btn btn-sm", onclick: () => openPokemonPicker(idx) }, "Replace"),
          el("button", { class: "btn btn-sm btn-ghost", onclick: () => { TeamBuilder.slots[idx] = null; render(); } }, "Remove")
        )
      ));
    } else {
      grid.appendChild(el("div", { class: "team-slot", onclick: () => openPokemonPicker(idx) },
        el("div", { class: "add-icon" }, "+"),
        el("div", { class: "add-label" }, "Add Pokémon")
      ));
    }
  });
  container.appendChild(grid);

  const errBox = el("div", { class: "form-error", style: "margin-top:16px;display:none" });
  container.appendChild(errBox);

  container.appendChild(el("div", { style: "margin-top:20px;display:flex;gap:10px;" },
    el("button", { class: "btn btn-primary", onclick: () => {
      const errors = saveTeam();
      if (errors.length > 0) {
        errBox.style.display = "block";
        errBox.textContent = errors.join(" ");
        return;
      }
      APP.dashboardSection = "dashboard";
      render();
    } }, isEdit ? "Save Changes" : "Save Team"),
    el("button", { class: "btn btn-ghost", onclick: () => { APP.dashboardSection = "dashboard"; render(); } }, "Cancel")
  ));

  return container;
}

function openPokemonPicker(slotIndex) {
  TeamBuilder.activeSlotIndex = slotIndex;
  TeamBuilder.pickerSearch = "";
  Modal.current = "picker";
  render();
}

function renderPickerModal() {
  const idx = TeamBuilder.activeSlotIndex;
  const modal = el("div", { class: "modal modal-wide" });
  modal.appendChild(el("div", { class: "modal-header" },
    el("h3", {}, "Choose a Pokémon"),
    el("button", { class: "modal-close", onclick: closeModal }, "×")
  ));

  const search = el("input", { placeholder: "Search Pokémon…", value: TeamBuilder.pickerSearch, style: "width:100%;padding:10px 13px;background:var(--surface-2);border:1px solid var(--border);border-radius:6px;color:var(--text);margin-bottom:14px;" });
  search.addEventListener("input", () => { TeamBuilder.pickerSearch = search.value; refreshPickerList(); });
  modal.appendChild(search);

  const list = el("div", { class: "picker-list", id: "picker-list" });
  modal.appendChild(list);
  setTimeout(() => populatePickerList(list, idx), 0);
  return modal;
}

function refreshPickerList() {
  const list = $("#picker-list");
  if (list) populatePickerList(list, TeamBuilder.activeSlotIndex);
}

function populatePickerList(list, idx) {

  // ----------------------------------------------------------
  // Clear the existing picker list
  // ----------------------------------------------------------

  list.innerHTML = "";

  // ----------------------------------------------------------
  // Get the current search text
  // ----------------------------------------------------------

  const q = TeamBuilder.pickerSearch.toLowerCase();

  // ----------------------------------------------------------
  // Filter the existing frontend Pokémon list.
  //
  // We are keeping the existing UI list for now.
  // The actual Pokémon ID and moves will come from
  // the backend when the trainer selects one.
  // ----------------------------------------------------------

  POKEMON
    .filter((pokemon) =>
      pokemon.displayName
        .toLowerCase()
        .includes(q)
    )
    .forEach((pokemon) => {

      // ------------------------------------------------------
      // Check duplicate Pokémon rule
      // ------------------------------------------------------

      const dup = teamHasDuplicate(
        TeamBuilder.slots,
        idx,
        pokemon.id
      );


      // ------------------------------------------------------
      // Check Legendary / Mythical / Ultra Beast rule
      // ------------------------------------------------------

      const restrictedConflict =
        teamHasRestrictedConflict(
          TeamBuilder.slots,
          idx,
          pokemon
        );


      const disabled =
        dup || restrictedConflict;


      // ------------------------------------------------------
      // Create picker row
      // ------------------------------------------------------

      const row = el(
        "div",
        {
          class: `picker-row ${
            disabled ? "disabled" : ""
          }`
        },

        el(
          "img",
          {
            src: pokemon.image,
            alt: pokemon.displayName
          }
        ),

        el(
          "div",
          { class: "picker-name" },

          pokemon.displayName,

          el(
            "div",
            {
              style:
                "font-size:11px;" +
                "color:var(--text-faint);" +
                "margin-top:2px;"
            },

            `BST ${pokemon.bst} · ${
              categoryTag(pokemon.category)
            }`
          )
        ),

        typeBadge(pokemon.type1),

        pokemon.type2
          ? typeBadge(pokemon.type2)
          : null
      );


      // ------------------------------------------------------
      // Do not allow invalid selections
      // ------------------------------------------------------

      if (disabled) {
        list.appendChild(row);
        return;
      }


      // ------------------------------------------------------
      // Pokémon selection
      //
      // The frontend Pokémon object is NOT saved directly.
      // We first retrieve the real Pokémon from the backend.
      // ------------------------------------------------------

      row.addEventListener(
        "click",
        async () => {

          // --------------------------------------------------
          // Prevent repeated clicks while loading
          // --------------------------------------------------

          row.style.pointerEvents = "none";
          row.style.opacity = "0.6";


          try {

            // ------------------------------------------------
            // Find the Pokémon using its real backend data.
            //
            // We search by name because the frontend demo
            // ID is not necessarily the real Pokédex ID.
            // ------------------------------------------------

            const searchResults =
              await API.searchPokemon(
                pokemon.displayName
              );


            if (
              !searchResults ||
              searchResults.length === 0
            ) {
              throw new Error(
                `Could not find ${pokemon.displayName} in the backend.`
              );
            }


            // ------------------------------------------------
            // Use the first exact-name match.
            // ------------------------------------------------

            const backendSearchResult =
              searchResults.find(
                (result) =>
                  result.display_name.toLowerCase() ===
                  pokemon.displayName.toLowerCase()
              ) || searchResults[0];


            // ------------------------------------------------
            // Get complete Pokémon information using the
            // REAL backend Pokédex ID.
            // ------------------------------------------------

            const backendPokemon =
              await API.getPokemon(
                backendSearchResult.id
              );


            // ------------------------------------------------
            // Get all moves this Pokémon can actually learn.
            // ------------------------------------------------

            const backendMoves =
              await API.getPokemonMoves(
                backendPokemon.id
              );


            if (
              !backendMoves ||
              backendMoves.length < 4
            ) {
              throw new Error(
                `${backendPokemon.display_name} does not have enough available moves.`
              );
            }


            // ------------------------------------------------
            // Convert backend Pokémon into the structure
            // already expected by the frontend team builder.
            // ------------------------------------------------

            const frontendPokemon = {

              id: backendPokemon.id,

              name: backendPokemon.name,

              displayName:
                backendPokemon.display_name,


              type1:
                backendPokemon.type1,

              type2:
                backendPokemon.type2,


              hp:
                backendPokemon.hp,

              attack:
                backendPokemon.attack,

              defense:
                backendPokemon.defense,

              specialAttack:
                backendPokemon.special_attack,

              specialDefense:
                backendPokemon.special_defense,

              speed:
                backendPokemon.speed,


              bst:
                backendPokemon.bst,


              category:
                backendPokemon.pokemon_category,


              // ----------------------------------------------
              // Use the local frontend image.
              // ----------------------------------------------

              image:
                `assets/images/pokemon/${backendPokemon.image}`,


              // ----------------------------------------------
              // Convert backend moves to the structure
              // expected by renderMoveModal().
              // ----------------------------------------------

              moves:
                backendMoves.map((move) => ({
                  id:
                    String(move.id),

                  name:
                    move.move_name,

                  displayName:
                    move.display_name,

                  type:
                    move.move_type,

                  category:
                    move.category,

                  basePower:
                    move.base_power
                }))
            };


            // ------------------------------------------------
            // Store the real backend Pokémon.
            // ------------------------------------------------

            TeamBuilder.pendingPokemon =
              frontendPokemon;


            // ------------------------------------------------
            // Reset move selection for this Pokémon.
            // ------------------------------------------------

            TeamBuilder.pendingMoves = [];


            // ------------------------------------------------
            // Keep the current slot.
            // ------------------------------------------------

            TeamBuilder.activeSlotIndex = idx;


            // ------------------------------------------------
            // Move to the existing move-selection modal.
            // ------------------------------------------------

            Modal.current = "moves";

            render();

          } catch (error) {

            // ------------------------------------------------
            // Restore the row if loading failed.
            // ------------------------------------------------

            row.style.pointerEvents = "";
            row.style.opacity = "";


            console.error(
              "Failed to load Pokémon:",
              error
            );


            // ------------------------------------------------
            // Show a simple error without changing the
            // existing modal architecture.
            // ------------------------------------------------

            row.classList.add("disabled");

            row.title =
              error.message ||
              "Could not load Pokémon data.";
          }
        }
      );


      // ------------------------------------------------------
      // Add row to picker
      // ------------------------------------------------------

      list.appendChild(row);

    });
}

function renderMoveModal() {
  const p = TeamBuilder.pendingPokemon;
  const modal = el("div", { class: "modal" });
  modal.appendChild(el("div", { class: "modal-header" },
    el("h3", {}, `Select moves — ${p.displayName}`),
    el("button", { class: "modal-close", onclick: closeModal }, "×")
  ));

  modal.appendChild(el("div", { style: "display:flex;gap:14px;align-items:center;margin-bottom:14px;" },
    el("img", { src: p.image, style: "width:56px;height:56px;object-fit:contain;" }),
    el("div", {}, typeBadge(p.type1), p.type2 ? typeBadge(p.type2) : null)
  ));

  const list = el("div", { class: "move-list" });
  p.moves.forEach(m => {
    const selected = TeamBuilder.pendingMoves.includes(m);
    const row = el("div", { class: `move-row ${selected ? "selected" : ""}` },
      el("span", {}, `${m.displayName} (${m.type})`),
      el("span", { class: "move-power" }, `${m.category === "physical" ? "PHY" : "SPC"} · ${m.basePower} BP`)
    );
    row.addEventListener("click", () => {
      if (selected) {
        TeamBuilder.pendingMoves = TeamBuilder.pendingMoves.filter(x => x !== m);
      } else if (TeamBuilder.pendingMoves.length < 4) {
        TeamBuilder.pendingMoves.push(m);
      }
      render();
    });
    list.appendChild(row);
  });
  modal.appendChild(list);

  const err = el("div", { class: "form-error", style: "display:none;margin-top:10px;" });
  modal.appendChild(err);

  modal.appendChild(el("div", { style: "margin-top:18px;display:flex;gap:10px;" },
    el("button", { class: "btn btn-primary", onclick: () => {
      if (TeamBuilder.pendingMoves.length !== 4) {
        err.textContent = "Please select exactly four moves.";
        err.style.display = "block";
        return;
      }
      TeamBuilder.slots[TeamBuilder.activeSlotIndex] = { pokemon: p, moves: [...TeamBuilder.pendingMoves] };
      Modal.current = null;
      render();
    } }, "Save Pokémon"),
    el("button", { class: "btn btn-ghost", onclick: closeModal }, "Cancel")
  ));

  return modal;
}

// ---------------- POKÉDEX ----------------
function renderPokedexSection() {
  const container = el("div", {});
  container.appendChild(el("h2", {}, "Pokédex"));

  const toolbar = el("div", { class: "pokedex-toolbar" });
  const search = el("input", { placeholder: "Search Pokémon…", value: Pokedex.search });
  search.addEventListener("input", () => { Pokedex.search = search.value; refreshPokedexGrid(); });
  const typeSel = el("select", {});
  typeSel.appendChild(el("option", { value: "" }, "All Types"));
  Object.keys(TYPE_COLORS).forEach(t => typeSel.appendChild(el("option", { value: t }, t.charAt(0).toUpperCase() + t.slice(1))));
  typeSel.value = Pokedex.typeFilter;
  typeSel.addEventListener("change", () => { Pokedex.typeFilter = typeSel.value; refreshPokedexGrid(); });
  toolbar.appendChild(search);
  toolbar.appendChild(typeSel);
  container.appendChild(toolbar);

  const grid = el("div", { class: "pokedex-grid", id: "dex-grid" });
  container.appendChild(grid);
  setTimeout(() => populatePokedexGrid(grid), 0);
  return container;
}

function refreshPokedexGrid() {
  const grid = $("#dex-grid");
  if (grid) populatePokedexGrid(grid);
}

function populatePokedexGrid(grid) {
  grid.innerHTML = "";
  filteredPokedex().forEach(p => {
    const card = el("div", { class: "dex-card" },
      el("img", { src: p.image, alt: p.displayName }),
      el("div", { class: "name" }, p.displayName),
      el("div", { class: "cat" }, categoryTag(p.category)),
      el("div", { class: "types" }, typeBadge(p.type1), p.type2 ? typeBadge(p.type2) : null),
      el("div", { class: "bst" }, `BST ${p.bst}`)
    );
    card.addEventListener("click", () => { Pokedex.selected = p; Modal.current = "dexdetail"; render(); });
    grid.appendChild(card);
  });
}

function renderDexDetailModal() {
  const p = Pokedex.selected;
  const modal = el("div", { class: "modal" });
  modal.appendChild(el("div", { class: "modal-header" },
    el("h3", {}, p.displayName),
    el("button", { class: "modal-close", onclick: closeModal }, "×")
  ));
  modal.appendChild(el("div", { style: "text-align:center;margin-bottom:14px;" },
    el("img", { src: p.image, style: "width:100px;height:100px;object-fit:contain;" }),
    el("div", { style: "margin-top:8px;" }, typeBadge(p.type1), p.type2 ? typeBadge(p.type2) : null),
    el("div", { style: "font-size:12px;color:var(--text-faint);margin-top:6px;" }, `${categoryTag(p.category)} · BST ${p.bst}`)
  ));
  modal.appendChild(statBar("HP", p.hp));
  modal.appendChild(statBar("Attack", p.attack));
  modal.appendChild(statBar("Defense", p.defense));
  modal.appendChild(statBar("Sp. Atk", p.specialAttack));
  modal.appendChild(statBar("Sp. Def", p.specialDefense));
  modal.appendChild(statBar("Speed", p.speed));

  modal.appendChild(el("div", { class: "section-title" }, "Available Moves"));
  const list = el("div", { class: "move-list" });
  p.moves.forEach(m => {
    list.appendChild(el("div", { class: "move-row" },
      el("span", {}, `${m.displayName} (${m.type})`),
      el("span", { class: "move-power" }, `${m.category === "physical" ? "PHY" : "SPC"} · ${m.basePower} BP`)
    ));
  });
  modal.appendChild(list);
  return modal;
}
