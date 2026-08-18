/* ============================================================
   AUTH
   Operates on DemoData.trainers for now. Every function here is the
   seam where FastAPI calls will eventually go — registerTrainer()
   and loginTrainer() are the two to swap for real POST requests.
   No localStorage/sessionStorage: "current trainer" lives only in
   memory for the lifetime of the tab (see currentTrainerId below).
   ============================================================ */

/** @type {number|null} */
let currentTrainerId = null;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email) {
  return EMAIL_PATTERN.test(email.trim());
}

function isValidPassword(password) {
  // Minimum 8 chars, at least one letter and one number.
  return password.length >= 8 && /[A-Za-z]/.test(password) && /[0-9]/.test(password);
}

function isUsernameTaken(username) {
  return DemoData.trainers.some((t) => t.username.toLowerCase() === username.toLowerCase());
}

function isEmailTaken(email) {
  return DemoData.trainers.some((t) => t.email.toLowerCase() === email.toLowerCase());
}

/**
 * Validates a registration payload against demo data.
 * Returns a map of field -> error message. Empty object means valid.
 */
function validateRegistration({ username, email, password }) {
  const errors = {};

  if (!username || !username.trim()) {
    errors.username = 'Trainer name is required.';
  } else if (isUsernameTaken(username.trim())) {
    errors.username = 'That trainer name is already taken.';
  }

  if (!email || !email.trim()) {
    errors.email = 'Email is required.';
  } else if (!isValidEmail(email)) {
    errors.email = 'Enter a valid email address.';
  } else if (isEmailTaken(email.trim())) {
    errors.email = 'An account already uses this email.';
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
    // If already present as loaded script, resolve
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', (e) => reject(e));
      // If script already finished loading, resolve immediately
      if (existing.readyState === 'complete' || existing.readyState === 'loaded') resolve();
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
  // session must be loaded before api (api reads Session.getToken())
  if (!window.Session) {
    await _loadScript('/js/session.js');
  }
  if (!window.Api) {
    await _loadScript('/js/api.js');
  }
  // small delay to ensure scripts register globals
  return;
}

/**
 * Registers a trainer using the backend API when available.
 * Falls back to demo behavior only if the API cannot be reached.
 * Returns a Promise resolving to { success: boolean, trainer?, errors?, error? }
 */
async function registerTrainer({ username, email, password }) {
  const clientSideErrors = validateRegistration({ username, email, password });
  if (Object.keys(clientSideErrors).length > 0) {
    return { success: false, errors: clientSideErrors };
  }

  // Try backend if available
  try {
    await ensureApiLoaded();
    const resp = await window.Api.register({ username: username.trim(), email: email.trim(), password });
    // resp.data should be the created user (UserResponse)
    if (resp && resp.data) {
      return { success: true, trainer: resp.data };
    }
    return { success: false, error: 'Unexpected response from server.' };
  } catch (err) {
    // If API not reachable, fallback to demo mode (preserve existing behavior)
    if (err && err.name === 'ApiError') {
      // Map backend validation errors (422) or conflict (409)
      if (err.status === 409) {
        return { success: false, errors: { username: err.body?.detail || String(err) } };
      }
      if (err.status === 422 || err.status === 400) {
        // Attempt to surface field errors if present
        const details = err.body || {};
        // backend returns detail message; map to form-level error
        return { success: false, errors: { _form: details.detail || String(err) } };
      }
    }

    // If any network error or unexpected error, fallback to demo behavior
    try {
      const newTrainer = {
        id: DemoData.trainers.length + 1,
        username: username.trim(),
        email: email.trim(),
        password, // demo-only; a real backend must hash this server-side
      };
      DemoData.trainers.push(newTrainer);
      DemoData.trainerStats.push({
        trainerId: newTrainer.id,
        rank: DemoData.trainerStats.length + 1,
        matches: 0,
        wins: 0,
        points: 0,
        lastBattle: null,
      });
      return { success: true, trainer: newTrainer };
    } catch (fallbackErr) {
      return { success: false, error: 'Registration failed.' };
    }
  }
}

/**
 * Logs a trainer in using the backend's OAuth2 password flow when available.
 * On success stores the JWT in the in-memory session manager and fetches /auth/me.
 * Falls back to demo behavior if the API cannot be reached.
 * Returns a Promise resolving to { success: boolean, trainer?, error? }
 */
async function loginTrainer({ identifier, password }) {
  // identifier can be username or email per backend behavior
  try {
    await ensureApiLoaded();
    // backend expects field "username" and "password" for the OAuth2 form
    const loginResp = await window.Api.login({ username: identifier, password });
    // loginResp.data should be Token { access_token, token_type }
    const token = loginResp && loginResp.data && loginResp.data.access_token;
    if (!token) {
      return { success: false, error: 'Authentication token not returned.' };
    }
    // store token in session manager (in-memory)
    window.Session.setToken(token);

    // fetch current user
    try {
      const meResp = await window.Api.getCurrentUser();
      if (meResp && meResp.data) {
        window.Session.setCurrentUser(meResp.data);
        return { success: true, trainer: meResp.data };
      }
      return { success: false, error: 'Unable to fetch current user.' };
    } catch (meErr) {
      // clear token
      window.Session.clearSession();
      if (meErr && meErr.name === 'ApiError') {
        return { success: false, error: meErr.body?.detail || meErr.message };
      }
      return { success: false, error: 'Failed to retrieve authenticated user.' };
    }
  } catch (err) {
    // fallback to demo behavior if API unreachable
    if (err && err.name === 'ApiError') {
      // map common statuses
      if (err.status === 401) return { success: false, error: 'Incorrect trainer name/email or password.' };
      if (err.status === 403) return { success: false, error: 'Trainer privileges required.' };
      if (err.status === 404) return { success: false, error: 'Login endpoint not found.' };
    }

    // Demo fallback
    const trimmed = (identifier || '').trim().toLowerCase();
    const trainer = DemoData.trainers.find(
      (t) => t.username.toLowerCase() === trimmed || t.email.toLowerCase() === trimmed
    );

    if (!trainer || trainer.password !== password) {
      return { success: false, error: 'Incorrect trainer name/email or password.' };
    }

    currentTrainerId = trainer.id;
    // For demo behavior, set Session.currentUser as well if available
    if (window.Session && typeof window.Session.setCurrentUser === 'function') {
      window.Session.setCurrentUser(trainer);
    }
    return { success: true, trainer };
  }
}

async function getCurrentTrainer() {
  // If Session has a current user, return it
  if (window.Session && typeof window.Session.getCurrentUser === 'function') {
    return window.Session.getCurrentUser();
  }
  return DemoData.trainers.find((t) => t.id === currentTrainerId) || null;
}

function logoutTrainer() {
  currentTrainerId = null;
  if (window.Session && typeof window.Session.clearSession === 'function') {
    window.Session.clearSession();
  }
}
