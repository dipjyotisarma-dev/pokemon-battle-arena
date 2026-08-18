/* ============================================================
   THEME TOGGLE
   In-memory only per project constraints — theme resets on refresh.
   Structured as pure DOM state (data-theme attribute) so a future
   persistence layer (backend-stored trainer preference) can simply
   call applyTheme() on load instead of rewriting this module.
   ============================================================ */

function applyTheme(themeName) {
  document.documentElement.setAttribute('data-theme', themeName);
  const toggle = document.querySelector('.theme-toggle');
  if (toggle) {
    toggle.setAttribute('aria-pressed', String(themeName === 'light'));
    const label = toggle.querySelector('.theme-label');
    if (label) label.textContent = themeName === 'light' ? 'Light' : 'Dark';
  }
}

function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') || 'dark';
}

function toggleTheme() {
  const next = getCurrentTheme() === 'dark' ? 'light' : 'dark';
  applyTheme(next);
}

function initThemeToggle() {
  const toggle = document.querySelector('.theme-toggle');
  if (!toggle) return;
  applyTheme(getCurrentTheme());
  toggle.addEventListener('click', toggleTheme);
}

document.addEventListener('DOMContentLoaded', initThemeToggle);
