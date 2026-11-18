/**
 * Verifies deterministic lockfile (`pnpm-lock.yaml`) & pinned toolchain versions against
 * `package.json` and `compatibility.json` (zero floating ranges, zero unpinned devDependencies).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export function verifyToolchainAndLockfile(rootDir = process.cwd()) {
  const errors = [];
  const pkgPath = join(rootDir, 'package.json');
  const compatPath = join(rootDir, 'compatibility.json');
  const lockPath = join(rootDir, 'pnpm-lock.yaml');

  if (!existsSync(pkgPath)) return { ok: false, errors: ['Missing package.json'] };
  if (!existsSync(compatPath)) return { ok: false, errors: ['Missing compatibility.json'] };
  if (!existsSync(lockPath)) return { ok: false, errors: ['Missing pnpm-lock.yaml'] };

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  const compat = JSON.parse(readFileSync(compatPath, 'utf8'));
  const lockText = readFileSync(lockPath, 'utf8');
  const compatTools = compat?.vigilio_baseline?.pinned_dev_toolchain || {};

  if (typeof pkg.packageManager !== 'string' || !/^pnpm@\d+\.\d+\.\d+$/.test(pkg.packageManager)) {
    errors.push(
      `package.json must pin exact packageManager pnpm@X.Y.Z, got "${pkg.packageManager}"`,
    );
  } else if (compatTools.pnpm && pkg.packageManager !== `pnpm@${compatTools.pnpm}`) {
    errors.push(
      `packageManager drift: package.json=${pkg.packageManager} vs compatibility.json=pnpm@${compatTools.pnpm}`,
    );
  }

  if (!/^(?:---\r?\n)?lockfileVersion:\s*'9\.0'/.test(lockText)) {
    errors.push("pnpm-lock.yaml missing lockfileVersion: '9.0' header");
  }

  if (!lockText.includes('integrity: sha512-')) {
    errors.push('pnpm-lock.yaml missing SHA-512 integrity hashes');
  }

  const devDeps = pkg.devDependencies || {};
  for (const [name, version] of Object.entries(devDeps)) {
    if (typeof version !== 'string' || !/^\d+\.\d+\.\d+$/.test(version)) {
      errors.push(`devDependency "${name}" must be pinned to exact X.Y.Z, got "${version}"`);
      continue;
    }
    if (compatTools[name] && compatTools[name] !== version) {
      errors.push(
        `Version drift for "${name}": package.json=${version} vs compatibility.json=${compatTools[name]}`,
      );
    }
    if (!lockText.includes(name) || !lockText.includes(version)) {
      errors.push(`pnpm-lock.yaml missing resolved entry for ${name}@${version}`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = verifyToolchainAndLockfile(process.cwd());
  if (!result.ok) {
    console.error(`TOOLCHAIN & LOCKFILE FAIL:\n${result.errors.join('\n')}`);
    process.exitCode = 1;
  } else {
    console.log(
      'TOOLCHAIN & LOCKFILE PASS: pnpm-lock.yaml, package.json & compatibility.json aligned',
    );
  }
}
