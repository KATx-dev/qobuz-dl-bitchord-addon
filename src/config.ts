export interface Config {
  host: string;
  port: number;
  requestTimeoutMs: number;
  cacheTtlMs: number;
  provider: 'stub' | 'http' | 'qobuzdl';
  apiBaseUrl?: string;
  searchPath?: string;
  streamPath?: string;
  apiToken?: string;
}

const positiveInt = (name: string, fallback: number): number => {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${name} must be a positive integer`);
  return value;
};

export function loadConfig(): Config {
  const provider = (process.env.QOBUZ_PROVIDER ?? 'qobuzdl').toLowerCase();
  if (provider !== 'stub' && provider !== 'http' && provider !== 'qobuzdl') throw new Error('QOBUZ_PROVIDER must be stub, http, or qobuzdl');
  const apiBaseUrl = process.env.QOBUZ_API_BASE_URL ?? process.env.QOBUZ_UPSTREAM_BASE_URL ?? (provider === 'qobuzdl' ? 'https://qobuz.vercel.app' : undefined);
  if (provider === 'http' && (!apiBaseUrl || !/^https:\/\//i.test(apiBaseUrl))) {
    throw new Error('QOBUZ_API_BASE_URL must be an HTTPS URL when QOBUZ_PROVIDER=http');
  }
  return {
    host: process.env.HOST ?? '0.0.0.0',
    port: positiveInt('PORT', 3000),
    requestTimeoutMs: positiveInt('REQUEST_TIMEOUT_MS', 8000),
    cacheTtlMs: positiveInt('CACHE_TTL_SECONDS', 60) * 1000,
    provider,
    apiBaseUrl,
    searchPath: process.env.QOBUZ_SEARCH_PATH,
    streamPath: process.env.QOBUZ_STREAM_PATH,
    apiToken: process.env.QOBUZ_API_TOKEN,
  };
}
