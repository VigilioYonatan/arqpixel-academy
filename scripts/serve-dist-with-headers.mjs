/**
 * Serves `dist/` over local HTTP (`127.0.0.1`) applying the exact security headers
 * declared in `dist/_headers` (`Content-Security-Policy` without `'unsafe-inline'`,
 * `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`).
 */
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.md': 'text/markdown; charset=utf-8',
  '.ico': 'image/x-icon',
};

export function parseStaticHeadersFile(rawText) {
  const headers = {};
  for (const rawLine of rawText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith('/')) continue;
    const colon = line.indexOf(':');
    if (colon <= 0) continue;
    const name = line.slice(0, colon).trim();
    let value = line.slice(colon + 1).trim();
    // On plain HTTP loopback (`127.0.0.1`), `upgrade-insecure-requests` would rewrite subresources to `https://127.0.0.1`.
    // Preserve every CSP directive intact while stripping only `upgrade-insecure-requests` on local plain-HTTP loopback.
    if (name.toLowerCase() === 'content-security-policy') {
      value = value
        .split(';')
        .map((d) => d.trim())
        .filter((d) => d && d.toLowerCase() !== 'upgrade-insecure-requests')
        .join('; ');
    }
    headers[name] = value;
  }
  return headers;
}

export function createDistHttpServer(distRoot = resolve('dist')) {
  const headersPath = join(distRoot, '_headers');
  const parsedHeaders = existsSync(headersPath)
    ? parseStaticHeadersFile(readFileSync(headersPath, 'utf8'))
    : {};

  return createServer((req, res) => {
    for (const [k, v] of Object.entries(parsedHeaders)) {
      res.setHeader(k, v);
    }

    const method = req.method || 'GET';
    if (method !== 'GET' && method !== 'HEAD') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Method Not Allowed');
      return;
    }

    const rawUrl = (req.url || '/').split('?')[0].split('#')[0];
    let decodedPath = '/';
    try {
      decodedPath = decodeURIComponent(rawUrl);
    } catch {
      res.statusCode = 400;
      res.end('Bad Request');
      return;
    }

    const relPath = decodedPath === '/' ? 'index.html' : decodedPath.replace(/^\/+/, '');
    const safeTarget = resolve(distRoot, normalize(relPath));
    if (safeTarget !== distRoot && !safeTarget.startsWith(`${distRoot}${sep}`)) {
      res.statusCode = 403;
      res.end('Forbidden');
      return;
    }

    if (!existsSync(safeTarget) || !statSync(safeTarget).isFile()) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Not Found');
      return;
    }

    const ext = extname(safeTarget).toLowerCase();
    res.statusCode = 200;
    res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
    res.setHeader(
      'Cache-Control',
      ext === '.html' || ext === '.json' ? 'no-cache' : 'public, max-age=3600',
    );

    if (method === 'HEAD') {
      res.end();
      return;
    }
    res.end(readFileSync(safeTarget));
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const portIdx = process.argv.indexOf('--port');
  const port = portIdx >= 0 ? Number(process.argv[portIdx + 1]) : Number(process.env.PORT || 4173);
  const host = process.env.HOST || '127.0.0.1';
  const server = createDistHttpServer(resolve('dist'));
  server.listen(port, host, () => {
    console.log(`ARQPIXEL HTTP server ready at http://${host}:${port}`);
  });
}
