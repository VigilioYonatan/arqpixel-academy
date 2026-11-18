import { existsSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function licenseCheck(root = '.') {
  const requiredFiles = [
    'tools/typescript/LICENSE.txt',
    'tools/typescript/ThirdPartyNoticeText.txt',
    'tools/typescript/package.json',
  ];
  if (existsSync(`${root}/public/vendor/three`)) {
    requiredFiles.push('public/vendor/three/LICENSE', 'public/vendor/three/package.json');
  }
  if (existsSync(`${root}/public/fonts`)) {
    requiredFiles.push('public/fonts/OFL-LICENSES.txt', 'public/fonts/silkscreen-latin.woff2');
  }
  const missing = requiredFiles.filter((p) => !existsSync(`${root}/${p}`));
  if (missing.length) return { pass: false, errors: missing };

  const errors = [];
  const tsPkg = JSON.parse(readFileSync(`${root}/tools/typescript/package.json`, 'utf8'));
  if (tsPkg.license !== 'Apache-2.0') {
    errors.push(`Unrecognized TypeScript license: ${tsPkg.license}`);
  }
  if (existsSync(`${root}/public/vendor/three/package.json`)) {
    const threePkg = JSON.parse(readFileSync(`${root}/public/vendor/three/package.json`, 'utf8'));
    if (threePkg.license !== 'MIT') {
      errors.push(`Unrecognized Three.js license: ${threePkg.license}`);
    }
  }
  return { pass: errors.length === 0, errors };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = licenseCheck();
  if (!result.pass) {
    console.error(result.errors.join('\n'));
    process.exitCode = 1;
  } else {
    console.log('VENDORED LICENSES PASS (TypeScript Apache-2.0 + Three.js MIT)');
  }
}
