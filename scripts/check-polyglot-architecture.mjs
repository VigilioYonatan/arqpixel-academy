/**
 * P2 L1253: Automated Polyglot Hexagonal Architecture-of-Imports & Invariant Audit
 * across TypeScript (`examples/nexoshop-reference-nestjs`), C# (`examples/nexoshop-reference-csharp`),
 * and Java (`examples/nexoshop-reference-java`).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

function walkSourceFiles(dir, extensions) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'bin' || entry.name === 'obj') {
      continue;
    }
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkSourceFiles(full, extensions));
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      out.push(full);
    }
  }
  return out;
}

function classifyHexagonalLayer(relPosix) {
  const lower = relPosix.toLowerCase();
  if (lower.includes('/domain/')) return 'domain';
  if (lower.includes('/application/')) return 'application';
  if (lower.includes('/infrastructure/')) return 'infrastructure';
  if (lower.includes('/presentation/')) return 'presentation';
  return 'other';
}

export function verifyPolyglotArchitecture(examplesRoot = join(process.cwd(), 'examples')) {
  const violations = [];
  const stacks = [
    { id: 'typescript-nestjs', dir: join(examplesRoot, 'nexoshop-reference-nestjs'), exts: ['.ts'] },
    { id: 'csharp-dotnet8', dir: join(examplesRoot, 'nexoshop-reference-csharp'), exts: ['.cs'] },
    { id: 'java-21', dir: join(examplesRoot, 'nexoshop-reference-java'), exts: ['.java'] },
  ];

  const checkedCounts = {};

  for (const stack of stacks) {
    if (!existsSync(stack.dir)) {
      violations.push(`[${stack.id}] Missing reference repository directory: ${stack.dir}`);
      continue;
    }
    if (existsSync(join(stack.dir, 'contracts')) || existsSync(join(stack.dir, 'src', 'contracts'))) {
      violations.push(`[${stack.id}] Prohibited global contracts/ folder detected`);
    }

    const files = walkSourceFiles(stack.dir, stack.exts);
    checkedCounts[stack.id] = files.length;
    if (files.length < 3) {
      violations.push(`[${stack.id}] Expected at least 3 layered source files, found ${files.length}`);
    }

    for (const file of files) {
      const rel = relative(stack.dir, file).replace(/\\/g, '/');
      const layer = classifyHexagonalLayer(rel);
      const source = readFileSync(file, 'utf8');

      if (layer === 'domain') {
        if (stack.id === 'typescript-nestjs' && /from\s+['"][^'"]*(?:infrastructure|presentation|application)/i.test(source)) {
          violations.push(`[${stack.id}] Domain layer violation in ${rel}: imports outer layer`);
        }
        if (stack.id === 'csharp-dotnet8' && /\busing\s+[\w.]*(?:Infrastructure|Presentation|Application|EntityFramework|AspNetCore)/i.test(source)) {
          violations.push(`[${stack.id}] Domain layer violation in ${rel}: using outer/framework namespace`);
        }
        if (stack.id === 'java-21' && /\bimport\s+[\w.]*(?:infrastructure|presentation|application|jakarta\.persistence|springframework)/i.test(source)) {
          violations.push(`[${stack.id}] Domain layer violation in ${rel}: imports outer/framework package`);
        }
      }

      if (layer === 'application') {
        if (stack.id === 'typescript-nestjs' && /from\s+['"][^'"]*(?:infrastructure|presentation)/i.test(source)) {
          violations.push(`[${stack.id}] Application layer violation in ${rel}: imports infrastructure/presentation`);
        }
        if (stack.id === 'csharp-dotnet8' && /\busing\s+[\w.]*(?:Infrastructure|Presentation)/i.test(source)) {
          violations.push(`[${stack.id}] Application layer violation in ${rel}: using Infrastructure/Presentation`);
        }
        if (stack.id === 'java-21' && /\bimport\s+[\w.]*(?:infrastructure|presentation)/i.test(source)) {
          violations.push(`[${stack.id}] Application layer violation in ${rel}: imports infrastructure/presentation`);
        }
      }
    }
  }

  return {
    ok: violations.length === 0,
    checkedCounts,
    violations,
    compilerExecutionHonesty: {
      typescript_tsc_and_node_test: 'EXECUTED_IN_DEVSECOPS_PIPELINE',
      csharp_dotnet_sdk_build: 'NOT_RUN_NO_DOTNET_SDK_INSTALLED',
      java_javac_build: 'NOT_RUN_NO_JDK_INSTALLED',
    },
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const res = verifyPolyglotArchitecture();
  if (!res.ok) {
    console.error(`POLYGLOT ARCHITECTURE FAIL:\n${res.violations.join('\n')}`);
    process.exitCode = 1;
  } else {
    console.log(
      `POLYGLOT ARCHITECTURE PASS: TS (${res.checkedCounts['typescript-nestjs']} files), C# (${res.checkedCounts['csharp-dotnet8']} files), Java (${res.checkedCounts['java-21']} files) respect Domain/Application hexagonal boundaries.`,
    );
  }
}
