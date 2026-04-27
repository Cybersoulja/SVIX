import { SvixClient } from '../svix-client.js';
import { STORAGE_KEY, escHtml } from '../utils.js';
import { showToast } from '../toast.js';

let _client = null;
let _onDisconnect = null;

export function initAuth({ onConnect, onDisconnect }) {
  _onDisconnect = onDisconnect;

  document.getElementById('connect-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const apiKey = document.getElementById('api-key').value.trim();
    const region = document.getElementById('region').value;
    if (!apiKey) return;

    const btn = e.submitter;
    btn.disabled = true;
    btn.textContent = 'Connecting…';

    try {
      const client = new SvixClient(apiKey, region);
      await client.listApps({ limit: 1 });
      _client = client;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ apiKey, region }));
      _showConnected(region);
      onConnect(client);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Connect';
    }
  });

  // Auto-connect from saved config
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.apiKey) {
      document.getElementById('api-key').value = saved.apiKey;
      document.getElementById('region').value = saved.region ?? 'eu';
      _client = new SvixClient(saved.apiKey, saved.region ?? 'eu');
      _showConnected(saved.region ?? 'eu');
      onConnect(_client);
      return;
    }
  } catch {}

  document.getElementById('auth-panel').hidden = false;
}

export function getClient() {
  return _client;
}

function _showConnected(region) {
  document.getElementById('auth-panel').hidden = true;

  document.getElementById('header-status').innerHTML = `
    <span class="status-dot" title="Connected"></span>
    <span class="status-region">${escHtml(region.toUpperCase())}</span>
    <button id="disconnect-btn" class="btn btn-ghost btn-sm">Disconnect</button>
  `;

  document.getElementById('disconnect-btn').addEventListener('click', () => {
    _client = null;
    localStorage.removeItem(STORAGE_KEY);
    document.getElementById('header-status').innerHTML = '';
    document.getElementById('auth-panel').hidden = false;
    document.getElementById('api-key').value = '';
    document.getElementById('view-apps').hidden = true;
    document.getElementById('view-app-detail').hidden = true;
    _onDisconnect?.();
  });
}
