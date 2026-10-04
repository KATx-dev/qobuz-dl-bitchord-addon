import { createHash } from 'node:crypto';
import type { PublicTrack, QobuzStream, QobuzTrack, Quality } from './types.js';

export function publicId(track: QobuzTrack): string {
  const digest = createHash('sha256').update(track.upstreamId).digest('base64url').slice(0, 22);
  return `qobuz_${digest}`;
}

export function normalizeTrack(track: QobuzTrack): PublicTrack {
  if (!track.upstreamId.trim() || !track.title.trim()) throw new Error('provider returned an unusable track');
  return {
    id: publicId(track), title: track.title.trim(),
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

function absoluteUrl(value?: string): string | undefined {
  if (!value) return undefined;
  try { const url = new URL(value); return /^https?:$/.test(url.protocol) ? url.toString() : undefined; } catch { return undefined; }
}
