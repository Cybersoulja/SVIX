import { escHtml, formatDate } from '../utils.js';
import { showToast } from '../toast.js';
import { openModal, closeModal } from '../modal.js';
import { navigate } from '../router.js';

let _client = null;

export function mountAppsView(client) {
  _client = client;
  document.getElementById('view-apps').hidden = false;

  // Re-wire create button to avoid duplicate listeners
  const old = document.getElementById('create-app-btn');
  const btn = old.cloneNode(true);
  old.replaceWith(btn);
  btn.addEventListener('click', openCreateModal);

  loadApps();
}

export function unmountAppsView() {
  document.getElementById('view-apps').hidden = true;
}

async function loadApps(iterator) {
  const grid = document.getElementById('apps-grid');

  if (!iterator) {
    grid.innerHTML = '<p class="loading-text">Loading applications…</p>';
    document.getElementById('load-more-wrap')?.remove();
  }

  let result;
  try {
    result = await _client.listApps({ iterator });
  } catch (err) {
    grid.innerHTML = `<p class="empty-text">${escHtml(err.message)}</p>`;
    showToast(err.message, 'error');
    return;
  }

  const apps = result.data ?? [];

  if (!iterator) grid.innerHTML = '';

  if (!apps.length && !iterator) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">▦</div>
        <p>No applications yet.</p>
        <button class="btn btn-primary" id="empty-create-btn">+ New Application</button>
      </div>`;
    document.getElementById('empty-create-btn').addEventListener('click', openCreateModal);
    return;
  }

  appendCards(apps, grid);

  // Load-more for cursor pagination
  document.getElementById('load-more-wrap')?.remove();
  if (!result.done && result.iterator) {
    const wrap = document.createElement('div');
    wrap.id = 'load-more-wrap';
    wrap.className = 'load-more-bar';
    wrap.innerHTML = `<button class="btn btn-ghost btn-sm" data-iter="${escHtml(result.iterator)}">Load more</button>`;
    wrap.querySelector('button').addEventListener('click', (e) => loadApps(e.currentTarget.dataset.iter));
    grid.after(wrap);
  }
}

function appendCards(apps, grid) {
  apps.forEach((app) => {
    const card = document.createElement('div');
    card.className = 'app-card';
    card.innerHTML = `
      <div class="app-card__header">
        <span class="app-card__name">${escHtml(app.name)}</span>
        <button class="btn-icon delete-app-btn" title="Delete application">×</button>
      </div>
      <div class="app-card__id mono">${escHtml(app.id)}</div>
      ${app.uid ? `<div class="app-card__uid">UID: ${escHtml(app.uid)}</div>` : ''}
      <div class="app-card__meta">${formatDate(app.createdAt)}</div>
    `;

    card.addEventListener('click', (e) => {
      if (!e.target.closest('.delete-app-btn')) navigate(`#/apps/${app.id}`);
    });

    card.querySelector('.delete-app-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      handleDeleteApp(app.id, app.name, card);
    });

    grid.appendChild(card);
  });
}

function openCreateModal() {
  openModal({
    title: 'New Application',
    bodyHtml: `
      <form id="modal-form">
        <div class="form-row">
          <label for="mc-name">Name <span class="required">*</span></label>
          <input id="mc-name" name="name" type="text" placeholder="My App" required />
        </div>
        <div class="form-row">
          <label for="mc-uid">UID <span class="optional">(optional)</span></label>
          <input id="mc-uid" name="uid" type="text" placeholder="unique-identifier" />
          <small class="hint">Used to correlate the app with a record in your system</small>
        </div>
      </form>`,
    submitLabel: 'Create Application',
    onSubmit: async (form) => {
      const data = new FormData(form);
      const name = String(data.get('name') ?? '').trim();
      const uid = String(data.get('uid') ?? '').trim();
      if (!name) throw new Error('Name is required');
      await _client.createApp(name, uid || undefined);
      closeModal();
      showToast(`"${name}" created`, 'success');
      loadApps();
    },
  });
}

function handleDeleteApp(appId, appName, cardEl) {
  openModal({
    title: 'Delete Application?',
    bodyHtml: `<p>Delete <strong>${escHtml(appName)}</strong>? All endpoints and message history will be permanently lost.</p>`,
    submitLabel: 'Delete',
    onSubmit: async () => {
      await _client.deleteApp(appId);
      closeModal();
      cardEl.remove();
      showToast(`"${appName}" deleted`, 'success');
    },
  });
}
