import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SENIOR_REVIEWS,codeReviewPolicy,evaluateCodeReview} from '../dist/senior-reviews.js';
import {IMPACT_MODELS,simulateMissionImpact} from '../dist/senior-impact.js';
import {emptySeniorDraft,sanitizeSeniorDraft,evaluateSeniorSuite,missionPolicy,seniorDossierMarkdown,validateSeniorGraph} from '../dist/senior-suite.js';
const missions=JSON.parse(readFileSync(new URL('../data/senior.json',import.meta.url),'utf8'));
test('18 reviews genuinamente distintas: snippets, opciones, verificaciones y explicación específica',()=>{
  assert.equal(Object.keys(SENIOR_REVIEWS).length,18);
  assert.equal(new Set(Object.values(SENIOR_REVIEWS).map(x=>x.snippet)).size,18);
  for(const m of missions){const c=SENIOR_REVIEWS[m.id];assert.ok(c,`Falta revisión ${m.id}`);
    assert.equal(c.options.length,3);assert.equal(new Set(c.options).size,3);assert.ok(c.verification.length>=35,`${m.id} sin verificación útil`);
    assert.ok(c.why.length>35 && c.snippet.length>45 && c.context.length>15);
    for(const seed of [0,1,2,5,67,1000000]){const p=codeReviewPolicy(m.id,seed);assert.equal(p.correct>=0,true);assert.equal(p.correct<3,true);
      assert.equal(evaluateCodeReview(m.id,seed,-1).status,'NOT_RUN');assert.equal(evaluateCodeReview(m.id,seed,p.correct).status,'PASS');
      for(let wrong=0;wrong<3;wrong++)if(wrong!==p.correct)assert.equal(evaluateCodeReview(m.id,seed,wrong).status,'FAIL');
    }
  }
});
test('18 modelos de impacto educativos: cambio de control varía métrica; semilla reproducible',()=>{
 assert.equal(Object.keys(IMPACT_MODELS).length,18);
 assert.equal(new Set(Object.values(IMPACT_MODELS).map(x=>x.metric)).size,18);
 for(const m of missions){const model=IMPACT_MODELS[m.id];assert.ok(model);
   assert.equal(model.controls.length,3);assert.equal(model.efficacy.length,3);
   for(const seed of [0,1,42,1000000]){
     const outputs=[0,1,2].map(c=>simulateMissionImpact(m.id,seed,c));
     assert.deepEqual(simulateMissionImpact(m.id,seed,1),outputs[1]);
     assert.ok(outputs[1].remaining < outputs[0].remaining,`${m.id}: mitigate should improve reference`);
     assert.ok(outputs.every(x=>Number.isSafeInteger(x.remaining)&&x.remaining>=0&&x.disclaimer.includes('sintéticos')));
   }
 }
 assert.throws(()=>simulateMissionImpact('S88',0,1));
 assert.throws(()=>simulateMissionImpact('S01',-1,1));
 assert.throws(()=>simulateMissionImpact('S01',1,99));
 assert.throws(()=>codeReviewPolicy('S01',-1));
});
test('arquitectura no se aprueba por elegir todos los componentes y una misión vacía es NOT_RUN',()=>{
 const m=missions[0],p=missionPolicy(m,2);
 const d=emptySeniorDraft();assert.deepEqual(evaluateSeniorSuite(m,2,d).checks.map(c=>c.status),Array(6).fill('NOT_RUN'));
 d.architecture=['API Gateway','Dominio aislado','Base de datos','Idempotencia','Cola de eventos','Observabilidad','Autorización','Plan de rollback'];
 assert.equal(evaluateSeniorSuite(m,2,d).checks[1].status,'FAIL');
 d.architecture=p.required;assert.equal(evaluateSeniorSuite(m,2,d).checks[1].status,'FAIL');
 d.relations=[[p.required[0],p.required[1]]];assert.equal(evaluateSeniorSuite(m,2,d).checks[1].status,'PASS');
});
test('seis checks con respuesta correcta: revisión humana de ADR no certifica el resultado',()=>{
 for(const m of missions){const seed=42,p=missionPolicy(m,seed),r=codeReviewPolicy(m.id,seed),s=p.scenario;
 const d={...emptySeniorDraft(),diagnosis:p.diagnosisCorrect,architecture:p.required,relations:[[p.required[0],p.required[1]]],decision:`Decisión y alternativa: con ${s.team} y ${s.availability} se evalúa el riesgo, costo y se debe verificar con pruebas, medición y monitorización. `.repeat(3),incident:p.incidentCorrect,capacity:p.targetCapacity,reviewChoice:r.correct,impactChoice:1};
 const ev=evaluateSeniorSuite(m,seed,d);assert.equal(ev.checks.length,6);assert.equal(ev.score,100,m.id);assert.equal(ev.mechanicalPassed,true);assert.equal(ev.checks[2].status,'REQUIRES_REVIEW');
 const dossier=seniorDossierMarkdown(m,seed,d);assert.match(dossier,/Contract|Code Review|contrato|código/i);assert.match(dossier,/Experimento de impacto/);assert.match(dossier,/REQUIRES_REVIEW/);
 }
});
test('backups v1.3 se migran conservando borradores y nuevos campos se validan',()=>{
 const legacy={diagnosis:1,architecture:['Dominio aislado'],decision:'ADR de ejemplo',incident:0,capacity:1200,updated:new Date().toISOString()};
 const migrated=sanitizeSeniorDraft(legacy);assert.equal(migrated?.reviewChoice,-1);assert.equal(migrated?.impactChoice,-1);assert.deepEqual(migrated?.relations,[]);assert.deepEqual(migrated?.architecture,legacy.architecture);
 assert.equal(sanitizeSeniorDraft({...legacy,reviewChoice:999}),null);
 assert.equal(sanitizeSeniorDraft({...legacy,impactChoice:'2'}),null);
 assert.equal(sanitizeSeniorDraft({...legacy,reviewChoice:2,impactChoice:1})?.reviewChoice,2);
});

test('grafo senior: ciclo, nodo aislado, duplicado y enlaces a nodos inexistentes se rechazan',()=>{
 const nodes=['Dominio aislado','Base de datos','Observabilidad'];
 assert.equal(validateSeniorGraph(nodes,[['Dominio aislado','Base de datos'],['Base de datos','Observabilidad']],nodes.slice(0,2)).valid,true);
 assert.equal(validateSeniorGraph(nodes,[['Dominio aislado','Base de datos'],['Base de datos','Observabilidad'],['Observabilidad','Dominio aislado']],nodes.slice(0,2)).valid,false);
 assert.equal(validateSeniorGraph(nodes,[['Dominio aislado','Base de datos'],['Dominio aislado','Base de datos']],nodes.slice(0,2)).valid,false);
 assert.equal(validateSeniorGraph(nodes,[['Dominio aislado','Base de datos'],['Base de datos','Idempotencia']],nodes.slice(0,2)).valid,false);
 assert.equal(validateSeniorGraph(nodes,[['Dominio aislado','Base de datos']],nodes.slice(0,2)).valid,false);
 assert.equal(validateSeniorGraph(nodes,[],nodes.slice(0,2)).valid,false);
});
