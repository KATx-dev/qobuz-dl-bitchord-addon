import type { Config } from '../config.js';
import type { QobuzProvider, QobuzStream, QobuzTrack, Quality } from '../types.js';

export class UpstreamError extends Error { constructor(public readonly status: number, message: string) { super(message); } }

/**
 * Adapter for an authorized, documented JSON provider. Endpoint paths are
 * explicit configuration; this class does not guess or scrape routes.
 * Expected search JSON: { tracks: QobuzTrack[] } or QobuzTrack[].
 * Expected stream JSON: QobuzStream.
 */
export class HttpQobuzProvider implements QobuzProvider {
  constructor(private readonly config: Config) {
    if (!config.apiBaseUrl || !config.searchPath || !config.streamPath) throw new Error('HTTP provider requires QOBUZ_API_BASE_URL, QOBUZ_SEARCH_PATH, and QOBUZ_STREAM_PATH');
  }

  async search(query: string, quality: Quality, atmos: string): Promise<QobuzTrack[]> {
    const body = await this.request(this.config.searchPath!, { q: query, quality, atmos });
    const raw = Array.isArray(body) ? body : (body as { tracks?: unknown }).tracks;
    if (!Array.isArray(raw)) throw new UpstreamError(502, 'provider search response is malformed');
    return raw.filter(isTrack);
  }

  async getStream(trackId: string, quality: Quality, atmos: string): Promise<QobuzStream | null> {
    const path = this.config.streamPath!.replace('{id}', encodeURIComponent(trackId));
    const body = await this.request(path, { quality, atmos });
    return isStream(body) ? body : null;
  }

  private async request(path: string, params: Record<string, string>): Promise<unknown> {
    const url = new URL(path, this.config.apiBaseUrl);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    const headers: Record<string, string> = { accept: 'application/json' };
    if (this.config.apiToken) headers.authorization = `Bearer ${this.config.apiToken}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.requestTimeoutMs);
    try {
      const response = await fetch(url, { headers, signal: controller.signal });
      if (response.status === 404) throw new UpstreamError(404, 'provider track not found');
      if (response.status === 429) throw new UpstreamError(503, 'provider rate limited');
      if (!response.ok) throw new UpstreamError(502, `provider returned HTTP ${response.status}`);
      try { return await response.json(); } catch { throw new UpstreamError(502, 'provider returned invalid JSON'); }
    } catch (error) {
      if (error instanceof UpstreamError) throw error;
      throw new UpstreamError(502, 'provider request failed');
    } finally { clearTimeout(timeout); }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null; }
function isTrack(value: unknown): value is QobuzTrack {
  return isRecord(value) && typeof value.upstreamId === 'string' && typeof value.title === 'string';
}
function isStream(value: unknown): value is QobuzStream {
  return isRecord(value) && typeof value.url === 'string' && /^https:\/\//i.test(value.url);
}
