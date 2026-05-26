export const STORAGE_KEY = 'svix_config';
export const ANTHROPIC_KEY = 'anthropic_key';

export function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatDate(isoString) {
  if (!isoString) return '—';
  try {
    return new Date(isoString).toLocaleString();
  } catch {
    return String(isoString);
  }
}

export function setLoading(btn, loading) {
  btn.disabled = loading;
  if (loading) {
    btn.dataset.origText = btn.textContent;
    btn.textContent = 'Loading…';
  } else {
    btn.textContent = btn.dataset.origText ?? btn.textContent;
  }
}
