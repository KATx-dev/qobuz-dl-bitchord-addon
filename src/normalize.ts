import { createHmac, timingSafeEqual } from 'node:crypto';
import type { PublicTrack, QobuzStream, QobuzTrack, Quality } from './types.js';

const DEFAULT_ID_SECRET = 'qobuz-bitchord-id-secret-v1';

export function publicId(track: QobuzTrack, secret = DEFAULT_ID_SECRET): string {
  const encoded = Buffer.from(track.upstreamId, 'utf8').toString('base64url');
  const signature = sign(encoded, secret);
  return `qobuz_${encoded}_${signature}`;
}

export function upstreamIdFromPublicId(id: string, secret = DEFAULT_ID_SECRET): string | undefined {
  const match = /^qobuz_([A-Za-z0-9_-]+)_([A-Za-z0-9_-]{16})$/.exec(id);
  if (!match) return undefined;
  const [encoded, supplied] = [match[1], match[2]];
  const expected = sign(encoded, secret);
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return undefined;
  try {
    const upstreamId = Buffer.from(encoded, 'base64url').toString('utf8');
    return upstreamId.trim() || undefined;
  } catch { return undefined; }
}

export function normalizeTrack(track: QobuzTrack, secret?: string): PublicTrack {
  if (!track.upstreamId.trim() || !track.title.trim()) throw new Error('provider returned an unusable track');
  return {
    id: publicId(track, secret), title: track.title.trim(),
    artist: track.artist?.trim() || undefined, album: track.album?.trim() || undefined,
    duration: Number.isFinite(track.duration) && (track.duration as number) >= 0 ? track.duration : undefined,
    artworkURL: absoluteUrl(track.artworkURL), format: track.format?.toLowerCase(),
    audioQuality: track.audioQuality?.trim(), audioModes: track.audioModes, atmos: track.atmos,
  };
}

export function streamResponse(stream: QobuzStream, requested: Quality): QobuzStream {
  if (!/^https:\/\//i.test(stream.url) || stream.encrypted === true) throw new Error('stream is not an openable HTTPS rendition');
  if (stream.manifest && !['none', 'hls', 'dash'].includes(stream.manifest)) throw new Error('unsupported manifest type');
  return { ...stream, format: stream.format?.toLowerCase(), quality: stream.quality ?? requested };
}

function sign(encoded: string, secret: string): string {
  return createHmac('sha256', secret || DEFAULT_ID_SECRET).update(encoded).digest('base64url').slice(0, 16);
}

function absoluteUrl(value?: string): string | undefined {
  if (!value) return undefined;
  try { const url = new URL(value); return /^https?:$/.test(url.protocol) ? url.toString() : undefined; } catch { return undefined; }
}
