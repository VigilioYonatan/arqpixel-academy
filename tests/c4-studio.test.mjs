import test from 'node:test';
import assert from 'node:assert/strict';
import {validateC4,c4Svg,c4Mermaid,C4_TYPES} from '../dist/c4-studio.js';
const base={kind:'C4-containers-educational',system:'NexoShop',containers:[
 {id:'frontend',label:'Web NexoShop',type:'Frontend'},
 {id:'api',label:'API de pedidos',type:'API'},
 {id:'db',label:'BD Pedidos',type:'Base de datos'}],relations:[
 {from:'frontend',to:'api',label:'Solicita pedidos'},
 {from:'api',to:'db',label:'Persiste pedidos'}]};
test('modelo C4 exportable con cuatro tipos, relaciones explícitas y autores',()=>{
 assert.equal(validateC4(base).length,0);assert.equal(C4_TYPES.length,4);
 const svg=c4Svg(base),mmd=c4Mermaid(base);
 assert.match(svg,/<svg/);assert.match(svg,/API de pedidos/);assert.match(svg,/NexoShop/);
 assert.match(mmd,/flowchart TB/);assert.match(mmd,/node1 -->\|"Solicita pedidos"\| node2/);
 assert.equal((mmd.match(/node\d+\[/g)||[]).length,3);
});
test('modelo C4 rechaza duplicados, huérfanos, bucles y entradas inválidas',()=>{
 assert.ok(validateC4({...base,containers:[base.containers[0],base.containers[0]]}).length);
 assert.ok(validateC4({...base,relations:[{from:'x',to:'api',label:'Rota'}]}).length);
 assert.ok(validateC4({...base,relations:[{from:'api',to:'api',label:'Bucle'}]}).length);
 assert.ok(validateC4({...base,relations:[...base.relations,base.relations[0]]}).length);
 assert.ok(validateC4({...base,containers:[]}).length);
 assert.ok(validateC4({...base,containers:[...base.containers,{id:'bad name',label:'',type:'API'}]}).length);
 assert.throws(()=>c4Svg({...base,relations:[{from:'nothing',to:'api',label:'Rota'}]}));
});
test('SVG escapado y Mermaid sin nuevas directivas introducidas por etiquetas',()=>{
 const evil={...base,containers:[{id:'x',label:'<script>alert(1)</script>',type:'API'}],relations:[]};
 assert.equal(validateC4(evil).length,0);
 const svg=c4Svg(evil);assert.doesNotMatch(svg,/<script>/);assert.match(svg,/&lt;script&gt;/);
 const mer=c4Mermaid({...base,containers:[{id:'x',label:'foo\\nBAR-->OTHER',type:'API'}],relations:[]});
 assert.ok(mer.startsWith('flowchart TB\n'));
 assert.equal(mer.split('flowchart TB').length,2);
});
