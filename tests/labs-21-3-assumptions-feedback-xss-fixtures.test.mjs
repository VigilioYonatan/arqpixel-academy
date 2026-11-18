import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

describe('Feature: BDD §21.3 Laboratorios (L2600–L2604) — Supuestos explícitos, edición sin drag-and-drop, feedback por fallo, SVG sin XSS y fixtures positivo/negativo/límite', () => {
  it('Scenario L2600: Given los 8 estudios de laboratorio, When se renderiza su cabecera de telemetría, Then etiqueta modelo, 3 supuestos, límites fuera de alcance y SVG animado sin style inline', async () => {
    const { LAB_STUDIOS } = await import('../dist/features/labs/constants/labs.constants.js');
    const { LAB_TELEMETRY_SPECS } = await import(
      '../dist/features/labs/constants/lab-fixtures.constants.js'
    );
    const { renderLabTelemetryHeaderHtml } = await import(
      '../dist/features/labs/lab-visual-diagnostics.js'
    );

    assert.equal(LAB_STUDIOS.length, 8);
    for (const studio of LAB_STUDIOS) {
      const spec = LAB_TELEMETRY_SPECS[studio.id];
      assert.ok(spec, `Missing telemetry spec for ${studio.id}`);
      assert.equal(spec.assumptions.length, 3);
      assert.ok(spec.outOfScopeNotice.length > 20);

      const html = renderLabTelemetryHeaderHtml(studio.id);
      assert.match(html, new RegExp(`data-lab-model-badge="${studio.id}"`));
      assert.match(html, /SUPUESTO 01/);
      assert.match(html, /SUPUESTO 03/);
      assert.match(html, /Alcance y límites del modelo/);
      assert.match(html, /class="arch-flow-edge"/);
      assert.equal(/\bstyle\s*=\s*["']/.test(html), false);
    }
  });

  it('Scenario L2601: Given un modelo C4 editable sin drag-and-drop, When se reordenan y renombran nodos por controles discretos, Then respeta límites y preserva integridad de IDs', async () => {
    const { C4_LEVEL_PRESETS, moveC4ContainerOrder, renameC4ContainerLabel } = await import(
      '../dist/c4-studio.js'
    );

    const initial = C4_LEVEL_PRESETS.C2.containers;
    const moved_down = moveC4ContainerOrder(initial, 0, 'down');
    assert.equal(moved_down[0].id, initial[1].id);
    assert.equal(moved_down[1].id, initial[0].id);

    // Boundary: moving index 0 'up' is a safe no-op
    const moved_top_noop = moveC4ContainerOrder(initial, 0, 'up');
    assert.deepEqual(
      moved_top_noop.map((c) => c.id),
      initial.map((c) => c.id),
    );

    const renamed = renameC4ContainerLabel(initial, 'api-pedidos', 'API Pedidos v2');
    assert.equal(renamed.find((c) => c.id === 'api-pedidos')?.label, 'API Pedidos v2');

    // Invalid empty rename is rejected cleanly
    const rejected_rename = renameC4ContainerLabel(initial, 'api-pedidos', ' ');
    assert.equal(rejected_rename.find((c) => c.id === 'api-pedidos')?.label, 'API Pedidos');
  });

  it('Scenario L2602: Given fallos distintos en el constructor de dependencias y en el editor ADR, When se diagnostican, Then cada fallo recibe código, causa raíz y acción correctiva específica', async () => {
    const { diagnoseAdrDraftFields, diagnoseDependencyFailures } = await import(
      '../dist/features/labs/lab-visual-diagnostics.js'
    );

    const dep_diag = diagnoseDependencyFailures([
      ['Dominio', 'Infraestructura'],
      ['Aplicación', 'Presentación'],
      ['Infraestructura', 'Presentación'],
      ['Dominio', 'Dominio'],
      ['Presentación', 'Aplicación'],
    ]);

    assert.equal(dep_diag.valid, false);
    assert.equal(dep_diag.cycle, true);
    const codes = new Set(dep_diag.failures.map((f) => f.code));
    assert.ok(codes.has('DOMAIN_OUTWARD_DEPENDENCY'));
    assert.ok(codes.has('APPLICATION_TO_PRESENTATION'));
    assert.ok(codes.has('INFRASTRUCTURE_TO_PRESENTATION'));
    assert.ok(codes.has('SELF_DEPENDENCY'));
    assert.ok(codes.has('DIRECTED_CYCLE'));
    for (const failure of dep_diag.failures) {
      assert.ok(failure.reason.length > 15);
      assert.ok(failure.fixAction.length > 15);
    }

    const adr_diag = diagnoseAdrDraftFields({
      title: 'ADR',
      context: 'Corto',
      decision: 'Corto',
      tradeoff: 'Corto',
    });
    assert.equal(adr_diag.complete, false);
    assert.equal(adr_diag.failures.length, 4);
  });

  it('Scenario L2603: Given etiquetas adversarias con <script>, onload=, javascript: y <foreignObject>, When se exportan diagramas C4, Capas y DDD en SVG, Then el SVG resultante es 100 % inerte y libre de scripts', async () => {
    const { c4Svg } = await import('../dist/c4-studio.js');
    const { exportDddContextMapSvg } = await import('../dist/ddd-workshop.js');
    const { renderDependencyLayerSvgHtml, sanitizeAndVerifySvgExport } = await import(
      '../dist/features/labs/lab-visual-diagnostics.js'
    );

    const c4_xss_svg = c4Svg({
      kind: 'C4-containers-educational',
      system: 'NexoShop',
      level: 'C2',
      containers: [
        { id: 'w1', label: 'Web <script>alert(1)</script>', type: 'Frontend' },
        { id: 'a1', label: 'API " onload="alert(2)', type: 'API' },
      ],
      relations: [{ from: 'w1', to: 'a1', label: 'javascript:alert(3)' }],
    });
    const verified_c4 = sanitizeAndVerifySvgExport(c4_xss_svg);
    assert.equal(verified_c4.safe, true);
    assert.equal(/<script\b/i.test(verified_c4.svg), false);
    assert.equal(/\sonload\s*=/i.test(verified_c4.svg), false);

    const ddd_xss_svg = sanitizeAndVerifySvgExport(
      exportDddContextMapSvg([
        {
          upstream: 'Ventas',
          downstream: 'Pagos',
          pattern: 'Domain Events',
          contractSummary: '<script>evil()</script>',
        },
      ]),
    );
    assert.equal(ddd_xss_svg.safe, true);
    assert.equal(/<script\b/i.test(ddd_xss_svg.svg), false);

    const raw_hostile_svg =
      '<svg><script>alert(1)</script><foreignObject><iframe src="javascript:evil()"></iframe></foreignObject><rect onload="evil()" width="10" height="10"/></svg>';
    const cleaned = sanitizeAndVerifySvgExport(raw_hostile_svg);
    assert.equal(cleaned.safe, true);
    assert.ok(cleaned.strippedCount >= 3);
    assert.equal(/<script|<foreignObject|<iframe|\sonload=|javascript:/i.test(cleaned.svg), false);

    const dep_svg = renderDependencyLayerSvgHtml([['Presentación', 'Aplicación']]);
    assert.equal(sanitizeAndVerifySvgExport(dep_svg).safe, true);
  });

  it('Scenario L2604: Given los fixtures canónicos POSITIVE, NEGATIVE y BOUNDARY de dependencias, C4, DDD y ADR, When se evalúan contra sus motores reales, Then cumplen exactamente los resultados esperados', async () => {
    const { analyzeC4Semantics, validateC4 } = await import('../dist/c4-studio.js');
    const { evaluateDddAggregateDesign, validateDddContextMap } = await import(
      '../dist/ddd-workshop.js'
    );
    const {
      ADR_BOUNDARY_FIXTURES,
      C4_VERIFICATION_FIXTURES,
      DDD_VERIFICATION_FIXTURES,
      DEPENDENCY_VERIFICATION_FIXTURES,
    } = await import('../dist/features/labs/constants/lab-fixtures.constants.js');
    const { diagnoseAdrDraftFields, diagnoseDependencyFailures } = await import(
      '../dist/features/labs/lab-visual-diagnostics.js'
    );

    // 1. Dependency fixtures: positive, negative, boundary
    for (const kind of ['positive', 'negative', 'boundary']) {
      const fx = DEPENDENCY_VERIFICATION_FIXTURES[kind];
      const res = diagnoseDependencyFailures(fx.edges);
      assert.equal(res.valid, fx.expectedValid, `Dependency fixture ${kind} mismatch`);
    }

    // 2. C4 fixtures: positive, negative, boundary (exact 12 containers)
    for (const kind of ['positive', 'negative', 'boundary']) {
      const fx = C4_VERIFICATION_FIXTURES[kind];
      assert.equal(validateC4(fx.model).length === 0, fx.expectedValidSyntax);
      const high_warnings = analyzeC4Semantics(fx.model).filter((w) => w.severity === 'high');
      assert.equal(high_warnings.length === 0, fx.expectedZeroHighWarnings);
    }
    assert.equal(C4_VERIFICATION_FIXTURES.boundary.model.containers.length, 12);

    // 3. DDD fixtures: positive, negative, boundary
    for (const kind of ['positive', 'negative', 'boundary']) {
      const fx = DDD_VERIFICATION_FIXTURES[kind];
      assert.equal(validateDddContextMap(fx.contextMap).valid, fx.expectedContextMapValid);
      assert.equal(evaluateDddAggregateDesign(fx.aggregate).status, fx.expectedAggregateStatus);
    }

    // 4. ADR boundary fixtures (MIN_ADR_FIELD_LENGTH - 1 -> FAIL, exact MIN_ADR_FIELD_LENGTH -> PASS)
    assert.equal(diagnoseAdrDraftFields(ADR_BOUNDARY_FIXTURES.positive).complete, true);
    assert.equal(diagnoseAdrDraftFields(ADR_BOUNDARY_FIXTURES.negative).complete, false);
    assert.equal(
      diagnoseAdrDraftFields(ADR_BOUNDARY_FIXTURES.boundaryFailJustBelowMin).complete,
      false,
    );
    assert.equal(
      diagnoseAdrDraftFields(ADR_BOUNDARY_FIXTURES.boundaryPassExactMin).complete,
      true,
    );
  });
});
