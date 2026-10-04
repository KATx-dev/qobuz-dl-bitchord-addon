import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTrack, streamResponse, upstreamIdFromPublicId } from '../src/normalize.js';
import { TtlCache } from '../src/cache.js';

test('normalizes a track to an opaque stable id', () => {
  const track = normalizeTrack({ upstreamId: '123', title: 'Song', artist: 'Artist', artworkURL: 'https://cdn.example/a.jpg' });
  assert.match(track.id, /^qobuz_[A-Za-z0-9_-]+$/);
  assert.equal(track.title, 'Song');
  assert.equal(upstreamIdFromPublicId(track.id), '123');
});

test('signed IDs reject tampering', () => {
  const id = normalizeTrack({ upstreamId: '123', title: 'Song' }).id;
  assert.equal(upstreamIdFromPublicId(`${id.slice(0, -1)}x`), undefined);
});

test('cache exposes stale values for outage fallback', async () => {
  const cache = new TtlCache<string>(1);
  cache.set('key', 'value');
  await new Promise(resolve => setTimeout(resolve, 5));
  assert.equal(cache.get('key'), undefined);
  assert.equal(cache.getStale('key'), 'value');
});

test('drops non-absolute artwork URLs', () => {
  assert.equal(normalizeTrack({ upstreamId: '123', title: 'Song', artworkURL: '/cover.jpg' }).artworkURL, undefined);
});

test('rejects encrypted or non-HTTPS streams', () => {
  assert.throws(() => streamResponse({ url: 'https://cdn.example/a.flac', encrypted: true }, 'LOSSLESS'));
  assert.throws(() => streamResponse({ url: 'http://cdn.example/a.flac' }, 'LOSSLESS'));
});
