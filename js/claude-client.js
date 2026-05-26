import { ANTHROPIC_KEY } from './utils.js';

const API_URL = 'https://api.anthropic.com/v1/messages';

export function getAnthropicKey() {
  try { return localStorage.getItem(ANTHROPIC_KEY) ?? null; } catch { return null; }
}

export function saveAnthropicKey(key) {
  localStorage.setItem(ANTHROPIC_KEY, key);
}

export function initAnthropicFromStorage() {
  return !!getAnthropicKey();
}

export async function streamEndpointAnalysis({ endpoint, attempts, onChunk, onDone, onError }) {
  const apiKey = getAnthropicKey();
  if (!apiKey) {
    onError(new Error('No Anthropic API key configured.'));
    return;
  }

  const total = attempts.length;
  const success = attempts.filter(a => a.status === 0).length;
  const failed = attempts.filter(a => a.status === 2).length;
  const inProgress = attempts.filter(a => a.status === 1 || a.status === 3).length;
  const successRate = total > 0 ? Math.round((success / total) * 100) : null;

  const failureDetails = attempts
    .filter(a => a.status === 2)
    .slice(0, 5)
    .map(a => `  • HTTP ${a.responseStatusCode ?? 'N/A'} at ${new Date(a.timestamp).toLocaleString()}`)
    .join('\n');

  const prompt = `You are a webhook delivery expert helping a developer debug and improve their webhook setup.

ENDPOINT CONFIG
URL: ${endpoint.url}
Description: ${endpoint.description || 'None'}
Status: ${endpoint.status === 0 ? 'Enabled' : 'Disabled'}
Created: ${new Date(endpoint.createdAt).toLocaleString()}

DELIVERY STATISTICS (${total} recent attempts)
Success: ${success} | Failed: ${failed} | In Progress: ${inProgress}${successRate !== null ? `\nSuccess Rate: ${successRate}%` : ''}

${failed > 0 && failureDetails ? `RECENT FAILURES\n${failureDetails}` : 'No recent failures in sample.'}

Provide a concise developer-focused analysis with these sections:

**URL Health Check**
[Identify any issues: non-HTTPS, localhost/127.0.0.1, bare IP, wrong port, typos in domain]

**Delivery Analysis**
[Interpret the attempt statistics. What do failure patterns suggest? What do specific HTTP codes mean for webhooks?]

**Recommendations**
[2-4 specific, actionable items the developer should check or fix]

**Overall Verdict**
[One sentence health summary]

Skip any section that has nothing notable to say. Be direct and technical.`;

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-7',
        max_tokens: 1024,
        stream: true,
        thinking: { type: 'adaptive' },
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (res.status === 401) throw new Error('Invalid Anthropic API key.');
    if (res.status === 429) throw new Error('Anthropic rate limit hit. Try again shortly.');
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error?.message || `Anthropic API error ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const event = JSON.parse(data);
          if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
            onChunk(event.delta.text);
          }
        } catch {}
      }
    }

    onDone();
  } catch (err) {
    onError(err);
  }
}
