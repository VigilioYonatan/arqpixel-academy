/**
 * Validates GitHub Actions workflows & pnpm supply-chain configuration against Vigilio 2026 rules:
 * - Every third-party `uses:` pinned to an immutable 40-hex commit SHA (zero mutable `@v4`/`@main`).
 * - Top-level `permissions` restricted (`contents: read`, never `write-all`).
 * - Every `actions/checkout` declares `persist-credentials: false`.
 * - `pnpm-workspace.yaml` enforces `verifyStoreIntegrity: true`, `strictDepBuilds: true`,
 *   and `dangerouslyAllowAllBuilds: false`.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export function auditWorkflowAndSupplyChain(rootDir = process.cwd()) {
  const issues = [];
  const workflowsDir = join(rootDir, '.github', 'workflows');
  if (!existsSync(workflowsDir)) {
    issues.push('Missing .github/workflows directory');
    return issues;
  }

  const ymlFiles = readdirSync(workflowsDir).filter(
    (f) => f.endsWith('.yml') || f.endsWith('.yaml'),
  );
  if (ymlFiles.length === 0) {
    issues.push('No workflow files found in .github/workflows');
  }

  for (const file of ymlFiles) {
    const content = readFileSync(join(workflowsDir, file), 'utf8');
    const lines = content.split(/\r?\n/);

    if (/permissions\s*:\s*write-all/i.test(content)) {
      issues.push(`${file}: write-all permissions are prohibited`);
    }
    if (!/permissions:\s*\r?\n\s+contents:\s*read/.test(content)) {
      issues.push(`${file}: missing top-level "permissions: contents: read"`);
    }
    if (/pull_request_target/.test(content)) {
      issues.push(`${file}: unsafe trigger pull_request_target detected`);
    }

    lines.forEach((rawLine, idx) => {
      const stripped = rawLine.replace(/#.*$/, '').trim();
      if (!stripped) return;
      const usesMatch = /^(?:-\s*)?uses:\s*([^\s]+)$/.exec(stripped);
      if (usesMatch) {
        const ref = usesMatch[1].replace(/^['"]|['"]$/g, '');
        if (!ref.startsWith('./')) {
          const atIdx = ref.lastIndexOf('@');
          const sha = atIdx > 0 ? ref.slice(atIdx + 1) : '';
          if (!/^[0-9a-f]{40}$/.test(sha)) {
            issues.push(
              `${file}:${idx + 1}: action "${ref}" must be pinned to a full 40-char commit SHA`,
            );
          }
        }
        if (ref.startsWith('actions/checkout@')) {
          const windowBlock = lines.slice(idx, idx + 6).join('\n');
          if (!/persist-credentials:\s*false/.test(windowBlock)) {
            issues.push(`${file}:${idx + 1}: actions/checkout must set persist-credentials: false`);
          }
        }
      }
    });
  }

  const wsPath = join(rootDir, 'pnpm-workspace.yaml');
  if (!existsSync(wsPath)) {
    issues.push('Missing pnpm-workspace.yaml supply-chain configuration');
  } else {
    const ws = readFileSync(wsPath, 'utf8');
    for (const rule of [
      'verifyStoreIntegrity: true',
      'strictDepBuilds: true',
      'dangerouslyAllowAllBuilds: false',
      'preferFrozenLockfile: true',
    ]) {
      if (!ws.includes(rule)) {
        issues.push(`pnpm-workspace.yaml missing required hardening rule: "${rule}"`);
      }
    }
  }

  return issues;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const issues = auditWorkflowAndSupplyChain(process.cwd());
  if (issues.length > 0) {
    console.error(`WORKFLOW & SUPPLY-CHAIN GOVERNANCE FAIL:\n${issues.join('\n')}`);
    process.exitCode = 1;
  } else {
    console.log('WORKFLOW & SUPPLY-CHAIN GOVERNANCE PASS: 40-hex SHAs, least privilege & pnpm hardening verified');
  }
}
