import Fastify from 'fastify';
import { loadConfig } from './config.js';
import { TtlCache } from './cache.js';
import { AppError, badRequest, notFound } from './errors.js';
import { normalizeTrack, publicId, streamResponse } from './normalize.js';
import { createProvider } from './providers/index.js';
import type { Quality, PublicTrack } from './types.js';

const config = loadConfig();
const provider = createProvider(config);
const searchCache = new TtlCache<PublicTrack[]>(config.cacheTtlMs);
const upstreamIds = new TtlCache<string>(config.cacheTtlMs);
const app = Fastify({ logger: { redact: ['req.headers.authorization', 'req.headers.cookie', '*.url'] } });

app.get('/manifest.json', async (_request, reply) => reply.send({
  id: 'com.bitchord.qobuz', name: 'Qobuz', version: '1.0.0', resources: ['search', 'stream'],
  allowDownloads: 0,
  settings: [{ key: 'quality', type: 'select', default: 'lossless', options: [
    { label: 'Lossless', value: 'lossless' }, { label: 'High', value: 'high' }, { label: 'Low', value: 'low' },
  ] }],
}));

app.get<{ Querystring: { q?: string; quality?: string; atmos?: string } }>('/search', async (request, reply) => {
  const query = request.query.q?.trim();
  if (!query) throw badRequest('q is required');
  const quality = parseQuality(request.query.quality);
  const atmos = request.query.atmos ?? 'auto';
  const key = `${query}\u0000${quality}\u0000${atmos}`;
  const cached = searchCache.get(key);
  if (cached) return reply.send({ tracks: cached });
  const tracks = (await provider.search(query, quality, atmos)).flatMap(track => {
    try {
      const normalized = normalizeTrack(track);
      upstreamIds.set(normalized.id, track.upstreamId);
      return [normalized];
    } catch { return []; }
  });
  searchCache.set(key, tracks);
  return reply.send({ tracks });
});

app.get<{ Params: { id: string }; Querystring: { quality?: string; atmos?: string } }>('/stream/:id', async (request, reply) => {
  const quality = parseQuality(request.query.quality);
  const atmos = request.query.atmos ?? 'auto';
  const id = request.params.id;
  if (!/^qobuz_[A-Za-z0-9_-]{10,40}$/.test(id)) throw notFound('track not found');
  const upstreamId = upstreamIds.get(id);
  if (!upstreamId) throw notFound('track not available');
  const stream = await provider.getStream(upstreamId, quality, atmos);
  if (!stream) throw notFound('track not available');
  try { return reply.send(streamResponse(stream, quality)); } catch { throw notFound('track has no playable rendition'); }
});

app.setErrorHandler((error, _request, reply) => {
  if (error instanceof AppError) return reply.code(error.statusCode).send({ error: error.message });
  const candidate = error as { statusCode?: unknown; status?: unknown };
  const status = typeof candidate.statusCode === 'number' ? candidate.statusCode : typeof candidate.status === 'number' ? candidate.status : 500;
  return reply.code(status).send({ error: status >= 500 ? 'upstream service unavailable' : 'request failed' });
});

function parseQuality(value?: string): Quality {
  const normalized = (value ?? 'LOSSLESS').toUpperCase();
  if (normalized === 'LOSSLESS' || normalized === 'HIGH' || normalized === 'LOW') return normalized;
  throw badRequest('quality must be LOSSLESS, HIGH, or LOW');
}

if (process.env.VERCEL !== '1') {
  app.listen({ host: config.host, port: config.port }).then(() => {
    app.log.info({ host: config.host, port: config.port, provider: config.provider }, 'BitChord addon listening');
  }).catch(error => { app.log.error(error); process.exit(1); });
}

export { app, parseQuality, publicId };
