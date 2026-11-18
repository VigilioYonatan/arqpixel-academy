/** Offline, conservative source secret scanner. Does NOT replace Gitleaks/TruffleHog. */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

const IGNORED = new Set(['.git', 'node_modules', 'dist', 'tools', 'coverage', '.tmp', 'playwright-report', 'test-results', 'ARQPIXEL_COMPLETO']);
const SOURCE_EXT = new Set(['.ts', '.js', '.mjs', '.json', '.html', '.css', '.yaml', '.yml', '.toml', '.env']);
const TOKENS = [
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/],
  ['AWS access key', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  ['GitHub token', /\bgh[pousr]_[A-Za-z0-9_]{30,}\b/],
  ['GitHub fine-grained token', /\bgithub_pat_[A-Za-z0-9_]{60,}\b/],
  ['Slack credential', /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/],
  ['Stripe secret', /\bsk_(?:live|test)_[A-Za-z0-9]{20,}\b/],
];
const BLOCKED_FILES = [/^\.env(?:\.|$)/, /\.(?:pem|p12|pfx|key)$/i, /^id_(?:rsa|ed25519|ecdsa)$/];
export function scanTree(root) {
  const findings = [];
  const walk = (dir) => {
    for (const item of readdirSync(dir, { withFileTypes: true })) {
      if (item.isSymbolicLink()) { findings.push({ file: relative(root, join(dir, item.name)), issue: 'symbolic link prohibited in release' }); continue; }
      if (item.isDirectory()) { if (!IGNORED.has(item.name)) walk(join(dir, item.name)); continue; }
      if (!item.isFile()) continue;
      const full = join(dir, item.name), file = relative(root, full);
      if (BLOCKED_FILES.some(rule => rule.test(item.name))) { findings.push({file, issue:'sensitive file name'}); continue; }
      if (!SOURCE_EXT.has(item.name.slice(item.name.lastIndexOf('.')))) continue;
      if (statSync(full).size > 2_000_000) continue;
      const data = readFileSync(full, 'utf8');
      for (const [issue, regex] of TOKENS) if (regex.test(data)) findings.push({ file, issue });
    }
  };
  walk(root);
  return findings;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const findings = scanTree(process.cwd());
  if (findings.length) { for (const {file,issue} of findings) console.error(`SECRET SCAN FAIL ${file}: ${issue}`); process.exitCode = 1; }
  else console.log('SECRET SCAN PASS (heuristic patterns; not full historical/entropy scan)');
}
