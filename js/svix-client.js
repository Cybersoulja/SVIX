export const REGIONS = {
  us: 'https://api.svix.com/api/v1',
  eu: 'https://api.eu.svix.com/api/v1',
  in: 'https://api.in.svix.com/api/v1',
};

export class SvixClient {
  constructor(apiKey, region = 'eu') {
    this.apiKey = apiKey;
    this.baseUrl = REGIONS[region] ?? REGIONS.eu;
  }

  async request(method, path, body) {
    let res;
    try {
      res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new Error('Network error — check your connection and CORS settings.');
    }

    if (res.status === 401 || res.status === 403) {
      throw new Error('Authentication failed. Check your API key.');
    }
    if (res.status === 429) {
      const after = res.headers.get('Retry-After') ?? '?';
      throw new Error(`Rate limit exceeded. Try again in ${after}s.`);
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    if (res.status === 204) return null;
    return res.json();
  }

  // --- Apps ---
  listApps({ limit = 50, iterator } = {}) {
    const p = new URLSearchParams({ limit });
    if (iterator) p.set('iterator', iterator);
    return this.request('GET', `/app/?${p}`);
  }
  createApp(name, uid) {
    return this.request('POST', '/app/', { name, ...(uid ? { uid } : {}) });
  }
  deleteApp(appId) {
    return this.request('DELETE', `/app/${appId}/`);
  }

  // --- Endpoints ---
  listEndpoints(appId, { limit = 50, iterator } = {}) {
    const p = new URLSearchParams({ limit });
    if (iterator) p.set('iterator', iterator);
    return this.request('GET', `/app/${appId}/endpoint/?${p}`);
  }
  createEndpoint(appId, url, description = '') {
    return this.request('POST', `/app/${appId}/endpoint/`, { url, description, version: 1 });
  }
  deleteEndpoint(appId, endpointId) {
    return this.request('DELETE', `/app/${appId}/endpoint/${endpointId}/`);
  }
  getEndpointSecret(appId, endpointId) {
    return this.request('GET', `/app/${appId}/endpoint/${endpointId}/secret/`);
  }
  rotateEndpointSecret(appId, endpointId) {
    return this.request('POST', `/app/${appId}/endpoint/${endpointId}/secret/rotate/`, {});
  }

  // --- Messages ---
  listMessages(appId, { limit = 20, iterator } = {}) {
    const p = new URLSearchParams({ limit });
    if (iterator) p.set('iterator', iterator);
    return this.request('GET', `/app/${appId}/msg/?${p}`);
  }
  getMessage(appId, msgId) {
    return this.request('GET', `/app/${appId}/msg/${msgId}/`);
  }

  // --- Attempts ---
  listAttemptsByMsg(appId, msgId, { limit = 20 } = {}) {
    return this.request('GET', `/app/${appId}/attempt/msg/${msgId}/?limit=${limit}`);
  }
  listAttemptsByEndpoint(appId, endpointId, { limit = 50 } = {}) {
    return this.request('GET', `/app/${appId}/attempt/endpoint/${endpointId}/?limit=${limit}`);
  }
  resendMessage(appId, msgId, endpointId) {
    return this.request('POST', `/app/${appId}/msg/${msgId}/endpoint/${endpointId}/resend/`, {});
  }
}
