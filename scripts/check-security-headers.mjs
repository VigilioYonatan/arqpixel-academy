import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
export function checkHeaders(html, headers) {
  const issues = [];
  const required = [
    "default-src 'none'",
    "script-src 'self'",
    "style-src 'self'",
    "font-src 'self'",
    "media-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
  ];
  if (!html.includes('http-equiv="Content-Security-Policy"')) issues.push('missing browser CSP meta');
  for (const rule of required) if (!html.includes(rule)) issues.push(`CSP missing ${rule}`);
  if (html.includes("'unsafe-inline'") || html.includes("'unsafe-eval'")) {
    issues.push('CSP must not contain unsafe-inline or unsafe-eval in HTML');
  }
  if (headers.includes("'unsafe-inline'") || headers.includes("'unsafe-eval'")) {
    issues.push('host CSP must not contain unsafe-inline or unsafe-eval');
  }
  for (const rule of ['X-Content-Type-Options: nosniff', 'Referrer-Policy: no-referrer', 'X-Frame-Options: DENY']) if (!headers.includes(rule)) issues.push(`host headers missing ${rule}`);
  if (!headers.includes('frame-ancestors \'none\'')) issues.push('host CSP frame-ancestors missing');
  return issues;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const issues = checkHeaders(readFileSync('index.html','utf8'), readFileSync('public/_headers','utf8'));
  if (issues.length) {console.error(issues.join('\n'));process.exitCode=1;}
  else console.log('SECURITY HEADERS PASS: static policies declared (deployment-dependent)');
}
