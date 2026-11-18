/**
 * Deterministic, offline CycloneDX 1.5 inventory of shipped components.
 * NOT a vulnerability database check, signature attestation or complete source provenance.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const readJson = (filename) => JSON.parse(readFileSync(filename, 'utf8'));
const hash = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');

export function buildSbom() {
  const app = readJson('package.json');
  const compiler = readJson('tools/typescript/package.json');
  if (compiler.name !== 'typescript' || compiler.license !== 'Apache-2.0') {
    throw new Error('Unrecognized vendored compiler metadata');
  }
  const devDeps = Object.entries(app.devDependencies || {});
  const ref = `pkg:npm/${encodeURIComponent(app.name)}@${app.version}`;
  const tsRef = `pkg:npm/typescript@${compiler.version}`;
  const components = [
    {
      type: 'library',
      name: 'typescript',
      version: compiler.version,
      purl: tsRef,
      scope: 'required',
      licenses: [{ license: { id: compiler.license } }],
      hashes: [{ alg: 'SHA-256', content: hash('tools/typescript/lib/tsc.js') }],
      properties: [
        { name: 'arqpixel:distribution', value: 'vendored-build-tool' },
        { name: 'arqpixel:runtime', value: 'not-used-by-browser' },
      ],
    },
  ];

  for (const [name, version] of devDeps) {
    if (!/^\d+\.\d+\.\d+$/.test(version)) {
      throw new Error(`Unpinned optional development dependency: ${name}`);
    }
    const purl = `pkg:npm/${name.startsWith('@') ? `%40${name.slice(1)}` : name}@${version}`;
    if (name === 'three' && existsSync('public/vendor/three/package.json')) {
      const threePkg = readJson('public/vendor/three/package.json');
      if (threePkg.version !== version || threePkg.license !== 'MIT') {
        throw new Error('Vendored three metadata mismatch with package.json');
      }
      components.push({
        type: 'library',
        name,
        version,
        purl,
        scope: 'optional',
        licenses: [{ license: { id: 'MIT' } }],
        hashes: [
          { alg: 'SHA-256', content: hash('public/vendor/three/three.module.js') },
          { alg: 'SHA-256', content: hash('public/vendor/three/three.core.js') },
        ],
        properties: [
          { name: 'arqpixel:distribution', value: 'vendored-lazy-3d-minigames-only' },
          { name: 'arqpixel:verification', value: 'no-vulnerability-lookup-performed' },
        ],
      });
      continue;
    }

    components.push({
      type: 'library',
      name,
      version,
      purl,
      scope: 'optional',
      properties: [
        { name: 'arqpixel:distribution', value: 'declared-not-bundled' },
        { name: 'arqpixel:verification', value: 'no-vulnerability-lookup-performed' },
      ],
    });
  }

  return {
    bomFormat: 'CycloneDX',
    specVersion: '1.5',
    version: 1,
    metadata: {
      component: { type: 'application', name: app.name, version: app.version, bomRef: ref },
      properties: [
        {
          name: 'arqpixel:limitations',
          value: 'Offline component inventory only; no CVE/SCA analysis, no signed provenance',
        },
      ],
    },
    components,
    dependencies: [{ ref, dependsOn: components.map((c) => c.purl) }],
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = buildSbom();
  mkdirSync('security', { recursive: true });
  writeFileSync('security/sbom.cdx.json', `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  console.log(`SBOM PASS: ${result.components.length} libraries inventoried (not vulnerability-scanned)`);
}
