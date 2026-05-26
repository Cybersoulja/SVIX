import { escHtml } from '../utils.js';
import { saveAnthropicKey, initAnthropicFromStorage, streamEndpointAnalysis } from '../claude-client.js';
import { openModal, closeModal } from '../modal.js';
import { showToast } from '../toast.js';

let _svixClient = null;
let _appId = null;

export function initAnalyzer(svixClient, appId) {
  _svixClient = svixClient;
  _appId = appId;

  const closeBtn = document.getElementById('analyzer-close-btn');
  const newClose = closeBtn.cloneNode(true);
  closeBtn.replaceWith(newClose);
  newClose.addEventListener('click', closeAnalyzer);
}

export function closeAnalyzer() {
  document.getElementById('analyzer-panel').hidden = true;
}

export async function analyzeEndpoint(endpoint) {
  if (!initAnthropicFromStorage()) {
    _promptForKey(() => analyzeEndpoint(endpoint));
    return;
  }

  const panel = document.getElementById('analyzer-panel');
  const info = document.getElementById('analyzer-endpoint-info');
  const content = document.getElementById('analyzer-content');

  info.innerHTML = `
    <div class="analyzer-ep-url mono" title="${escHtml(endpoint.url)}">${escHtml(endpoint.url)}</div>
    ${endpoint.description ? `<div class="analyzer-ep-desc">${escHtml(endpoint.description)}</div>` : ''}
  `;
  content.innerHTML = `<p class="analyzer-status">Fetching delivery data…</p>`;
  panel.hidden = false;

  let attempts = [];
  try {
    const result = await _svixClient.listAttemptsByEndpoint(_appId, endpoint.id);
    attempts = result.data ?? [];
  } catch (err) {
    content.innerHTML = `<p class="empty-text">Could not load attempts: ${escHtml(err.message)}</p>`;
    return;
  }

  content.innerHTML = `<p class="analyzer-status">Analyzing with Claude…</p>`;

  let outputEl = null;
  let fullText = '';

  await streamEndpointAnalysis({
    endpoint,
    attempts,
    onChunk(text) {
      if (!outputEl) {
        content.innerHTML = '';
        outputEl = document.createElement('div');
        outputEl.className = 'analyzer-output';
        content.appendChild(outputEl);
      }
      fullText += text;
      outputEl.innerHTML = _renderMarkdown(fullText);
    },
    onDone() {},
    onError(err) {
      content.innerHTML = `<p class="empty-text">Analysis failed: ${escHtml(err.message)}</p>`;
      showToast(err.message, 'error');
    },
  });
}

function _promptForKey(onSuccess) {
  openModal({
    title: 'Connect Claude AI',
    bodyHtml: `
      <p class="hint">Enter your Anthropic API key to enable AI-powered endpoint analysis. It's stored in your browser only — never sent anywhere except Anthropic's API.</p>
      <form id="modal-form">
        <div class="form-row">
          <label for="ant-key">Anthropic API Key</label>
          <input id="ant-key" name="key" type="password" placeholder="sk-ant-…" autocomplete="off" required />
        </div>
      </form>`,
    submitLabel: 'Save & Analyze',
    onSubmit: async (form) => {
      const key = String(new FormData(form).get('key') ?? '').trim();
      if (!key) throw new Error('API key is required');
      saveAnthropicKey(key);
      closeModal();
      onSuccess();
    },
  });
}

// HTML-escape first, then apply markdown patterns on safe text
function _renderMarkdown(text) {
  const safe = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return safe
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^[-•]\s(.+)/gm, '<span class="analyzer-bullet">$1</span>')
    .replace(/\n/g, '<br>');
}
