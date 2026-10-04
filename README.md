# Qobuz BitChord Addon

A TypeScript/Node.js, playback-only BitChord addon exposing `/manifest.json`, `/search`, and `/stream/:id`.

## Important upstream finding

The requested `https://qobuz-dl.vercel.app/` currently redirects to `https://qobuz.vercel.app/`. The publicly reachable service is a Next.js web UI (home/search/transfers). No documented public JSON API or authorized stream-resolution interface was found at the supplied service URL. This project therefore **does not guess routes, scrape private APIs, extract tokens, bypass authentication, or download media**.

The default `QOBUZ_PROVIDER=stub` is intentionally honest: search returns `{ "tracks": [] }` and stream returns `404`. This is safer than falsely claiming playable Qobuz audio. The provider boundary is in `src/providers/` and can be replaced with an authorized implementation.

## Contract

- `GET /manifest.json`: stable id `com.bitchord.qobuz`, `resources: ["search", "stream"]`, `allowDownloads: 0`.
- `GET /search?q=...&quality=...&atmos=auto`: returns `{ tracks: [] }` or normalized tracks with opaque IDs.
- `GET /stream/:id?quality=...&atmos=auto`: returns a directly playable HTTPS rendition, or 404 when unavailable.
- Lossless, codec, manifest, bitrate, sample rate, bit depth, and Dolby fields are only returned when the provider supplies them. Encrypted streams and malformed URLs are refused.

## Local development

```bash
cp .env.example .env
npm install
npm run build
npm test
npm run dev
curl http://localhost:3000/manifest.json
curl 'http://localhost:3000/search?q=kind+of+blue&quality=LOSSLESS&atmos=auto'
curl -i 'http://localhost:3000/stream/qobuz_invalid000?quality=LOSSLESS&atmos=auto'
```

Node.js 20+ is required. Environment variables are read directly by the process; use a secret manager in production rather than committing `.env`.

## Connecting an authorized provider

Implement or configure only against a documented, authorized service. For the included JSON HTTP adapter:

```dotenv
QOBUZ_PROVIDER=http
QOBUZ_API_BASE_URL=https://authorized.example
QOBUZ_SEARCH_PATH=/documented/search
QOBUZ_STREAM_PATH=/documented/stream/{id}
QOBUZ_API_TOKEN=             # optional; never log it
```

The documented provider must return search JSON as either `{ "tracks": [...] }` or an array, with each usable track containing `upstreamId` and `title`. Stream JSON must contain an HTTPS `url`; set `manifest` to `none`, `hls`, or `dash` when applicable and set `encrypted: true` for protected media (it will be refused). The adapter sends `q`, `quality`, and `atmos`, applies timeouts, handles 404/429/5xx, and validates JSON shape. It does not expose the authorization header to BitChord clients.

The server maintains a short-lived in-memory mapping from each opaque `qobuz_*` id returned by search to the provider's upstream ID; `/stream` never treats the public ID as a URL. For multiple instances, replace this cache with a shared TTL store or use sticky routing. Do not put upstream URLs or credentials in public IDs.

## Production deployment

Run behind an HTTPS reverse proxy or a managed HTTPS host:

```bash
npm ci
npm run build
NODE_ENV=production HOST=127.0.0.1 PORT=3000 npm start
```

Terminate TLS at Caddy/Nginx/a managed platform and proxy to the Node process. Set a health check to `GET /manifest.json`. Ensure the proxy preserves query strings and does not log authorization headers or signed media URLs.

## Add to BitChord

After deploying, copy the HTTPS root URL (for example `https://addon.example.com`) into **BitChord → Settings → Sources → Add an addon**. BitChord will request `${ROOT_URL}/manifest.json`. The addon is streaming-only because `allowDownloads` is `0`.

## Example responses

Manifest:

```json
{"id":"com.bitchord.qobuz","name":"Qobuz","version":"1.0.0","resources":["search","stream"],"allowDownloads":0}
```

Safe default search:

```json
{"tracks":[]}
```

Not available:

```http
HTTP/1.1 404 Not Found
{"error":"track not available"}
```

A successful stream response is intentionally not fabricated; it is returned only after a configured provider supplies a validated authorized HTTPS rendition.
