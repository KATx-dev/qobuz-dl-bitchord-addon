import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTrack, streamResponse } from '../src/normalize.js';

test('normalizes a track to an opaque stable id', () => {
  const track = normalizeTrack({ upstreamId: '123', title: 'Song', artist: 'Artist', artworkURL: 'https://cdn.example/a.jpg' });
  assert.match(track.id, /^qobuz_[A-Za-z0-9_-]+$/);
  assert.equal(track.title, 'Song');
});

test('drops non-absolute artwork URLs', () => {
  assert.equal(normalizeTrack({ upstreamId: '123', title: 'Song', artworkURL: '/cover.jpg' }).artworkURL, undefined);
});

test('rejects encrypted or non-HTTPS streams', () => {
  assert.throws(() => streamResponse({ url: 'https://cdn.example/a.flac', encrypted: true }, 'LOSSLESS'));
  assert.throws(() => streamResponse({ url: 'http://cdn.example/a.flac' }, 'LOSSLESS'));
});
