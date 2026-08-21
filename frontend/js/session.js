(function () {
  // In-memory session helper.
  // Strictly in-memory: no localStorage, sessionStorage, or IndexedDB.
  // Browser authentication is handled automatically via HttpOnly cookies across pages.

  const _state = {
    token: null,
    currentUser: null,
  };

  function saveToken(token) {
    _state.token = token || null;
  }

  function setToken(token) {
    return saveToken(token);
  }

  function getToken() {
    return _state.token;
  }

  function clearToken() {
    _state.token = null;
    _state.currentUser = null;
  }

  function clearSession() {
    return clearToken();
  }

  function isAuthenticated() {
    return Boolean(_state.token || _state.currentUser);
  }

  function setCurrentUser(user) {
    _state.currentUser = user || null;
  }

  function getCurrentUser() {
    return _state.currentUser;
  }

  const Session = {
    saveToken,
    getToken,
    clearToken,
    isAuthenticated,
    setToken,
    clearSession,
    setCurrentUser,
    getCurrentUser,
  };

  if (!window.Session) window.Session = Session;
})();