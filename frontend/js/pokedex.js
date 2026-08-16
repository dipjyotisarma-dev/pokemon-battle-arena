// ==========================================================
// POKEDEX.JS — Pokédex search & filter state
// ==========================================================

const Pokedex = {
  search: "",
  typeFilter: ""
};

function filteredPokedex() {
  return POKEMON.filter(p => {
    const matchesSearch = p.displayName.toLowerCase().includes(Pokedex.search.toLowerCase());
    const matchesType = !Pokedex.typeFilter || p.type1 === Pokedex.typeFilter || p.type2 === Pokedex.typeFilter;
    return matchesSearch && matchesType;
  });
}
