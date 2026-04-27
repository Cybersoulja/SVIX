let _onSubmit = null;

export function openModal({ title, bodyHtml, submitLabel = 'Confirm', onSubmit } = {}) {
  const overlay = document.getElementById('modal-overlay');
  document.getElementById('modal-title').textContent = title ?? '';
  document.getElementById('modal-body').innerHTML = bodyHtml ?? '';

  const submitBtn = document.getElementById('modal-submit-btn');
  const cancelBtn = document.getElementById('modal-cancel-btn');

  submitBtn.hidden = !onSubmit;
  submitBtn.textContent = submitLabel;
  cancelBtn.textContent = onSubmit ? 'Cancel' : 'Close';

  _onSubmit = onSubmit ?? null;
  overlay.hidden = false;

  const firstInput = document.getElementById('modal-body').querySelector('input, select, textarea');
  if (firstInput) setTimeout(() => firstInput.focus(), 50);
}

export function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.hidden = true;
  _onSubmit = null;
}

export function initModal() {
  const overlay = document.getElementById('modal-overlay');

  document.getElementById('modal-submit-btn').addEventListener('click', async () => {
    if (!_onSubmit) return;
    const form = document.getElementById('modal-body').querySelector('form');
    if (form && !form.reportValidity()) return;

    const btn = document.getElementById('modal-submit-btn');
    const orig = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Loading…';
    try {
      await _onSubmit(form);
    } finally {
      btn.disabled = false;
      btn.textContent = orig;
    }
  });

  document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
  document.getElementById('modal-close-btn').addEventListener('click', closeModal);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.hidden) closeModal();
  });
}
