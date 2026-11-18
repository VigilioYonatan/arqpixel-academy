import { scenarioFromSeed } from './engine.js';
export function lessonSeniorScenario(m) {
    if (!/^[IA]\d{2}$/.test(m.id) || !['Intermedio', 'Avanzado'].includes(m.level))
        return null;
    const seed = Number(m.id.slice(1)) * 37 + (m.id[0] === 'A' ? 1000 : 0), scenario = scenarioFromSeed(m.id, seed);
    return { seed, scenario, task: m.transfer?.trim() || `Analiza un trade-off de ${m.title}.`, verification: m.metric?.trim() || 'Define una métrica verificable antes de implementar.' };
}
export function evaluateSeniorReflection(text, m) {
    const challenge = lessonSeniorScenario(m);
    if (!challenge)
        return { complete: false, checks: [{ name: 'Aplicabilidad', status: 'NO_APLICA', detail: 'Este módulo introductorio no tiene variante Senior contextual.' }] };
    const normalized = text.toLocaleLowerCase('es'), s = challenge.scenario;
    const coverage = [s.traffic, s.availability, s.team, s.budget, s.failure].filter(x => normalized.includes(x.toLocaleLowerCase('es')));
    const checks = [
        { name: 'Argumentación mínima', status: text.trim().length >= 180 ? 'PASS' : 'FAIL', detail: 'Explica al menos 180 caracteres, no solo una conclusión.' },
        { name: 'Restricciones citadas', status: coverage.length >= 2 ? 'PASS' : 'FAIL', detail: `Cita dos valores del escenario. Detectados: ${coverage.length}/5.` },
        { name: 'Alternativa y riesgos', status: /alternativ|trade.off|riesgo|coste|costo|desventaja/i.test(text) ? 'PASS' : 'FAIL', detail: 'Explica un coste, riesgo o alternativa rechazada.' },
        { name: 'Verificación propuesta', status: /m[eé]trica|medir|verific|prueba|test|slo|monitor|p95|p99/i.test(text) ? 'PASS' : 'FAIL', detail: 'Propón una señal medible y un modo de comprobarla.' },
        { name: 'Calidad de arquitectura', status: 'REQUIRES_REVIEW', detail: 'Una persona experta debe revisar corrección y trade-offs.' },
    ];
    return { complete: checks.filter(c => c.status === 'FAIL').length === 0, checks };
}
