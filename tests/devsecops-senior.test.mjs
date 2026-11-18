import test from 'node:test';
import assert from 'node:assert/strict';
import {SECURITY_CONTROLS,devsecopsPolicy,evaluateDevSecOps} from '../dist/senior-devsecops.js';
const ids=Array.from({length:18},(_,i)=>`S${String(i+1).padStart(2,'0')}`);
test('18 misiones poseen controles DevSecOps específicos con dos controles críticos',()=>{
 for(const id of ids){const p=devsecopsPolicy(id);assert.equal(p.must.length,2);assert.ok(p.verification.length>20);assert.equal(evaluateDevSecOps(id,p.must).status,'PASS')}
});
test('devsecops priorización: no se aprueba selección masiva ni control inventado',()=>{
 assert.equal(evaluateDevSecOps('S12',SECURITY_CONTROLS.map(x=>x.id)).status,'FAIL');
 assert.equal(evaluateDevSecOps('S12',['secrets','inventado']).status,'FAIL');
 assert.equal(evaluateDevSecOps('S12',['secrets']).status,'FAIL');
 assert.equal(evaluateDevSecOps('S12',['threat','secrets','threat']).status,'FAIL');
});
test('DevSecOps S09 prioriza contratos y amenazas; S15 supply chain y rollback',()=>{
 assert.equal(evaluateDevSecOps('S09',['threat','contracts']).pass,true);
 assert.equal(evaluateDevSecOps('S09',['threat','quality']).pass,false);
 assert.equal(evaluateDevSecOps('S15',['supply','runtime']).pass,true);
});
test('mission code rejects missing policy',()=>assert.throws(()=>devsecopsPolicy('S99')));
test('suite compilada conecta controles DevSecOps, evidencia y exportación',async()=>{
 const {readFileSync}=await import('node:fs');
 const code=readFileSync('dist/senior-suite.js','utf8');
 for(const marker of ['evaluate-devsecops','data-devsecops','devsecopsControls','evaluateDevSecOps','devsecops:'])assert.ok(code.includes(marker),marker);
});
