(function () {
  // In-memory session manager. Stores token and current user only in memory.
  // Exposes window.Session with simple getters/setters.

  const _state = {
    token: null,
    currentUser: null,
  };

  function setToken(token) {
    _state.token = token;
  }

  function getToken() {
    return _state.token;
  }

  function clearSession() {
    _state.token = null;
    _state.currentUser = null;
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
    setToken,
    getToken,
    clearSession,
    isAuthenticated,
    setCurrentUser,
    getCurrentUser,
  };

  if (!window.Session) window.Session = Session;
})();