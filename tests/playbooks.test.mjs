import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SENIOR_PLAYBOOKS,missionPolicy,clearSeniorSuiteDrafts} from '../dist/senior-suite.js';
const missions=JSON.parse(readFileSync(new URL('../data/senior.json',import.meta.url)));
test('cada una de las 18 misiones tiene un playbook distinto y verificable',()=>{
 assert.equal(Object.keys(SENIOR_PLAYBOOKS).length,18);
 const artifacts=new Set();
 for(const mission of missions){
  const p=SENIOR_PLAYBOOKS[mission.id];assert.ok(p,mission.id);
  for(const field of ['focus','investigation','verification','artifact','failureMode'])assert.ok(p[field].length>=24,`${mission.id}: ${field}`);
  assert.ok(p.required.length===2);assert.notEqual(p.required[0],p.required[1]);
  assert.deepEqual(missionPolicy(mission,22).required,p.required);
  artifacts.add(p.artifact);
 }
 assert.equal(artifacts.size,18);
});
test('reset de borradores Senior elimina sólo las claves del proyecto',()=>{
 const map=new Map([['arqpixel-senior-suite-v2-S01-2','{}'],['arqpixel-senior-suite-v2-S02-99','{}'],['arqpixel-senior-suite-v2-S99-8','{}'],['another-project','{}']]);
 const saved=globalThis.localStorage;
 globalThis.localStorage={get length(){return map.size},key(i){return [...map.keys()][i]??null},removeItem(k){map.delete(k)}};
 try {assert.equal(clearSeniorSuiteDrafts(missions.map(x=>x.id)),2);assert.ok(map.has('arqpixel-senior-suite-v2-S99-8'));assert.ok(map.has('another-project'));}
 finally {globalThis.localStorage=saved;}
});
