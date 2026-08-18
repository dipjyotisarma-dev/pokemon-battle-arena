/* ============================================================
   HOME PAGE
   Wires the register/login/feedback forms to the auth layer and
   renders the small atmosphere ticker from demo data.
   ============================================================ */

function showFieldError(fieldEl, message) {
  const errorEl = fieldEl.querySelector('.field-error');
  fieldEl.classList.toggle('has-error', Boolean(message));
  if (errorEl) errorEl.textContent = message || '';
}

function clearFormErrors(formEl) {
  formEl.querySelectorAll('.field').forEach((fieldEl) => showFieldError(fieldEl, ''));
}

/* ---------- Register Trainer ---------- */
function initRegisterForm() {
  const form = document.getElementById('register-form');
  if (!form) return;

  const formStatus = form.querySelector('.form-status');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearFormErrors(form);
    if (formStatus) formStatus.textContent = '';

    const username = form.elements.username.value;
    const email = form.elements.email.value;
    const password = form.elements.password.value;

    const result = registerTrainer({ username, email, password });

    if (!result.success) {
      Object.entries(result.errors).forEach(([field, message]) => {
        const fieldEl = form.querySelector(`[data-field="${field}"]`);
        if (fieldEl) showFieldError(fieldEl, message);
      });
      return;
    }

    if (formStatus) {
      formStatus.innerHTML = `<div class="form-success">Trainer registered. You can now enter the arena as ${result.trainer.username}.</div>`;
    }
    form.reset();
  });
}

/* ---------- Enter Arena (login) ---------- */
function initLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;

  const formStatus = form.querySelector('.form-status');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearFormErrors(form);
    if (formStatus) formStatus.textContent = '';

    const identifier = form.elements.identifier.value;
    const password = form.elements.password.value;

    const result = loginTrainer({ identifier, password });

    if (!result.success) {
      if (formStatus) {
        formStatus.innerHTML = `<div class="field-error" style="min-height:auto">${result.error}</div>`;
      }
      return;
    }

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

/** Placeholder for a future POST /feedback call. */
function submitFeedback(payload) {
  const errors = validateFeedback(payload);
  if (Object.keys(errors).length > 0) return { success: false, errors };
  return { success: true };
}

function initFeedbackForm() {
  const form = document.getElementById('feedback-form');
  if (!form) return;

  const formStatus = form.querySelector('.form-status');

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
      formStatus.innerHTML = '<div class="form-success">Thanks — your note has been sent to the developer.</div>';
    }
    form.reset();
  });
}

/* ---------- Atmosphere ticker ---------- */
function renderTicker() {
  const track = document.getElementById('ticker-track');
  if (!track) return;

  const items = [
    { label: 'Registered Trainers', value: DemoData.trainers.length + 240 },
    { label: 'Battles Logged', value: 3821 },
    { label: 'Pokémon in Dex', value: DemoData.pokemon.length + 782 },
    { label: 'Top Trainer', value: DemoData.leaderboard[0].trainerName },
  ];

  const renderItems = () =>
    items
      .map(
        (item) =>
          `<span class="ticker-item">${item.label} <strong>${item.value}</strong></span>`
      )
      .join('');

  // Two identical, explicitly-marked copies so the CSS marquee can
  // translate exactly -50% and loop with no visible seam or gap.
  track.innerHTML = `
    <div class="ticker-set" data-copy="a">${renderItems()}</div>
    <div class="ticker-set" data-copy="b">${renderItems()}</div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  initRegisterForm();
  initLoginForm();
  initFeedbackForm();
  renderTicker();
});