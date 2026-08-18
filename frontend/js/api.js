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

  const ApiConfig = {
    // Default - change here to switch between 127.0.0.1 and localhost
    baseUrl: 'http://127.0.0.1:8000',
  };

  function setBaseUrl(url) {
    ApiConfig.baseUrl = url;
  }

  async function fetchWrapper(method, endpoint, { body = null, form = false, headers = {} } = {}) {
    const url = ApiConfig.baseUrl + endpoint;

    const opts = {
      method: method.toUpperCase(),
      headers: {
        ...headers,
      },
    };

    // Attach token from session if available
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

    async getCurrentUser() {
      return fetchWrapper('GET', '/auth/me');
    },

    // TRAINER
    async getDashboard() {
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
  };

  // Expose on window
  if (!window.Api) window.Api = Api;
})();
