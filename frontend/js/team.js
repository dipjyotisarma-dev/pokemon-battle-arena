// ==========================================================
// TEAM.JS — team creation / editing
// ==========================================================

const TeamBuilder = {
  slots: [null, null, null, null, null, null], // { pokemon, moves: [] }
  activeSlotIndex: null,
  pickerSearch: "",
  pickerType: "",
  pendingPokemon: null,
  pendingMoves: []
};

function openTeamBuilder(existingTeam) {
  TeamBuilder.slots = existingTeam ? existingTeam.map(e => ({ pokemon: e.pokemon, moves: [...e.moves] })) : [null, null, null, null, null, null];
}

function teamHasRestrictedConflict(slots, excludeIndex, candidate) {
  if (!isRestrictedCategory(candidate)) return false;
  return slots.some((s, i) => i !== excludeIndex && s && isRestrictedCategory(s.pokemon));
}

function teamHasDuplicate(slots, excludeIndex, candidateId) {
  return slots.some((s, i) => i !== excludeIndex && s && s.pokemon.id === candidateId);
}

function validateTeam(slots) {
  const errors = [];
  const filled = slots.filter(Boolean);
  if (filled.length < 6) errors.push("Your team must contain exactly six Pokémon.");
  const incomplete = filled.filter(s => s.moves.length !== 4);
  if (incomplete.length > 0) errors.push("Every Pokémon must have exactly four moves selected.");
  const ids = filled.map(s => s.pokemon.id);
  if (new Set(ids).size !== ids.length) errors.push("Your team cannot contain duplicate Pokémon.");
  const restrictedCount = filled.filter(s => isRestrictedCategory(s.pokemon)).length;
  if (restrictedCount > 1) errors.push("Your team can contain only one Legendary, Mythical, or Ultra Beast.");
  return errors;
}

function saveTeam() {
  const errors = validateTeam(TeamBuilder.slots);
  if (errors.length > 0) return errors;
  APP.currentUser.team = TeamBuilder.slots.map(s => ({ pokemon: s.pokemon, moves: s.moves }));
  return [];
}
