import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {missionPolicy,seniorScenario,evaluateSeniorSuite,emptySeniorDraft,sanitizeSeniorDraft,SENIOR_ENGINES} from '../dist/senior-suite.js';
import {codeReviewPolicy} from '../dist/senior-reviews.js';
const missions=JSON.parse(readFileSync(new URL('../data/senior.json',import.meta.url)));
test('18 misiones × seis actividades comprobables',()=>{
 assert.equal(missions.length,18);assert.equal(SENIOR_ENGINES.length,6);
 for(const m of missions){for(const seed of [0,1,2,42]){const p=missionPolicy(m,seed);assert.equal(p.diagnosisOptions.length,3);assert.equal(p.incidentOptions.length,3);assert.equal(p.required.length,2);assert.ok(p.diagnosisCorrect>=0&&p.diagnosisCorrect<3);assert.ok(p.incidentCorrect>=0&&p.incidentCorrect<3);assert.equal(evaluateSeniorSuite(m,seed,emptySeniorDraft()).checks.length,6)}}
});
test('mismo seed reproduce exactamente restricciones, opciones y resultados',()=>{
 for(const m of missions){assert.deepEqual(missionPolicy(m,9),missionPolicy(m,9));assert.deepEqual(seniorScenario(m.id,9),seniorScenario(m.id,9));}
});
test('una respuesta de referencia correcta cubre cuatro verificaciones mecánicas',()=>{
 for(const m of missions){const p=missionPolicy(m,17),s=p.scenario;const adr=`Decisión y alternativa: con un equipo de ${s.team} y un SLO ${s.availability} se evalúa riesgo, costo, métricas y verificar los resultados mediante pruebas y monitor de negocio. `.repeat(2);
 const draft={...emptySeniorDraft(),diagnosis:p.diagnosisCorrect,architecture:p.required,relations:[[p.required[0],p.required[1]]],decision:adr,incident:p.incidentCorrect,capacity:p.targetCapacity,reviewChoice:codeReviewPolicy(m.id,17).correct};
 const result=evaluateSeniorSuite(m,17,draft);assert.equal(result.score,100, m.id);assert.equal(result.checks[2].status,'REQUIRES_REVIEW');assert.equal(result.complete,true);assert.equal(result.requiresReview,true);
 }
});
test('escenario de baja y alta complejidad cambia decisiones y arquitectura de referencia',()=>{
 const m=missions[0];const samples=Array.from({length:100},(_,seed)=>missionPolicy(m,seed));
 const low=samples.find(x=>x.scenario.load===600&&x.scenario.uptimeTarget===99.5),high=samples.find(x=>x.scenario.load>=8000);
 assert.ok(low&&high,'se requieren variantes de demanda distintas');
 assert.notEqual(low.diagnosisOptions[low.diagnosisCorrect],high.diagnosisOptions[high.diagnosisCorrect]);
});
test('capacidad insuficiente o sobredimensionamiento excesivo fallan',()=>{
 const m=missions[10],p=missionPolicy(m,12),d=emptySeniorDraft();d.capacity=p.scenario.load-1;
 assert.equal(evaluateSeniorSuite(m,12,d).checks[4].status,'FAIL');d.capacity=p.scenario.load*5;assert.equal(evaluateSeniorSuite(m,12,d).checks[4].status,'FAIL');d.capacity=p.targetCapacity;assert.equal(evaluateSeniorSuite(m,12,d).checks[4].status,'PASS');
});
test('la sanitización descarta prototipos inválidos, textos enormes y capacidades fuera de rango',()=>{
 assert.equal(sanitizeSeniorDraft(null),null);assert.equal(sanitizeSeniorDraft({}),null);
 const d=emptySeniorDraft();assert.ok(sanitizeSeniorDraft(d));
 assert.equal(sanitizeSeniorDraft({...d,capacity:Infinity}),null);
 assert.equal(sanitizeSeniorDraft({...d,decision:'x'.repeat(19000)}),null);
 assert.equal(sanitizeSeniorDraft({...d,architecture:['No existe']}),null);
});
