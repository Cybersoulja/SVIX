import { escHtml, formatDate, setLoading } from '../utils.js';
import { showToast } from '../toast.js';
import { openModal, closeModal } from '../modal.js';
import { navigate } from '../router.js';

let _client = null;
let _appId = null;
let _msgIteratorStack = [];
let _msgNextIterator = null;

export function mountAppDetail(client, appId) {
  _client = client;
  _appId = appId;
  _msgIteratorStack = [];
  _msgNextIterator = null;

  const section = document.getElementById('view-app-detail');
  section.hidden = false;
  document.getElementById('detail-app-name').textContent = appId;

  // Back button
  const backBtn = document.getElementById('back-btn');
  const newBack = backBtn.cloneNode(true);
  backBtn.replaceWith(newBack);
  newBack.addEventListener('click', () => navigate('#/'));

  // Add endpoint button
  const addEpBtn = document.getElementById('add-endpoint-btn');
  const newAddEp = addEpBtn.cloneNode(true);
  addEpBtn.replaceWith(newAddEp);
  newAddEp.addEventListener('click', openAddEndpointModal);

  // Tabs
  section.querySelectorAll('.tab-btn').forEach((btn) => {
    const newBtn = btn.cloneNode(true);
    btn.replaceWith(newBtn);
    newBtn.addEventListener('click', () => switchTab(newBtn.dataset.tab));
  });

  // Pagination
  const prevBtn = document.getElementById('msg-prev-btn');
  const nextBtn = document.getElementById('msg-next-btn');
  const newPrev = prevBtn.cloneNode(true);
  const newNext = nextBtn.cloneNode(true);
  prevBtn.replaceWith(newPrev);
  nextBtn.replaceWith(newNext);
  newPrev.addEventListener('click', handleMsgPrev);
  newNext.addEventListener('click', handleMsgNext);

  switchTab('endpoints');
  loadMessages();
}

export function unmountAppDetail() {
  document.getElementById('view-app-detail').hidden = true;
  _client = null;
  _appId = null;
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach((b) => {
    b.classList.toggle('tab-btn--active', b.dataset.tab === tabName);
  });
  document.querySelectorAll('.tab-panel').forEach((p) => {
    p.classList.toggle('tab-panel--hidden', p.id !== `tab-${tabName}`);
  });
  if (tabName === 'endpoints') loadEndpoints();
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

async function loadEndpoints() {
  const tbody = document.getElementById('endpoints-tbody');
  tbody.innerHTML = `<tr><td colspan="5" class="loading-text">Loading…</td></tr>`;

  let result;
  try {
    result = await _client.listEndpoints(_appId);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-text">${escHtml(err.message)}</td></tr>`;
    showToast(err.message, 'error');
    return;
  }

  const endpoints = result.data ?? [];

  if (!endpoints.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-text">No endpoints yet. Add one above.</td></tr>`;
    return;
  }

  tbody.innerHTML = '';
  endpoints.forEach((ep) => {
    const tr = document.createElement('tr');
    const enabled = ep.status === 0;
    tr.innerHTML = `
      <td class="mono url-cell" title="${escHtml(ep.url)}">${escHtml(ep.url)}</td>
      <td>${escHtml(ep.description || '—')}</td>
      <td><span class="badge ${enabled ? 'badge--success' : 'badge--pending'}">${enabled ? 'enabled' : 'disabled'}</span></td>
      <td>${formatDate(ep.createdAt)}</td>
      <td class="col-actions">
        <button class="btn btn-sm btn-ghost" data-action="secret" title="View signing secret">Secret</button>
        <button class="btn btn-sm btn-ghost" data-action="rotate" title="Rotate signing secret">Rotate</button>
        <button class="btn btn-sm btn-danger" data-action="delete">Delete</button>
      </td>
    `;
    tr.querySelector('[data-action="secret"]').addEventListener('click', () => handleShowSecret(ep.id));
    tr.querySelector('[data-action="rotate"]').addEventListener('click', () => handleRotateSecret(ep.id));
    tr.querySelector('[data-action="delete"]').addEventListener('click', () => handleDeleteEndpoint(ep.id, ep.url, tr));
    tbody.appendChild(tr);
  });
}

function openAddEndpointModal() {
  openModal({
    title: 'Add Endpoint',
    bodyHtml: `
      <form id="modal-form">
        <div class="form-row">
          <label for="ep-url">URL <span class="required">*</span></label>
          <input id="ep-url" name="url" type="url" placeholder="https://example.com/webhooks" required />
        </div>
        <div class="form-row">
          <label for="ep-desc">Description <span class="optional">(optional)</span></label>
          <input id="ep-desc" name="description" type="text" placeholder="My webhook consumer" />
        </div>
      </form>`,
    submitLabel: 'Add Endpoint',
    onSubmit: async (form) => {
      const data = new FormData(form);
      const url = String(data.get('url') ?? '').trim();
      const desc = String(data.get('description') ?? '').trim();
      if (!url) throw new Error('URL is required');
      await _client.createEndpoint(_appId, url, desc);
      closeModal();
      showToast('Endpoint added', 'success');
      loadEndpoints();
    },
  });
}

async function handleShowSecret(endpointId) {
  let result;
  try {
    result = await _client.getEndpointSecret(_appId, endpointId);
  } catch (err) {
    showToast(err.message, 'error');
    return;
  }

  openModal({
    title: 'Signing Secret',
    bodyHtml: `
      <p class="hint">Use this secret to verify webhook signatures sent by Svix.</p>
      <div class="secret-row">
        <code class="mono secret-val">${escHtml(result.key)}</code>
        <button class="btn btn-sm btn-ghost" id="copy-secret-btn">Copy</button>
      </div>`,
  });

  document.getElementById('copy-secret-btn').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(result.key);
      showToast('Copied to clipboard', 'success');
    } catch {
      showToast('Select the secret text above and copy manually', 'info');
    }
  });
}

function handleRotateSecret(endpointId) {
  openModal({
    title: 'Rotate Signing Secret?',
    bodyHtml: `<p>This will immediately invalidate the current secret. All consumers using the old secret will fail signature verification until updated.</p>`,
    submitLabel: 'Rotate Secret',
    onSubmit: async () => {
      await _client.rotateEndpointSecret(_appId, endpointId);
      closeModal();
      showToast('Secret rotated — update your consumers', 'success');
    },
  });
}

function handleDeleteEndpoint(endpointId, url, rowEl) {
  openModal({
    title: 'Delete Endpoint?',
    bodyHtml: `<p>Delete <code class="mono">${escHtml(url)}</code>? This cannot be undone.</p>`,
    submitLabel: 'Delete',
    onSubmit: async () => {
      await _client.deleteEndpoint(_appId, endpointId);
      closeModal();
      rowEl.remove();
      showToast('Endpoint deleted', 'success');
    },
  });
}

// ─── Messages ─────────────────────────────────────────────────────────────────

async function loadMessages(iterator) {
  const tbody = document.getElementById('messages-tbody');
  tbody.innerHTML = `<tr><td colspan="3" class="loading-text">Loading…</td></tr>`;

  const prevBtn = document.getElementById('msg-prev-btn');
  const nextBtn = document.getElementById('msg-next-btn');
  prevBtn.disabled = true;
  nextBtn.disabled = true;

  let result;
  try {
    result = await _client.listMessages(_appId, { iterator });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="3" class="empty-text">${escHtml(err.message)}</td></tr>`;
    showToast(err.message, 'error');
    return;
  }

  _msgNextIterator = result.iterator ?? null;

  const messages = result.data ?? [];

  if (!messages.length) {
    tbody.innerHTML = `<tr><td colspan="3" class="empty-text">No messages yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = '';
  messages.forEach((msg) => {
    const tr = document.createElement('tr');
    tr.className = 'clickable';
    tr.innerHTML = `
      <td><span class="event-type-badge">${escHtml(msg.eventType)}</span></td>
      <td class="mono msg-id-cell">${escHtml(msg.id)}</td>
      <td class="msg-ts">${formatDate(msg.timestamp)}</td>
    `;
    tr.addEventListener('click', () => handleMessageClick(msg.id, msg.eventType));
    tbody.appendChild(tr);
  });

  prevBtn.disabled = _msgIteratorStack.length === 0;
  nextBtn.disabled = !_msgNextIterator;
}

function handleMsgNext() {
  if (!_msgNextIterator) return;
  _msgIteratorStack.push(document.getElementById('msg-prev-btn').dataset.curIter ?? null);
  document.getElementById('msg-prev-btn').dataset.curIter = _msgNextIterator;
  loadMessages(_msgNextIterator);
}

function handleMsgPrev() {
  const prev = _msgIteratorStack.pop();
  loadMessages(prev ?? undefined);
}

async function handleMessageClick(msgId, eventType) {
  openModal({
    title: eventType,
    bodyHtml: '<p class="loading-text">Loading message details…</p>',
  });

  let msg, attemptsResult;
  try {
    [msg, attemptsResult] = await Promise.all([
      _client.getMessage(_appId, msgId),
      _client.listAttemptsByMsg(_appId, msgId),
    ]);
  } catch (err) {
    closeModal();
    showToast(err.message, 'error');
    return;
  }

  const attempts = attemptsResult.data ?? [];
  const payloadStr = JSON.stringify(msg.payload ?? {}, null, 2);

  const attemptsHtml = attempts.length
    ? `<table class="data-table attempts-table">
        <thead><tr>
          <th>Status</th><th>HTTP</th><th>Endpoint</th><th>Timestamp</th><th></th>
        </tr></thead>
        <tbody>
          ${attempts.map((a) => {
            const [cls, label] = _attemptStatus(a.status);
            const failed = a.status === 2;
            return `<tr>
              <td><span class="badge ${cls}">${label}</span></td>
              <td>${escHtml(String(a.responseStatusCode ?? '—'))}</td>
              <td class="mono ep-id-cell" title="${escHtml(a.endpointId)}">${escHtml(a.endpointId)}</td>
              <td>${formatDate(a.timestamp)}</td>
              <td>${failed
                ? `<button class="btn btn-sm btn-ghost retry-btn" data-msg="${escHtml(msgId)}" data-ep="${escHtml(a.endpointId)}">Retry</button>`
                : ''}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`
    : '<p class="empty-text">No delivery attempts yet.</p>';

  openModal({
    title: eventType,
    bodyHtml: `
      <div class="msg-meta">
        <span class="label">ID</span>
        <code class="mono">${escHtml(msg.id)}</code>
        ${msg.uid ? `<span class="label">UID</span><span>${escHtml(msg.uid)}</span>` : ''}
        <span class="label">Timestamp</span>
        <span>${formatDate(msg.timestamp)}</span>
      </div>
      <h4 class="detail-heading">Payload</h4>
      <pre class="json-viewer">${escHtml(payloadStr)}</pre>
      <h4 class="detail-heading">Delivery Attempts</h4>
      ${attemptsHtml}`,
  });

  document.querySelectorAll('.retry-btn').forEach((btn) => {
    btn.addEventListener('click', () => handleRetry(btn.dataset.msg, btn.dataset.ep, btn));
  });
}

async function handleRetry(msgId, endpointId, btn) {
  setLoading(btn, true);
  try {
    await _client.resendMessage(_appId, msgId, endpointId);
    btn.textContent = 'Queued';
    btn.disabled = true;
    showToast('Retry queued', 'success');
  } catch (err) {
    showToast(err.message, 'error');
    setLoading(btn, false);
  }
}

function _attemptStatus(status) {
  switch (status) {
    case 0: return ['badge--success', 'Success'];
    case 1: return ['badge--pending', 'Pending'];
    case 2: return ['badge--failed', 'Failed'];
    case 3: return ['badge--pending', 'Sending'];
    default: return ['', 'Unknown'];
  }
}
