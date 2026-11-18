import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {detectGraphProblems,sanitizeProgress,missionChoices,scenarioFromSeed,evaluateMission} from '../dist/engine.js';
const mods=JSON.parse(readFileSync('data/modules.json','utf8'));
const missions=JSON.parse(readFileSync('data/senior.json','utf8'));
const mid=mods.map(x=>x.id),sid=missions.map(x=>x.id);
const base=()=>({done:[],answers:{},missions:{},notes:{},xp:0,theme:'dark',seniorMode:false,lastVisit:'2026-11-11T00:00:00Z'});
test('importación corrupta y prototipos inesperados no derriban la aplicación',()=>{
  assert.equal(sanitizeProgress(null,mid,sid),null);
  assert.equal(sanitizeProgress({...base(),notes:[]},mid,sid),null);
  assert.equal(sanitizeProgress({...base(),missions:null},mid,sid),null);
});
test('importación elimina datos desconocidos y recalcula XP',()=>{
  const data={...base(),done:['B01','B01','HACK'],answers:{B01:0,B02:999,HACK:1},notes:{B01:'válido',HACK:'fuera'},xp:1234567,theme:'custom',missions:{S01:{score:50,seed:2,choice:1,adr:'Decisión',completedAt:'2026-11-11T00:00:00Z'},S02:{score:1234,seed:0,choice:0,adr:'X',completedAt:'2026-11-11T00:00:00Z'}}};
  const result=sanitizeProgress(data,mid,sid);
  assert.deepEqual(result.done,['B01']);assert.equal(result.xp,130);assert.equal(result.answers.B01,0);assert.equal(result.answers.B02,undefined);assert.equal(result.notes.HACK,undefined);assert.equal(result.missions.S02,undefined);assert.equal(result.theme,'dark');
});
test('grafo válido, violación de dominio y ciclo se distinguen',()=>{
  assert.equal(detectGraphProblems([['Presentación','Aplicación'],['Aplicación','Dominio'],['Infraestructura','Dominio']]).valid,true);
  assert.equal(detectGraphProblems([['Dominio','Infraestructura']]).valid,false);
  const cyc=detectGraphProblems([['Aplicación','Infraestructura'],['Infraestructura','Aplicación']]);assert.equal(cyc.cycle,true);assert.equal(cyc.valid,false);
});
test('variantes son reproducibles y semillas distintas pueden cambiar el caso',()=>{
  for(const mission of missions)assert.deepEqual(scenarioFromSeed(mission.id,12),scenarioFromSeed(mission.id,12));
  const scenarios=new Set(Array.from({length:30},(_,n)=>JSON.stringify(scenarioFromSeed('S09',n))));assert.ok(scenarios.size>2);
});
test('opciones Senior se reordenan y conservan solución',()=>{
  const options=['estrategia correcta','incorrecta A','incorrecta B'];const positions=new Set();
  for(let seed=0;seed<9;seed++){const result=missionChoices('S09',seed,options);positions.add(result.correct);assert.equal(result.options[result.correct],options[0])}
  assert.deepEqual([...positions].sort(),[0,1,2]);
});
test('rúbrica Senior usa restricciones del escenario y revisión humana',()=>{
  const scenario=scenarioFromSeed('S09',7);
  const blank=evaluateMission(2,1,'',scenario);assert.equal(blank.score,0);assert.ok(blank.checks.some(x=>x.status==='REQUIRES_REVIEW'));
  const adr=`Contexto: ${scenario.traffic}, SLO ${scenario.availability}. Evaluamos riesgos y alternativa: la solución con idempotencia reduce cargos duplicados, con el coste de almacenamiento. Verificar mediante pruebas, métricas y simulaciones de fallos.`;
  const result=evaluateMission(1,1,adr,scenario);assert.equal(result.score,100);
  const noContext=evaluateMission(1,1,adr.replace(scenario.traffic,'volumen desconocido').replace(scenario.availability,'sin SLO'),scenario);assert.equal(noContext.score,80);
});
test('cada misión tiene una estrategia de referencia consistente con catálogo',()=>{
  assert.equal(missions.length,18);for(let i=0;i<18;i++){const opts=['ref','err1','err2'];const result=missionChoices(missions[i].id,i,opts);assert.ok(result.correct>=0&&result.correct<3)}
});

test('XP Senior no se entrega por una respuesta fallida y conserva premios históricos',()=>{
 const now='2026-11-11T00:00:00Z';const attempt={score:40,seed:3,choice:0,adr:'Faltan controles',completedAt:now};
 const a=sanitizeProgress({...base(),missions:{S01:{...attempt,awarded:false}}},mid,sid);
 assert.equal(a.xp,0);assert.equal(a.missions.S01.awarded,false);
 const b=sanitizeProgress({...base(),missions:{S01:{...attempt,awarded:true}}},mid,sid);
 assert.equal(b.xp,80);assert.equal(b.missions.S01.awarded,true);
 const legacy=sanitizeProgress({...base(),missions:{S01:attempt}},mid,sid);
 assert.equal(legacy.xp,80,'los XP legítimamente guardados con versión anterior no se borran');
});
