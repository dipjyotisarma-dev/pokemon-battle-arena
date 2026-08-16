// ==========================================================
// UTILS.JS — shared helpers
// ==========================================================

function $(sel, root = document) { return root.querySelector(sel); }
function $all(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined) node.setAttribute(k, v);
  }
  children.flat().forEach(c => {
    if (c === null || c === undefined) return;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  });
  return node;
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function typeBadge(type) {
  return el("span", { class: "type-badge", style: `background:${TYPE_COLORS[type]}22;color:${TYPE_COLORS[type]};border:1px solid ${TYPE_COLORS[type]}55` }, type.toUpperCase());
}

function statBar(label, value, max = 180) {
  const pct = Math.min(100, (value / max) * 100);
  return el("div", { class: "stat-row" },
    el("span", { class: "stat-label" }, label),
    el("div", { class: "stat-track" }, el("div", { class: "stat-fill", style: `width:${pct}%` })),
    el("span", { class: "stat-value" }, String(value))
  );
}

function categoryTag(category) {
  const map = { legendary: "Legendary", mythical: "Mythical", "ultra-beast": "Ultra Beast", "pseudo-legendary": "Pseudo-Legendary", normal: "Standard" };
  return map[category] || category;
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function delay(ms) { return new Promise(res => setTimeout(res, ms)); }

function battleMaxHP(pokemon) {
  return Math.round(pokemon.hp * 3 + Math.floor(pokemon.bst / 2));
}

function typeEffectiveness(moveType, defenderTypes) {
  // simplified effectiveness chart covering common relationships
  const chart = {
    fire: { grass: 2, water: 0.5, fire: 0.5, ice: 2, bug: 2, rock: 0.5, steel: 2 },
    water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2 },
    grass: { water: 2, grass: 0.5, fire: 0.5, poison: 0.5, ground: 2, rock: 2, flying: 0.5, bug: 0.5, dragon: 0.5, steel: 0.5 },
    electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
    ice: { grass: 2, ice: 0.5, water: 0.5, ground: 2, flying: 2, dragon: 2, fire: 0.5, steel: 0.5 },
    fighting: { normal: 2, ice: 2, rock: 2, dark: 2, steel: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, fairy: 0.5, ghost: 0 },
    ground: { fire: 2, electric: 2, poison: 2, rock: 2, steel: 2, grass: 0.5, bug: 0.5, flying: 0 },
    flying: { grass: 2, fighting: 2, bug: 2, electric: 0.5, rock: 0.5, steel: 0.5 },
    psychic: { fighting: 2, poison: 2, psychic: 0.5, steel: 0.5, dark: 0 },
    bug: { grass: 2, psychic: 2, dark: 2, fire: 0.5, fighting: 0.5, poison: 0.5, flying: 0.5, ghost: 0.5, steel: 0.5, fairy: 0.5 },
    rock: { fire: 2, ice: 2, flying: 2, bug: 2, fighting: 0.5, ground: 0.5, steel: 0.5 },
    ghost: { ghost: 2, psychic: 2, dark: 0.5, normal: 0 },
    dragon: { dragon: 2, steel: 0.5, fairy: 0 },
    dark: { psychic: 2, ghost: 2, dark: 0.5, fighting: 0.5, fairy: 0.5 },
    steel: { ice: 2, rock: 2, fairy: 2, fire: 0.5, water: 0.5, electric: 0.5, steel: 0.5 },
    poison: { grass: 2, fairy: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0 },
    normal: { rock: 0.5, ghost: 0, steel: 0.5 },
    fairy: { fighting: 2, dragon: 2, dark: 2, fire: 0.5, poison: 0.5, steel: 0.5 }
  };
  let mult = 1;
  const row = chart[moveType] || {};
  defenderTypes.filter(Boolean).forEach(t => { if (t in row) mult *= row[t]; });
  return mult;
}
