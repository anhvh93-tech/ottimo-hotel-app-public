#!/usr/bin/env node
// Static server for the landing E2E (LP-v1): serves apps/landing-web/dist the way ADR-014 1.4 tells Caddy to –
// same security headers (CSP from apps/landing-web/src/lib/security-headers.json), try_files {path} {path}/index.html,
// /en/* → 301 without the prefix, 404 page by language prefix, cache rules, gzip for text. Never reads
// Accept-Language, never sets a cookie, never sends Vary: Accept-Language. Production headers are OPS's
// Caddyfile.prod; this mirror only lets the tests catch CSP violations and byte budgets before deploy.
// Usage: node serve.mjs [--port 5186] [--root <dist>]
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGzip } from 'node:zlib';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, '../../../apps/landing-web');
const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
};
const ROOT = path.resolve(arg('--root', process.env.LANDING_DIST ?? path.join(app, 'dist')));
const PORT = Number(arg('--port', process.env.LANDING_PORT ?? 5186));

// Keys starting with "$" are notes, not headers.
const SECURITY = Object.fromEntries(
  Object.entries(
    JSON.parse(readFileSync(path.join(app, 'src/lib/security-headers.json'), 'utf8')),
  ).filter(([name]) => !name.startsWith('$')),
);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
};
const COMPRESS = new Set(['.html', '.css', '.js', '.json', '.xml', '.txt', '.svg', '.webmanifest']);

if (!existsSync(path.join(ROOT, 'index.html'))) {
  console.error(`landing dist not found at ${ROOT} – run: pnpm --filter @ottimo/landing-web build`);
  process.exit(1);
}

function fileFor(urlPath) {
  const candidates = urlPath.endsWith('/')
    ? [`${urlPath}index.html`]
    : [urlPath, `${urlPath}/index.html`];
  for (const c of candidates) {
    const full = path.join(ROOT, c);
    if (!full.startsWith(ROOT + path.sep)) return null; // no path traversal
    if (existsSync(full) && statSync(full).isFile()) return full;
  }
  return null;
}

function cacheControl(urlPath) {
  if (urlPath.startsWith('/_astro/')) return 'public, max-age=31536000, immutable';
  if (urlPath.startsWith('/og/')) return 'public, max-age=86400';
  if (/^\/(robots\.txt|sitemap-[^/]*\.xml|favicon\.(ico|svg)|site\.webmanifest)$/.test(urlPath))
    return 'public, max-age=3600';
  return 'public, max-age=0, must-revalidate';
}

function send(req, res, status, file, extra = {}) {
  const ext = path.extname(file);
  const headers = {
    ...SECURITY,
    'Content-Type': TYPES[ext] ?? 'application/octet-stream',
    ...extra,
  };
  const gzip = COMPRESS.has(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] ?? '');
  if (gzip) {
    headers['Content-Encoding'] = 'gzip';
    headers['Vary'] = 'Accept-Encoding';
  } else {
    headers['Content-Length'] = statSync(file).size;
  }
  res.writeHead(status, headers);
  if (req.method === 'HEAD') return res.end();
  const stream = createReadStream(file);
  (gzip ? stream.pipe(createGzip({ level: 6 })) : stream).pipe(res);
}

createServer((req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
  } catch {
    res.writeHead(400, SECURITY).end();
    return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { ...SECURITY, Allow: 'GET, HEAD' }).end();
    return;
  }
  // /en and /en/* → 301 to the unprefixed path (ADR-014 1.4)
  const en = urlPath.match(/^\/en(\/.*)?$/);
  if (en) {
    res.writeHead(301, { ...SECURITY, Location: en[1] ?? '/' }).end();
    return;
  }
  const blocked = /^\/(v1|__test__)(\/|$)|^\/health$/.test(urlPath);
  const file = blocked ? null : fileFor(urlPath);
  if (file) {
    send(req, res, 200, file, { 'Cache-Control': cacheControl(urlPath) });
    return;
  }
  const notFound = urlPath.startsWith('/vi/')
    ? path.join(ROOT, 'vi/404/index.html')
    : path.join(ROOT, '404.html');
  send(req, res, 404, notFound, { 'Cache-Control': 'no-store' });
}).listen(PORT, '127.0.0.1', () => {
  console.log(`landing dist ${ROOT} on http://127.0.0.1:${PORT}`);
});
