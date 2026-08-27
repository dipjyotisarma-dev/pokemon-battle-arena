/* ============================================================
   AUTH
   Integrated with FastAPI backend.
   Authentication is maintained across page loads via HttpOnly
   access_token cookies set by the backend on login.
   No localStorage, sessionStorage, or IndexedDB is used.
   ============================================================ */

/** @type {number|null} */
let currentTrainerId = null;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email) {
  return EMAIL_PATTERN.test((email || '').trim());
}

function isValidPassword(password) {
  // Minimum 8 chars, at least one letter and one number.
  return (password || '').length >= 8 && /[A-Za-z]/.test(password) && /[0-9]/.test(password);
}

/**
 * Validates a registration payload format.
 * Returns a map of field -> error message. Empty object means valid.
 */
function validateRegistration({ username, email, password }) {
  const errors = {};

  if (!username || !username.trim()) {
    errors.username = 'Trainer name is required.';
  }

  if (!email || !email.trim()) {
    errors.email = 'Email is required.';
  } else if (!isValidEmail(email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!password) {
    errors.password = 'Password is required.';
  } else if (!isValidPassword(password)) {
    errors.password = 'Use at least 8 characters, with a letter and a number.';
  }

  return errors;
}

// Helper to dynamically load session/api scripts if not already loaded
function _loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.readyState === 'complete' || existing.readyState === 'loaded') {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', (e) => reject(e));
      return;
    }

    const s = document.createElement('script');
    s.src = src;
    s.async = false;
    s.onload = () => resolve();
    s.onerror = (e) => reject(e);
    document.head.appendChild(s);
  });
}

async function ensureApiLoaded() {
  if (!window.Session) {
    await _loadScript('js/session.js');
  }
  if (!window.Api) {
    await _loadScript('js/api.js');
  }
}

/**
 * Registers a trainer using the FastAPI backend API.
 * Returns a Promise resolving to { success: boolean, trainer?, errors?, error? }
 */
async function registerTrainer({ username, email, password }) {
  const clientSideErrors = validateRegistration({ username, email, password });
  if (Object.keys(clientSideErrors).length > 0) {
    return { success: false, errors: clientSideErrors };
  }

  try {
    await ensureApiLoaded();
    const resp = await window.Api.register({
      username: (username || '').trim(),
      email: (email || '').trim(),
      password,
    });

    if (resp && resp.data) {
      return { success: true, trainer: resp.data };
    }
    return { success: false, error: 'Unexpected response from server.' };
  } catch (err) {
    if (err && err.name === 'ApiError') {
      const detail = (err.body && err.body.detail) ? err.body.detail : err.message;
      if (err.status === 409) {
        if (detail.toLowerCase().includes('username')) {
          return { success: false, errors: { username: detail } };
        }
        if (detail.toLowerCase().includes('email')) {
          return { success: false, errors: { email: detail } };
        }
        return { success: false, error: detail };
      }
      if (err.status === 422) {
        return { success: false, error: detail || 'Invalid registration details.' };
      }
      return { success: false, error: detail || 'Registration failed.' };
    }
    return { success: false, error: 'Cannot connect to the server. Make sure the backend is running.' };
  }
}

/**
 * Logs a trainer in using the backend's OAuth2 password flow.
 * FastAPI sets the HttpOnly access_token cookie automatically.
 * Returns a Promise resolving to { success: boolean, trainer?, error? }
 */
async function loginTrainer({ identifier, password }) {
  if (!identifier || !identifier.trim()) {
    return { success: false, error: 'Trainer name or email is required.' };
  }
  if (!password) {
    return { success: false, error: 'Password is required.' };
  }

  try {
    await ensureApiLoaded();
    const loginResp = await window.Api.login({ username: identifier.trim(), password });
    const token = loginResp && loginResp.data && loginResp.data.access_token;
    if (!token) {
      return { success: false, error: 'Authentication token not returned by server.' };
    }

    if (window.Session && typeof window.Session.setToken === 'function') {
      window.Session.setToken(token);
    }

    // Use returned user if present, or fetch via /auth/me fallback
    let trainer = loginResp.data.user;
    if (!trainer) {
      const meResp = await window.Api.getCurrentUser();
      trainer = meResp && meResp.data;
    }

    if (trainer) {
      currentTrainerId = trainer.id;
      if (window.Session && typeof window.Session.setCurrentUser === 'function') {
        window.Session.setCurrentUser(trainer);
      }
      return { success: true, trainer };
    }

    return { success: false, error: 'Unable to verify authenticated user.' };
  } catch (err) {
    if (err && err.name === 'ApiError') {
      if (err.status === 401) {
        return { success: false, error: 'Incorrect trainer name/email or password.' };
      }
      if (err.status === 403) {
        return { success: false, error: 'Trainer privileges required.' };
      }
      const detail = (err.body && err.body.detail) ? err.body.detail : err.message;
      return { success: false, error: detail || 'Login failed.' };
    }
    return { success: false, error: 'Cannot connect to the server. Make sure the backend is running.' };
  }
}

/**
 * Retrieves the currently authenticated trainer from FastAPI (/auth/me).
 */
async function getCurrentTrainer() {
  try {
    await ensureApiLoaded();
    const resp = await window.Api.getCurrentUser();
    if (resp && resp.data) {
      currentTrainerId = resp.data.id;
      if (window.Session && typeof window.Session.setCurrentUser === 'function') {
        window.Session.setCurrentUser(resp.data);
      }
      return resp.data;
    }
    return null;
  } catch (err) {
    if (window.Session && typeof window.Session.clearSession === 'function') {
      window.Session.clearSession();
    }
    return null;
  }
}

/**
 * Logs out the trainer by calling /auth/logout to clear the HttpOnly cookie.
 */
async function logoutTrainer() {
  currentTrainerId = null;
  try {
    await ensureApiLoaded();
    await window.Api.logout();
  } catch (err) {
    // Ignore network error on logout
  }

  if (window.Session && typeof window.Session.clearSession === 'function') {
    window.Session.clearSession();
  }
}
