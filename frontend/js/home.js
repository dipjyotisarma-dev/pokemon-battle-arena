/* ============================================================
   HOME PAGE (EMERGENT DESIGN SYSTEM)
   Handles registration, login, rules dialog, feedback submission,
   and dynamic auth session detection via FastAPI backend.
   ============================================================ */

function showFieldError(fieldEl, message) {
  const errorEl = fieldEl.querySelector('.field-error');
  fieldEl.classList.toggle('has-error', Boolean(message));
  if (errorEl) errorEl.textContent = message || '';
}

function clearFormErrors(formEl) {
  formEl.querySelectorAll('.field').forEach((fieldEl) => showFieldError(fieldEl, ''));
}

/* ---------- Auth Session Detection ---------- */
async function initAuthState() {
  try {
    const trainer = typeof getCurrentTrainer === 'function' ? await getCurrentTrainer() : null;
    if (trainer && trainer.username) {
      // 1. Header nav: add dashboard link
      const navAuthSlot = document.getElementById('nav-auth-slot');
      if (navAuthSlot) {
        navAuthSlot.innerHTML = `<a href="dashboard.html" class="active" data-testid="home-nav-link-dashboard">Dashboard</a>`;
      }

      // 2. Hero actions: primary CTA leads to dashboard
      const heroActions = document.getElementById('hero-actions');
      if (heroActions) {
        heroActions.innerHTML = `
          <a class="button button-gold" href="dashboard.html" data-testid="home-dashboard-button">
            Enter dashboard <span>→</span>
          </a>
          <button class="button button-outline" type="button" data-open-modal="rules-modal" data-testid="home-rules-button-hero">
            Game rules <span>→</span>
          </button>
        `;
      }

      // 3. Entry strip: item 2 links to dashboard
      const entryRegisterBtn = document.getElementById('entry-register-btn');
      if (entryRegisterBtn) {
        const dashLink = document.createElement('a');
        dashLink.className = 'entry-strip-item';
        dashLink.href = 'dashboard.html';
        dashLink.id = 'entry-register-btn';
        dashLink.setAttribute('data-testid', 'home-register-action');
        dashLink.innerHTML = `
          <span>02</span>
          <b>Dashboard</b>
          <small>Enter trainer HQ →</small>
        `;
        entryRegisterBtn.replaceWith(dashLink);
      }
    }
  } catch (err) {
    // If backend is unreachable or not logged in, maintain default guest CTAs
    console.debug('No active trainer session:', err);
  }
}

/* ---------- Register Trainer ---------- */
function initRegisterForm() {
  const form = document.getElementById('register-form');
  if (!form) return;

  const formStatus = form.querySelector('.form-status');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearFormErrors(form);
    if (formStatus) formStatus.textContent = '';

    const username = form.elements.username.value;
    const email = form.elements.email.value;
    const password = form.elements.password.value;

    const result = await registerTrainer({ username, email, password });

    if (!result.success) {
      if (result.errors && typeof result.errors === 'object') {
        Object.entries(result.errors).forEach(([field, message]) => {
          const fieldEl = form.querySelector(`[data-field="${field}"]`);
          if (fieldEl) showFieldError(fieldEl, message);
        });
      } else if (result.error) {
        if (formStatus) formStatus.innerHTML = `<div class="field-error">${result.error}</div>`;
      }
      return;
    }

    if (formStatus) {
      formStatus.innerHTML = `<div class="form-success">Trainer registered! You can now enter the arena as ${result.trainer.username}.</div>`;
    }
    form.reset();

    // Auto-fill login identifier and prompt user to login
    setTimeout(() => {
      if (typeof closeModal === 'function') closeModal('register-modal');
      const loginIdentifier = document.getElementById('login-identifier');
      if (loginIdentifier) loginIdentifier.value = username;
      if (typeof openModal === 'function') openModal('login-modal');
    }, 1200);
  });
}

/* ---------- Enter Arena (login) ---------- */
function initLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;

  const formStatus = form.querySelector('.form-status');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearFormErrors(form);
    if (formStatus) formStatus.textContent = '';

    const identifier = form.elements.identifier.value;
    const password = form.elements.password.value;

    const result = await loginTrainer({ identifier, password });

    if (!result.success) {
      if (formStatus) {
        formStatus.innerHTML = `<div class="field-error">${result.error}</div>`;
      }
      return;
    }

    // On success, redirect to dashboard
    window.location.href = 'dashboard.html';
  });
}

/* ---------- Feedback ---------- */
function validateFeedback({ email, message }) {
  const errors = {};
  if (!email || !isValidEmail(email)) errors.email = 'Enter a valid email address.';
  if (!message || !message.trim()) errors.message = 'Tell us what you found or suggest.';
  return errors;
}

function submitFeedback(payload) {
  const errors = validateFeedback(payload);
  if (Object.keys(errors).length > 0) return { success: false, errors };
  return { success: true };
}

function initFeedbackForm() {
  const form = document.getElementById('feedback-form');
  if (!form) return;

  const formStatus = document.getElementById('feedback-status');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearFormErrors(form);
    if (formStatus) formStatus.textContent = '';

    const payload = {
      email: form.elements.email.value,
      message: form.elements.message.value,
    };
    const result = submitFeedback(payload);

    if (!result.success) {
      Object.entries(result.errors).forEach(([field, message]) => {
        const fieldEl = form.querySelector(`[data-field="${field}"]`);
        if (fieldEl) showFieldError(fieldEl, message);
      });
      return;
    }

    if (formStatus) {
      formStatus.textContent = 'Feedback transmitted. Thank you, trainer.';
    }
    form.reset();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initRegisterForm();
  initLoginForm();
  initFeedbackForm();
  initAuthState();
});