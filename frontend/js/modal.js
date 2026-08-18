/* ============================================================
   MODAL SYSTEM
   Generic open/close helpers. Any modal just needs the markup:
     <div class="modal-overlay" id="x-modal">
       <div class="modal" role="dialog" aria-modal="true" aria-labelledby="x-title">...</div>
     </div>
   and a trigger with [data-open-modal="x-modal"].
   ============================================================ */

let lastFocusedElement = null;

function openModal(modalId) {
  const overlay = document.getElementById(modalId);
  if (!overlay) return;

  lastFocusedElement = document.activeElement;
  overlay.classList.add('is-open');
  document.body.style.overflow = 'hidden';

  const focusable = overlay.querySelector('input, button, select, textarea, a[href]');
  if (focusable) focusable.focus();
}

function closeModal(modalId) {
  const overlay = document.getElementById(modalId);
  if (!overlay) return;

  overlay.classList.remove('is-open');
  document.body.style.overflow = '';

  if (lastFocusedElement instanceof HTMLElement) {
    lastFocusedElement.focus();
  }
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay.is-open').forEach((overlay) => {
    overlay.classList.remove('is-open');
  });
  document.body.style.overflow = '';
}

/** Wires up every element with [data-open-modal] / [data-close-modal],
 *  overlay-click-to-close, and Escape-to-close. Call once on page load. */
function initModalSystem() {
  document.querySelectorAll('[data-open-modal]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      openModal(trigger.getAttribute('data-open-modal'));
    });
  });

  document.querySelectorAll('[data-close-modal]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const overlay = trigger.closest('.modal-overlay');
      if (overlay) closeModal(overlay.id);
    });
  });

  document.querySelectorAll('.modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) closeModal(overlay.id);
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeAllModals();
  });
}

document.addEventListener('DOMContentLoaded', initModalSystem);
