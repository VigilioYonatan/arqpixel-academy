import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {lessonSeniorScenario,evaluateSeniorReflection} from '../dist/lesson-senior.js';
const modules=JSON.parse(readFileSync('data/modules.json','utf8'));
test('los 24 módulos intermedios/avanzados generan contexto Senior reproducible',()=>{
  const suitable=modules.filter(m=>m.level!=='Básico');assert.equal(suitable.length,24);
  for(const m of suitable){const x=lessonSeniorScenario(m),y=lessonSeniorScenario(m);
    assert.deepEqual(x,y);assert.ok(x.seed>=0);assert.ok(x.task.length>20);assert.ok(x.verification.length>15);assert.match(x.scenario.traffic,/req\/min/);
  }
});
test('los 12 módulos básicos no simulan certificación Senior',()=>{
 for(const m of modules.filter(x=>x.level==='Básico')){assert.equal(lessonSeniorScenario(m),null);assert.equal(evaluateSeniorReflection('Texto',m).checks[0].status,'NO_APLICA')}
});
test('reflexión Senior exige restricciones concretas, alternativa y evidencia',()=>{
 const m=modules.find(m=>m.id==='I01'),s=lessonSeniorScenario(m).scenario;
 assert.equal(evaluateSeniorReflection('mi alternativa es buena',m).complete,false);
 const draft=`Contexto: ${s.traffic}, disponibilidad ${s.availability}. Decisión y alternativa: mantener el límite de responsabilidades, evitando dependencia cruzada. Riesgo: crecimiento innecesario de acoplamiento y costes. Para verificar haré pruebas de regresión y mediré fallos bajo carga, con un plan de rollback y observabilidad del servicio.`;
 const result=evaluateSeniorReflection(draft,m);
 assert.equal(result.complete,true);assert.ok(result.checks.some(c=>c.status==='REQUIRES_REVIEW'));
 assert.equal(evaluateSeniorReflection(draft.replace(s.traffic,'indefinido').replace(s.availability,'sin SLO'),m).complete,false);
});
