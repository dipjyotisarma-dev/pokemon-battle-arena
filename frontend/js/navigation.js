/* ============================================================
   NAVIGATION SESSION
   ------------------------------------------------------------
   Purpose:
   - Preserve the current page across refreshes.
   - Preserve navigation/auth state only for the current tab.
   - A newly opened tab must start from the home page.
   - Authentication itself remains handled by the FastAPI
     HttpOnly cookie + Session module.
   ============================================================ */

const NavigationSession = (() => {
  const PAGE_KEY = 'pokemon_arena_current_page';
  const ACTIVE_KEY = 'pokemon_arena_active_session';

  function setCurrentPage(page) {
    if (!page) return;

    try {
      sessionStorage.setItem(PAGE_KEY, page);
    } catch (err) {
      console.warn('[NAVIGATION] Unable to save current page:', err);
    }
  }

  function getCurrentPage() {
    try {
      return sessionStorage.getItem(PAGE_KEY);
    } catch (err) {
      console.warn('[NAVIGATION] Unable to read current page:', err);
      return null;
    }
  }

  function startSession() {
    try {
      sessionStorage.setItem(ACTIVE_KEY, 'true');
    } catch (err) {
      console.warn('[NAVIGATION] Unable to start navigation session:', err);
    }
  }

  function isSessionActive() {
    try {
      return sessionStorage.getItem(ACTIVE_KEY) === 'true';
    } catch (err) {
      console.warn('[NAVIGATION] Unable to read navigation session:', err);
      return false;
    }
  }

  function clear() {
    try {
      sessionStorage.removeItem(PAGE_KEY);
      sessionStorage.removeItem(ACTIVE_KEY);
    } catch (err) {
      console.warn('[NAVIGATION] Unable to clear navigation session:', err);
    }
  }

  return {
    setCurrentPage,
    getCurrentPage,
    startSession,
    isSessionActive,
    clear,
  };
})();

if (typeof window !== 'undefined' && !window.NavigationSession) {
  window.NavigationSession = NavigationSession;
}