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

/**
 * Registers a trainer in the demo data store.
 * Placeholder for a future POST /trainers call.
 */
function registerTrainer({ username, email, password }) {
  const errors = validateRegistration({ username, email, password });
  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

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
}

/**
 * Logs a trainer in against demo data using username-or-email + password.
 * Placeholder for a future POST /login call.
 */
function loginTrainer({ identifier, password }) {
  const trimmed = (identifier || '').trim().toLowerCase();
  const trainer = DemoData.trainers.find(
    (t) => t.username.toLowerCase() === trimmed || t.email.toLowerCase() === trimmed
  );

  if (!trainer || trainer.password !== password) {
    return { success: false, error: 'Incorrect trainer name/email or password.' };
  }

  currentTrainerId = trainer.id;
  return { success: true, trainer };
}

function getCurrentTrainer() {
  return DemoData.trainers.find((t) => t.id === currentTrainerId) || null;
}

function logoutTrainer() {
  currentTrainerId = null;
}
