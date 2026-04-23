const REGIONS = {
  us: 'https://api.svix.com/api/v1',
  eu: 'https://api.eu.svix.com/api/v1',
  in: 'https://api.in.svix.com/api/v1',
};

export class SvixClient {
  constructor(apiKey, region = 'eu') {
    this.apiKey = apiKey;
    this.baseUrl = REGIONS[region] || REGIONS.eu;
  }

  async request(method, path, body) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Request failed with status ${res.status}`);
    }

    if (res.status === 204) return null;
    return res.json();
  }

  listApps(limit = 50) {
    return this.request('GET', `/app/?limit=${limit}`);
  }

  createApp(name, uid) {
    const body = { name };
    if (uid) body.uid = uid;
    return this.request('POST', '/app/', body);
  }

  deleteApp(appId) {
    return this.request('DELETE', `/app/${appId}/`);
  }

  listEndpoints(appId) {
    return this.request('GET', `/app/${appId}/endpoint/`);
  }

  createEndpoint(appId, url, description = '') {
    return this.request('POST', `/app/${appId}/endpoint/`, { url, description, version: 1 });
  }

  deleteEndpoint(appId, endpointId) {
    return this.request('DELETE', `/app/${appId}/endpoint/${endpointId}/`);
  }

  listMessages(appId, limit = 20) {
    return this.request('GET', `/app/${appId}/msg/?limit=${limit}`);
  }
}
