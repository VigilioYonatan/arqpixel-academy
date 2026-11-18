/**
 * P2 L1255: Dimensional Capacity, Uncertainty, FinOps Cost, Sensitivity & Reproducible Stress Lab.
 * Uses explicit engineering units (`req/s`, `ms`, `vCPU`, `GiB`, `SQL conn`, `USD/mes`) and seeded stress waves.
 */
export const STRESS_WAVE_SCENARIOS = Object.freeze([
    {
        id: 'flash_sale_5x',
        label: 'Campaña Flash 5× (Pico comercial programado)',
        trafficMultiplier: 5.0,
        latencyPenaltyMs: 18,
        cacheHitDropPct: 10,
    },
    {
        id: 'az_failover_2x',
        label: 'Caída de Zona de Disponibilidad (AZ Failover 2× sobre nodos vivos)',
        trafficMultiplier: 2.0,
        latencyPenaltyMs: 25,
        cacheHitDropPct: 15,
    },
    {
        id: 'cold_cache_stampede',
        label: 'Cache Stampede en frío (Caída de hit ratio -65 %)',
        trafficMultiplier: 1.6,
        latencyPenaltyMs: 85,
        cacheHitDropPct: 65,
    },
    {
        id: 'degraded_psp_retry_storm',
        label: 'Tormenta de Reintentos por PSP lento (+140 ms)',
        trafficMultiplier: 2.8,
        latencyPenaltyMs: 140,
        cacheHitDropPct: 5,
    },
]);
export function evaluateDimensionalCapacityAndStress(input) {
    const scenario = STRESS_WAVE_SCENARIOS.find((s) => s.id === input.stressScenarioId) ?? STRESS_WAVE_SCENARIOS[0];
    const seed_jitter = 1 + ((Math.abs(input.seed) % 7) - 3) * 0.02;
    const effective_cache_pct = Math.max(0, Math.min(98, input.cacheHitPercent - scenario.cacheHitDropPct));
    const db_miss_ratio = 1 - effective_cache_pct / 100;
    // Little's Law & CPU/DB bottleneck approximation with explicit units
    const effective_db_ms = Math.max(2, input.dbMeanLatencyMs + scenario.latencyPenaltyMs * db_miss_ratio);
    const cpu_cap_per_vcpu_rps = 185;
    const total_vcpu = Math.max(1, input.replicasCount * input.vcpuPerReplica);
    const total_ram_gib = total_vcpu * 2;
    const total_sql_conns = input.replicasCount * input.sqlPoolPerReplica;
    const cpu_ceiling_rps = total_vcpu * cpu_cap_per_vcpu_rps;
    const db_conn_ceiling_rps = db_miss_ratio > 0.02
        ? Math.round((total_sql_conns * (1000 / effective_db_ms)) / db_miss_ratio)
        : cpu_ceiling_rps * 2;
    const max_sustainable_rps = Math.max(20, Math.round(Math.min(cpu_ceiling_rps, db_conn_ceiling_rps)));
    const p50_demand_rps = Math.round(input.baselineRps * scenario.trafficMultiplier * input.retryAmplificationFactor * seed_jitter);
    const p95_demand_rps = Math.round(p50_demand_rps * 1.18);
    const p99_demand_rps = Math.round(p50_demand_rps * 1.34);
    const utilization = p95_demand_rps / max_sustainable_rps;
    const queueing_multiplier = utilization >= 1 ? 3.4 : utilization > 0.75 ? 1 + (utilization - 0.75) * 4.5 : 1.0;
    const p95_latency_ms = Math.round((14 + effective_db_ms * db_miss_ratio) * queueing_multiplier);
    // Explicit FinOps monthly cost in USD/mes (compute + RAM + managed SQL connections)
    const monthly_usd = Math.round(total_vcpu * 34 + total_ram_gib * 4.5 + Math.ceil(total_sql_conns / 50) * 48);
    const sensitivity = [
        {
            factorLabel: 'Nominal del escenario (P95)',
            p95LatencyMs: p95_latency_ms,
            maxSustainableRps: max_sustainable_rps,
            saturationPercent: Math.round(utilization * 100),
        },
        {
            factorLabel: 'Sensibilidad: Latencia SQL ×2',
            p95LatencyMs: Math.round(p95_latency_ms * 1.65),
            maxSustainableRps: Math.round(Math.min(cpu_ceiling_rps, db_miss_ratio > 0.02 ? (total_sql_conns * (1000 / (effective_db_ms * 2))) / db_miss_ratio : cpu_ceiling_rps)),
            saturationPercent: Math.round((p95_demand_rps / Math.max(20, db_conn_ceiling_rps / 2)) * 100),
        },
        {
            factorLabel: 'Sensibilidad: Sin reintentos descontrolados (1.0×)',
            p95LatencyMs: Math.max(12, Math.round(p95_latency_ms * 0.78)),
            maxSustainableRps: max_sustainable_rps,
            saturationPercent: Math.round(((p95_demand_rps / Math.max(1, input.retryAmplificationFactor)) / max_sustainable_rps) * 100),
        },
    ];
    const status = p95_demand_rps > max_sustainable_rps
        ? 'SATURATED'
        : max_sustainable_rps > p99_demand_rps * 2.8
            ? 'OVERPROVISIONED'
            : 'PASS';
    const diagnosis = status === 'SATURATED'
        ? `Saturación en ${p95_demand_rps} req/s vs techo ${max_sustainable_rps} req/s (${total_vcpu} vCPU, ${total_sql_conns} conn SQL). Reduce amplificación de retries o ajusta réplicas/caché.`
        : status === 'OVERPROVISIONED'
            ? `Sobredimensionamiento FinOps (${monthly_usd} USD/mes): capacidad ${max_sustainable_rps} req/s casi triplica la banda P99 (${p99_demand_rps} req/s).`
            : `Equilibrio sano (${monthly_usd} USD/mes): ${max_sustainable_rps} req/s absorbe P95 (${p95_demand_rps} req/s) con p95 ~${p95_latency_ms} ms.`;
    return {
        scenario,
        effectiveDemandRps: p95_demand_rps,
        uncertaintyBandRps: [p50_demand_rps, p95_demand_rps, p99_demand_rps],
        maxClusterSustainableRps: max_sustainable_rps,
        totalVcpu: total_vcpu,
        totalRamGib: total_ram_gib,
        totalSqlConnections: total_sql_conns,
        estimatedP95LatencyMs: p95_latency_ms,
        estimatedMonthlyCostUsd: monthly_usd,
        status,
        sensitivityMatrix: sensitivity,
        diagnosis,
    };
}
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] || ch));
export function renderDimensionalCapacitySvgHtml(rep) {
    const max_scale = Math.max(rep.maxClusterSustainableRps, rep.uncertaintyBandRps[2], 100);
    const wBar = (val) => Math.max(18, Math.min(460, Math.round((val / max_scale) * 460)));
    const cap_color = rep.status === 'PASS' ? '#53e2ba' : '#ffb74d';
    return `<div class="map-svg-wrap my-14" tabindex="0" role="region" aria-label="Gráfico de bandas de incertidumbre P50 P95 P99 frente a capacidad sostenible">
    <svg class="senior-pipeline-svg" viewBox="0 0 720 132" role="img" aria-label="Demanda P95 ${rep.uncertaintyBandRps[1]} req/s vs Capacidad ${rep.maxClusterSustainableRps} req/s">
      <text x="18" y="30" fill="#a8c7de" font-size="11" font-family="sans-serif">Demanda P50 (${rep.uncertaintyBandRps[0]} req/s)</text>
      <rect x="215" y="18" width="${wBar(rep.uncertaintyBandRps[0])}" height="15" rx="5" fill="#228ffc"/>

      <text x="18" y="58" fill="#eef9ff" font-size="11" font-weight="bold" font-family="sans-serif">Demanda P95 (${rep.uncertaintyBandRps[1]} req/s)</text>
      <rect x="215" y="46" width="${wBar(rep.uncertaintyBandRps[1])}" height="15" rx="5" fill="#a481ff"/>

      <text x="18" y="86" fill="#ffd77c" font-size="11" font-family="sans-serif">Incertidumbre P99 (${rep.uncertaintyBandRps[2]} req/s)</text>
      <rect x="215" y="74" width="${wBar(rep.uncertaintyBandRps[2])}" height="15" rx="5" fill="#ffd77c"/>

      <text x="18" y="114" fill="${cap_color}" font-size="11" font-weight="bold" font-family="sans-serif">Techo Cluster (${rep.maxClusterSustainableRps} req/s)</text>
      <rect x="215" y="102" width="${wBar(rep.maxClusterSustainableRps)}" height="15" rx="5" fill="${cap_color}"/>

      <text x="698" y="30" text-anchor="end" fill="#9bdcff" font-size="10.5" font-family="sans-serif">${rep.totalVcpu} vCPU · ${rep.totalRamGib} GiB</text>
      <text x="698" y="56" text-anchor="end" fill="#9bdcff" font-size="10.5" font-family="sans-serif">${rep.totalSqlConnections} SQL conn</text>
      <text x="698" y="82" text-anchor="end" fill="#53e2ba" font-size="11" font-weight="bold" font-family="sans-serif">$${esc(rep.estimatedMonthlyCostUsd)} USD/mes</text>
      <text x="698" y="110" text-anchor="end" fill="#ffd77c" font-size="10.5" font-family="sans-serif">p95 ~${rep.estimatedP95LatencyMs} ms</text>
    </svg>
  </div>`;
}
