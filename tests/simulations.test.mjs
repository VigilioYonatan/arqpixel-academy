import test from 'node:test';
import assert from 'node:assert/strict';
import {simulatePaymentReplay,simulatePeakCapacity} from '../dist/senior-simulations.js';
import {seniorScenario,missionPolicy,seniorDossierMarkdown,emptySeniorDraft} from '../dist/senior-suite.js';
import {readFileSync} from 'node:fs';
const missions=JSON.parse(readFileSync(new URL('../data/senior.json',import.meta.url)));
test('S09 no duplica cargos con idempotencia, y outbox conserva eventos del modelo',()=>{
 const both=simulatePaymentReplay({orders:100,duplicateRate:30,idempotency:true,outbox:true});
 assert.equal(both.duplicateCharges,0);assert.equal(both.lostEvents,0);assert.equal(both.chargeAttempts,130);
 const neither=simulatePaymentReplay({orders:100,duplicateRate:30,idempotency:false,outbox:false});
 assert.equal(neither.duplicateCharges,30);assert.equal(neither.lostEvents,5);
 assert.throws(()=>simulatePaymentReplay({orders:10,duplicateRate:101,idempotency:true,outbox:false}));
});
test('S11 marca saturación, cola acumulada, descarte y holgura',()=>{
 const s=simulatePeakCapacity({incomingRpm:8000,workers:2,rpmPerWorker:3000,queueLimit:10000,minutes:10});
 assert.equal(s.pending,20000);assert.equal(s.dropped,10000);assert.equal(s.stable,false);
 const good=simulatePeakCapacity({incomingRpm:8000,workers:5,rpmPerWorker:3000,queueLimit:0,minutes:10});
 assert.equal(good.dropped,0);assert.equal(good.stable,true);
 assert.throws(()=>simulatePeakCapacity({incomingRpm:8000,workers:0,rpmPerWorker:3000,queueLimit:0,minutes:10}));
});
test('todas las 18 misiones y 90 variantes usan exactamente los RPS visibles, sin multiplicarlos por mil',()=>{
 const allowed=new Map([['600 req/min',600],['8.000 req/min',8000],['65.000 req/min',65000]]);
 for(const m of missions)for(let seed=0;seed<90;seed++){
   const s=seniorScenario(m.id,seed),p=missionPolicy(m,seed);
   assert.equal(s.load,allowed.get(s.traffic),`${m.id} seed=${seed}`);
   assert.ok(p.targetCapacity>=s.load && p.targetCapacity<4*s.load,`${m.id} seed=${seed}`);
   assert.ok(p.diagnosisCorrect>=0&&p.diagnosisCorrect<3);
 }
});
test('dossier Markdown contiene escenario, decisiones, 5 checks y revisión humana',()=>{
 const m=missions.find(x=>x.id==='S09');const s=seniorDossierMarkdown(m,15,{...emptySeniorDraft(),decision:'La alternativa y riesgo serán medidos y verificados mediante pruebas de concurrencia.'});
 assert.match(s,/Variante reproducible: 15/);assert.match(s,/## Restricciones/);assert.match(s,/## ADR del estudiante/);
 assert.match(s,/Pagos|pago/i);assert.match(s,/REQUIRES_REVIEW|revisión humana/);
});
