import test from 'node:test';
import assert from 'node:assert/strict';
import {SENIOR_THREATS,threatExercise,evaluateThreat} from '../dist/senior-threats.js';
import {emptySeniorDraft,sanitizeSeniorDraft,seniorDossierMarkdown,exportSeniorSuiteDrafts,importSeniorSuiteDrafts} from '../dist/senior-suite.js';
import {readFileSync} from 'node:fs';

const missions = JSON.parse(readFileSync(new URL('../data/senior.json',import.meta.url),'utf8'));
const ids = missions.map(m=>m.id);

test('las 18 misiones tienen activos, boundaries, amenaza, mitiga y verifica',()=>{
 assert.deepEqual(Object.keys(SENIOR_THREATS).sort(),[...ids].sort());
 for(const m of missions){
  const x=SENIOR_THREATS[m.id];
  for(const key of ['asset','boundary','abuse','mitigation','proof'])assert.ok(x[key].length>=15,`${m.id} ${key}`);
  assert.ok(['Spoofing','Tampering','Repudiation','Information Disclosure','Denial of Service','Elevation of Privilege'].includes(x.stride));
  assert.equal(x.distractors.length,2);
  assert.equal(new Set([x.mitigation,...x.distractors]).size,3);
 }
});
test('todas las 18 misiones x 61 variantes tienen opciones reproducibles y mitigación reconocible',()=>{
 let checked=0;
 for(const m of missions)for(let seed=0;seed<=300;seed+=5){
  const x=threatExercise(m.id,seed);
  assert.deepEqual(x,threatExercise(m.id,seed));
  assert.equal(x.choices.length,3);
  assert.equal(new Set(x.choices).size,3);
  assert.equal(x.choices[x.correct],SENIOR_THREATS[m.id].mitigation);
  assert.equal(evaluateThreat(m.id,seed,x.correct).status,'PASS');
  for(let i=0;i<3;i++)if(i!==x.correct)assert.equal(evaluateThreat(m.id,seed,i).status,'FAIL');
  checked++;
 }
 assert.equal(checked,1098);
});
test('control de entradas inválidas y estado pendiente',()=>{
 assert.equal(evaluateThreat('S09',3,-1).status,'NOT_RUN');
 for(const bad of [-2,3,NaN,Infinity,1.5])assert.equal(evaluateThreat('S09',3,bad).status,'FAIL');
 assert.throws(()=>threatExercise('MISSING',0),/desconocida/);
 for(const bad of [-1,1_000_001,NaN,2.5])assert.throws(()=>threatExercise('S09',bad),/Semilla/);
});
test('restauración de borradores legacy sin amenaza se conserva',()=>{
 const legacy=emptySeniorDraft();delete legacy.threatChoice;
 const parsed=sanitizeSeniorDraft(legacy);
 assert.ok(parsed);
 assert.equal(parsed.threatChoice,-1);
 assert.equal(sanitizeSeniorDraft({...legacy,threatChoice:5}),null);
 assert.equal(sanitizeSeniorDraft({...legacy,threatChoice:0.2}),null);
 assert.equal(sanitizeSeniorDraft({...legacy,threatChoice:2}).threatChoice,2);
});
test('el dossier contiene threat modeling y prueba concreta',()=>{
 const m=missions.find(x=>x.id==='S12');
 const seed=7,threat=threatExercise(m.id,seed),draft={...emptySeniorDraft(),threatChoice:threat.correct};
 const md=seniorDossierMarkdown(m,seed,draft);
 assert.match(md,/Threat Modeling \/ STRIDE/);
 assert.ok(md.includes(threat.asset));
 assert.ok(md.includes(threat.boundary));
 assert.ok(md.includes(threat.proof));
 assert.match(md,/Evaluación: PASS/);
});
