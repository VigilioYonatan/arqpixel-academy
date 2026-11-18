import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mountSeniorSuite,emptySeniorDraft,exportSeniorSuiteDrafts,importSeniorSuiteDrafts,clearSeniorSuiteDrafts} from '../dist/senior-suite.js';
const missions=JSON.parse(readFileSync(new URL('../data/senior.json',import.meta.url),'utf8'));
function localStorageFake(initial={}) {const m=new Map(Object.entries(initial));return {get length(){return m.size},key:i=>[...m.keys()][i]??null,getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),dump:()=>Object.fromEntries(m)};}
test('render HTML para las 18 misiones incluye 6 actividades, grafo, revisión y simulador; sin snippets ejecutados',()=>{
 const oldDoc=globalThis.document,oldStorage=globalThis.localStorage;
 try{globalThis.localStorage=localStorageFake();
  for(const m of missions){let html='';const elements=new Map();
   const el=(sel)=>{if(!elements.has(sel))elements.set(sel,{innerHTML:'',textContent:'',addEventListener(){},querySelectorAll(){return []}});return elements.get(sel)};
   const root={set innerHTML(v){html=v},get innerHTML(){return html},querySelector:el,querySelectorAll:()=>[]};
   globalThis.document={querySelector:s=>s==='#senior-suite'?root:null};
   assert.doesNotThrow(()=>mountSeniorSuite(m,3),`${m.id} debe renderizar sin excepciones`);
   assert.match(html, /01 \/ 06/);assert.match(html,/06 \/ 06/);
   assert.match(html,/Contract \/ Code Review/);assert.match(html,/suite-graph/);
   assert.match(html,/suite-export-md/);assert.match(html,/run-impact-simulation/);
   assert.match(html,/suite-evaluate/);assert.match(html,/suite-diagnosis/);
   assert.match(html,/suite-incident/);assert.match(html,/suite-capacity/);
   assert.match(html,/Simulación educativa local/);assert.match(html,/THREAT MODELING \/ STRIDE/);assert.match(html,/evaluate-threat/);
   assert.ok(!/undefined|NaN/.test(html),`placeholders inesperados ${m.id}`);
   if(m.id==='S09')assert.match(html,/payment-experiment/);
   if(m.id==='S11')assert.match(html,/capacity-experiment/);
  }
 }finally{globalThis.document=oldDoc;globalThis.localStorage=oldStorage}
});
test('backup/restauración Senior conserva relaciones y revisión, rechaza lotes inválidos y respeta claves ajenas',()=>{
 const oldStorage=globalThis.localStorage;
 try{const fake=localStorageFake({'app-ajena-preferencia':'NO BORRAR'});globalThis.localStorage=fake;
  const m=missions[0],d={...emptySeniorDraft(),diagnosis:1,architecture:['Dominio aislado','Observabilidad'],relations:[['Dominio aislado','Observabilidad']],reviewChoice:2,impactChoice:1};
  fake.setItem(`arqpixel-senior-suite-v2-${m.id}-3`,JSON.stringify(d));
  const backup=exportSeniorSuiteDrafts(missions.map(x=>x.id));assert.equal(Object.keys(backup).length,1);
  assert.deepEqual(backup['S01-3'].relations,d.relations);
  assert.throws(()=>importSeniorSuiteDrafts({'S01-3':d,'S01-4':{invalid:true}},missions.map(x=>x.id)));
  assert.equal(fake.getItem('arqpixel-senior-suite-v2-S01-4'),null,'Importación inválida no debe ser parcial');
  const n=importSeniorSuiteDrafts({'S01-5':d},missions.map(x=>x.id));assert.equal(n,1);
  assert.equal(clearSeniorSuiteDrafts(missions.map(x=>x.id)),2);
  assert.equal(fake.getItem('app-ajena-preferencia'),'NO BORRAR');
 }finally{globalThis.localStorage=oldStorage}
});
