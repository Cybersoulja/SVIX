import { SvixClient } from './svix-client.js';

const STORAGE_KEY = 'svix_config';

let client = null;
let activeAppId = null;

// --- Persistence ---

function loadConfig() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveConfig(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

// --- DOM helpers ---

function el(id) {
  return document.getElementById(id);
}

function showError(container, message) {
  const div = document.createElement('div');
  div.className = 'error';
  div.textContent = message;
  container.prepend(div);
  setTimeout(() => div.remove(), 5000);
}

function setLoading(btn, loading) {
  btn.disabled = loading;
  btn.dataset.original = btn.dataset.original || btn.textContent;
  btn.textContent = loading ? 'Loading…' : btn.dataset.original;
}

// --- Config panel ---

function initConfigPanel() {
  const cfg = loadConfig();
  if (cfg.apiKey) el('api-key').value = cfg.apiKey;
  if (cfg.region) el('region').value = cfg.region;

  el('config-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const apiKey = el('api-key').value.trim();
    const region = el('region').value;
    if (!apiKey) return;
    saveConfig({ apiKey, region });
    client = new SvixClient(apiKey, region);
    el('config-panel').classList.add('connected');
    loadApps();
  });

  el('disconnect-btn').addEventListener('click', () => {
    client = null;
    activeAppId = null;
    localStorage.removeItem(STORAGE_KEY);
    el('config-panel').classList.remove('connected');
    el('api-key').value = '';
    el('apps-list').innerHTML = '';
    el('app-detail').classList.add('hidden');
  });

  if (cfg.apiKey) {
    client = new SvixClient(cfg.apiKey, cfg.region || 'eu');
    el('config-panel').classList.add('connected');
    loadApps();
  }
}

// --- Apps ---

async function loadApps() {
  const list = el('apps-list');
  list.innerHTML = '<p class="loading">Loading apps…</p>';

  try {
    const data = await client.listApps();
    renderApps(data.data || []);
  } catch (err) {
    list.innerHTML = '';
    showError(el('apps-section'), err.message);
  }
}

function renderApps(apps) {
  const list = el('apps-list');
  list.innerHTML = '';

  if (!apps.length) {
    list.innerHTML = '<p class="empty">No apps yet. Create your first one below.</p>';
    return;
  }

  apps.forEach((app) => {
    const card = document.createElement('div');
    card.className = 'card';
    if (app.id === activeAppId) card.classList.add('active');

    card.innerHTML = `
      <div class="card-main">
        <strong>${escHtml(app.name)}</strong>
        <span class="id">${escHtml(app.id)}</span>
      </div>
      <div class="card-actions">
        <button class="btn btn-sm" data-action="view" data-id="${escHtml(app.id)}" data-name="${escHtml(app.name)}">View</button>
        <button class="btn btn-sm btn-danger" data-action="delete-app" data-id="${escHtml(app.id)}">Delete</button>
      </div>
    `;
    list.appendChild(card);
  });

  list.addEventListener('click', handleAppListClick);
}

async function handleAppListClick(e) {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;

  const { action, id, name } = btn.dataset;

  if (action === 'view') {
    activeAppId = id;
    document.querySelectorAll('#apps-list .card').forEach((c) => c.classList.remove('active'));
    btn.closest('.card').classList.add('active');
    showAppDetail(id, name);
  }

  if (action === 'delete-app') {
    if (!confirm(`Delete app "${name || id}"? This cannot be undone.`)) return;
    setLoading(btn, true);
    try {
      await client.deleteApp(id);
      if (activeAppId === id) {
        activeAppId = null;
        el('app-detail').classList.add('hidden');
      }
      loadApps();
    } catch (err) {
      setLoading(btn, false);
      showError(el('apps-section'), err.message);
    }
  }
}

el('create-app-form') && (() => {
  el('create-app-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = el('new-app-name').value.trim();
    const uid = el('new-app-uid').value.trim();
    if (!name) return;
    const btn = e.submitter;
    setLoading(btn, true);
    try {
      await client.createApp(name, uid || undefined);
      el('new-app-name').value = '';
      el('new-app-uid').value = '';
      loadApps();
    } catch (err) {
      showError(el('apps-section'), err.message);
    } finally {
      setLoading(btn, false);
    }
  });
})();

// --- App detail (endpoints + messages) ---

async function showAppDetail(appId, appName) {
  const detail = el('app-detail');
  detail.classList.remove('hidden');
  el('detail-app-name').textContent = appName;
  el('endpoints-list').innerHTML = '<p class="loading">Loading…</p>';
  el('messages-list').innerHTML = '<p class="loading">Loading…</p>';

  try {
    const [epData, msgData] = await Promise.all([
      client.listEndpoints(appId),
      client.listMessages(appId),
    ]);
    renderEndpoints(appId, epData.data || []);
    renderMessages(msgData.data || []);
  } catch (err) {
    showError(detail, err.message);
  }
}

function renderEndpoints(appId, endpoints) {
  const list = el('endpoints-list');
  list.innerHTML = '';

  if (!endpoints.length) {
    list.innerHTML = '<p class="empty">No endpoints configured.</p>';
    return;
  }

  endpoints.forEach((ep) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-main">
        <strong>${escHtml(ep.description || 'Endpoint')}</strong>
        <span class="id url">${escHtml(ep.url)}</span>
      </div>
      <div class="card-actions">
        <button class="btn btn-sm btn-danger" data-action="delete-ep" data-app="${escHtml(appId)}" data-id="${escHtml(ep.id)}">Delete</button>
      </div>
    `;
    list.appendChild(card);
  });

  list.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action="delete-ep"]');
    if (!btn) return;
    if (!confirm('Delete this endpoint?')) return;
    setLoading(btn, true);
    try {
      await client.deleteEndpoint(btn.dataset.app, btn.dataset.id);
      showAppDetail(activeAppId, el('detail-app-name').textContent);
    } catch (err) {
      setLoading(btn, false);
      showError(el('app-detail'), err.message);
    }
  });
}

function renderMessages(messages) {
  const list = el('messages-list');
  list.innerHTML = '';

  if (!messages.length) {
    list.innerHTML = '<p class="empty">No messages yet.</p>';
    return;
  }

  messages.forEach((msg) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-main">
        <strong>${escHtml(msg.eventType)}</strong>
        <span class="id">${escHtml(msg.id)}</span>
      </div>
      <div class="card-meta">${escHtml(new Date(msg.timestamp).toLocaleString())}</div>
    `;
    list.appendChild(card);
  });
}

el('add-endpoint-form') && (() => {
  el('add-endpoint-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!activeAppId) return;
    const url = el('ep-url').value.trim();
    const desc = el('ep-desc').value.trim();
    if (!url) return;
    const btn = e.submitter;
    setLoading(btn, true);
    try {
      await client.createEndpoint(activeAppId, url, desc);
      el('ep-url').value = '';
      el('ep-desc').value = '';
      showAppDetail(activeAppId, el('detail-app-name').textContent);
    } catch (err) {
      showError(el('app-detail'), err.message);
    } finally {
      setLoading(btn, false);
    }
  });
})();

// --- Utility ---

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// --- Boot ---

document.addEventListener('DOMContentLoaded', () => {
  initConfigPanel();
});
