import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function collectTsFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) results.push(...collectTsFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.ts')) results.push(full);
  }
  return results;
}

test('ARQ-001: AGENTS.md existe, está enlazado en README y define ciclo y reglas Vigilio', () => {
  assert.equal(existsSync('AGENTS.md'), true, 'Falta AGENTS.md en la raíz');
  const agents = readFileSync('AGENTS.md', 'utf8');
  const readme = readFileSync('README.md', 'utf8');

  for (const requiredToken of [
    'DISCOVER',
    'ANALYZE',
    'BUILD',
    'VERIFY',
    'REVIEW',
    'symbol-ownership-architecture',
    'REQUIRES_REVIEW',
    'NOT_RUN',
    'arqpixel-progress-v1',
    'TODO_LO_QUE_DEBE_TENER_ESTA_APP.md',
    'docs/adr/README.md',
  ]) {
    assert.ok(agents.includes(requiredToken), `AGENTS.md omite token obligatorio: ${requiredToken}`);
  }
  assert.ok(readme.includes('AGENTS.md'), 'README.md debe enlazar AGENTS.md');
  assert.ok(readme.includes('docs/adr/README.md'), 'README.md debe enlazar el índice de ADRs');
});

test('ARQ-002: los 4 ADRs fundacionales existen y cumplen la plantilla canónica Vigilio', () => {
  const adrIndex = 'docs/adr/README.md';
  assert.equal(existsSync(adrIndex), true, 'Falta docs/adr/README.md');
  const indexContent = readFileSync(adrIndex, 'utf8');

  const adrFiles = [
    '0001-arquitectura-frontend-modular-dom-estatico-offline.md',
    '0002-contratos-schemas-borde-y-migracion-progreso.md',
    '0003-limites-evaluacion-automatica-y-revision-humana.md',
    '0004-politica-csp-cabeceras-y-seguridad-local-first.md',
  ];

  const requiredSections = [
    '## Estado',
    '## Contexto',
    '## Decision',
    '## Consecuencias',
    '## Alternativas consideradas',
    '## Fecha',
    '## Owners',
  ];

  for (const file of adrFiles) {
    assert.ok(indexContent.includes(file), `docs/adr/README.md no enlaza ${file}`);
    const fullPath = join('docs', 'adr', file);
    assert.equal(existsSync(fullPath), true, `Falta archivo ADR: ${fullPath}`);
    const body = readFileSync(fullPath, 'utf8');
    for (const heading of requiredSections) {
      assert.ok(body.includes(heading), `${file} no incluye sección canónica: ${heading}`);
    }
  }
});

test('ARQ-003: ownership arquitectónico — cero uso de any, cero carpeta contracts global y fronteras limpias', () => {
  assert.equal(existsSync('contracts'), false, 'Prohibido crear carpeta global contracts/ en raíz');
  assert.equal(existsSync(join('src', 'contracts')), false, 'Prohibido crear carpeta global src/contracts/');
  assert.equal(existsSync('packages/contracts'), false, 'Prohibido crear packages/contracts/');

  const tsFiles = collectTsFiles('src');
  assert.ok(tsFiles.length >= 16, `Se esperaban módulos desacoplados en src/, encontrados: ${tsFiles.length}`);

  for (const filePath of tsFiles) {
    const code = readFileSync(filePath, 'utf8');
    assert.equal(/\bas\s+any\b/.test(code), false, `Cast inseguro 'as any' detectado en ${filePath}`);
    assert.equal(/:\s*any\b/.test(code), false, `Anotación explícita ': any' detectada en ${filePath}`);

    if (!filePath.endsWith('app.ts')) {
      assert.equal(
        /from\s+['"][^'"]*app\.js['"]/.test(code),
        false,
        `Violación de frontera: ${filePath} no puede depender del entrypoint app.ts`,
      );
    }
  }
});
