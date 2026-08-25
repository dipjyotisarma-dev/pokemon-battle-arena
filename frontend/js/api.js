(function () {
  // Small API client wrapper for the FastAPI backend.
  // Exposes window.Api with methods for auth, trainer, team, pokemon and leaderboard.

  class ApiError extends Error {
    constructor(message, { status = null, statusText = null, body = null } = {}) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.statusText = statusText;
      this.body = body;
    }
  }

  /* ============================================================
     API CONFIGURATION
     Configure the backend API URL for local development and production.
     When deploying to Vercel, replace PRODUCTION_API_URL below with
     your actual Render backend URL (e.g., 'https://pokemon-battle-arena.onrender.com').
     ============================================================ */
  const PRODUCTION_API_URL = ''; // <-- INSERT YOUR RENDER BACKEND URL HERE (e.g. 'https://your-service.onrender.com')

  function resolveBaseUrl() {
    // 1. Explicit runtime override if injected via window.API_BASE_URL
    if (typeof window !== 'undefined' && window.API_BASE_URL) {
      return String(window.API_BASE_URL).replace(/\/+$/, '');
    }

    // 2. Local development detection (localhost / 127.0.0.1 / 0.0.0.0)
    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname;
      if (hostname === 'localhost') {
        return 'http://localhost:8000';
      }
      if (hostname === '127.0.0.1' || hostname === '0.0.0.0') {
        return 'http://127.0.0.1:8000';
      }
    }

    // 3. Production Render backend URL configured above
    if (PRODUCTION_API_URL && PRODUCTION_API_URL.trim()) {
      return PRODUCTION_API_URL.trim().replace(/\/+$/, '');
    }

    // 4. Default local fallback
    return 'http://127.0.0.1:8000';
  }

  const ApiConfig = {
    baseUrl: resolveBaseUrl(),
  };

  function setBaseUrl(url) {
    if (url) {
      ApiConfig.baseUrl = String(url).replace(/\/+$/, '');
    }
  }

  async function fetchWrapper(method, endpoint, { body = null, form = false, headers = {} } = {}) {
    const url = ApiConfig.baseUrl + endpoint;

    const opts = {
      method: method.toUpperCase(),
      credentials: 'include',
      headers: {
        ...headers,
      },
    };

    // Attach token from session if available in memory
    if (window.Session && typeof window.Session.getToken === 'function') {
      const token = window.Session.getToken();
      if (token) {
        opts.headers['Authorization'] = 'Bearer ' + token;
      }
    }

    if (form) {
      // body is expected to be a plain object -> form-urlencoded
      opts.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      opts.body = new URLSearchParams(body).toString();
    } else if (body !== null) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }

    let resp;
    try {
      resp = await fetch(url, opts);
    } catch (err) {
      // Network error
      throw new ApiError('Network error', { body: err, status: null, statusText: null });
    }

    const contentType = resp.headers.get('content-type') || '';
    let parsedBody = null;
    if (contentType.includes('application/json')) {
      try {
        parsedBody = await resp.json();
      } catch (err) {
        parsedBody = null;
      }
    } else {
      // try plain text
      try {
        parsedBody = await resp.text();
      } catch (err) {
        parsedBody = null;
      }
    }

    if (!resp.ok) {
      // Create a helpful error with status and body
      const message = parsedBody && parsedBody.detail ? parsedBody.detail : resp.statusText || 'API Error';
      throw new ApiError(message, { status: resp.status, statusText: resp.statusText, body: parsedBody });
    }

    return { status: resp.status, data: parsedBody };
  }

  // API function implementations
  const Api = {
    // Configuration
    config: ApiConfig,
    setBaseUrl,

    // AUTH
    async register({ username, email, password }) {
      return fetchWrapper('POST', '/auth/register', { body: { username, email, password } });
    },

    // login must send x-www-form-urlencoded to match OAuth2PasswordRequestForm
    async login({ username, password }) {
      // backend expects username + password form fields
      return fetchWrapper('POST', '/auth/login', { form: true, body: { username, password } });
    },

    async logout() {
      return fetchWrapper('POST', '/auth/logout');
    },

    async getCurrentUser() {
      return fetchWrapper('GET', '/auth/me');
    },

    // TRAINER
    async getDashboard() {
      return fetchWrapper('GET', '/trainer/dashboard');
    },

    async getTrainerDashboard() {
      return fetchWrapper('GET', '/trainer/dashboard');
    },

    // TEAM
    async createTeam(teamPayload) {
      return fetchWrapper('POST', '/team', { body: teamPayload });
    },

    async getTeam() {
      return fetchWrapper('GET', '/team');
    },

    async updateTeam(teamPayload) {
      return fetchWrapper('PUT', '/team', { body: teamPayload });
    },

    async getMoveOptions(pokemonId) {
      return fetchWrapper('GET', `/team/${encodeURIComponent(pokemonId)}/move-options`);
    },

    // POKEMON
    async getAllPokemon() {
      return fetchWrapper('GET', '/pokemon');
    },

    async searchPokemon({ q = null, pokemon_id = null, limit = 10 } = {}) {
      const params = new URLSearchParams();
      if (q !== null) params.append('q', q);
      if (pokemon_id !== null) params.append('pokemon_id', String(pokemon_id));
      if (limit !== null) params.append('limit', String(limit));
      const endpoint = '/pokemon/search' + (params.toString() ? `?${params.toString()}` : '');
      return fetchWrapper('GET', endpoint);
    },

    async getPokemon(pokemonId) {
      return fetchWrapper('GET', `/pokemon/${encodeURIComponent(pokemonId)}`);
    },

    async getPokemonMoves(pokemonId) {
      return fetchWrapper('GET', `/pokemon/${encodeURIComponent(pokemonId)}/moves`);
    },

    // LEADERBOARD
    async getLeaderboard() {
      return fetchWrapper('GET', '/leaderboard');
    },

    // BATTLE
    async startBattle() {
      return fetchWrapper('POST', '/battle/start');
    },

    async startMatch(battleId) {
      return fetchWrapper('POST', `/battle/${encodeURIComponent(battleId)}/start-match`);
    },

    async selectBattlePokemon(battleId, trainerSlot) {
      return fetchWrapper('POST', `/battle/${encodeURIComponent(battleId)}/select-pokemon`, {
        body: { trainer_slot: Number(trainerSlot) },
      });
    },

    async backToSelection(battleId) {
      return fetchWrapper('POST', `/battle/${encodeURIComponent(battleId)}/back-to-selection`);
    },

    async continueBattle(battleId) {
      return fetchWrapper('POST', `/battle/${encodeURIComponent(battleId)}/continue`);
    },

    async executeMove(battleId, moveId) {
      return fetchWrapper('POST', `/battle/${encodeURIComponent(battleId)}/move`, {
        body: { move_id: Number(moveId) },
      });
    },

    async exitBattle(battleId) {
      return fetchWrapper('POST', `/battle/${encodeURIComponent(battleId)}/exit`);
    },
  };

  // Expose on window
  if (!window.Api) window.Api = Api;
})();
