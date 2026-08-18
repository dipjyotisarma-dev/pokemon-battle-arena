(function () {
  // Session manager that persists JWT in sessionStorage (key: battleArenaToken)
  // and keeps an in-memory copy for fast access. Exposes both the new
  // saveToken/getToken/clearToken/isAuthenticated API and legacy aliases
  // for backward compatibility (setToken/clearSession).

  const STORAGE_KEY = 'battleArenaToken';

  const _state = {
    token: null,
    currentUser: null,
  };

  // Initialize in-memory token from sessionStorage when the script loads
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      _state.token = stored;
    }
  } catch (e) {
    // If sessionStorage is unavailable for any reason, fall back to memory-only
    _state.token = null;
  }

  // Save token to sessionStorage and sync in-memory state
  function saveToken(token) {
    _state.token = token;
    try {
      if (token === null || token === undefined) {
        sessionStorage.removeItem(STORAGE_KEY);
      } else {
        sessionStorage.setItem(STORAGE_KEY, token);
      }
    } catch (e) {
      // ignore storage errors but keep in-memory token
    }
  }

  // Backwards-compatible alias
  function setToken(token) {
    return saveToken(token);
  }

  // Returns the in-memory token (kept in sync with sessionStorage)
  function getToken() {
    return _state.token;
  }

  // Clear token from sessionStorage and from memory
  function clearToken() {
    _state.token = null;
    _state.currentUser = null;
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  }

  // Backwards-compatible alias
  function clearSession() {
    return clearToken();
  }

  function isAuthenticated() {
    return Boolean(_state.token);
  }

  function setCurrentUser(user) {
    _state.currentUser = user;
  }

  function getCurrentUser() {
    return _state.currentUser;
  }

  const Session = {
    // Preferred API
    saveToken,
    getToken,
    clearToken,
    isAuthenticated,
    // Backwards-compatible names used elsewhere in the app
    setToken,
    clearSession,
    // User info helpers (unchanged)
    setCurrentUser,
    getCurrentUser,
  };

  if (!window.Session) window.Session = Session;
})();