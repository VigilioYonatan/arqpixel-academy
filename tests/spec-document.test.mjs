import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync, existsSync } from 'node:fs';
const path='TODO_LO_QUE_DEBE_TENER_ESTA_APP.md';
const text=readFileSync(path,'utf8');
const modules=JSON.parse(readFileSync('data/modules.json','utf8'));
const missions=JSON.parse(readFileSync('data/senior.json','utf8'));
const paths=JSON.parse(readFileSync('data/paths.json','utf8'));
const games=JSON.parse(readFileSync('data/mini-games.json','utf8'));
test('especificación viva exhaustiva, en la raíz del proyecto y no vacía',()=>{
  assert.equal(existsSync(path),true);
  assert.ok(statSync(path).size>130000,`Documento incompleto: ${statSync(path).size} bytes`);
  assert.ok(text.split('\n').length>2000);
  for(const title of ['# TODO_LO_QUE_DEBE_TENER_ESTA_APP.md','DISEÑO','SENIOR MODE','DEVSECOPS','CINCO MINIJUEGOS','OCHO LABORATORIOS','PRUEBAS','ANEXO COMPLETO'])assert.ok(text.toUpperCase().includes(title.toUpperCase()),`Falta sección ${title}`);
});
test('los 36 módulos del catálogo tienen descripción concreta',()=>{
 for(const item of modules){assert.ok(text.includes(`##### ${item.id} — ${item.title}`),`Falta módulo ${item.id}`); assert.ok(text.includes(item.activity),`Falta práctica ${item.id}`)}
});
test('las 18 misiones Senior y 8 especializaciones figuran con su nombre real',()=>{
 for(const item of missions)assert.ok(text.includes(`### ${item.id} — ${item.title}`),`Falta misión ${item.id}`);
 for(const item of paths)assert.ok(text.includes(`### ${item.id} — ${item.title}`),`Falta ruta ${item.id}`);
});
test('los cinco minijuegos están descritos y el documento admite sus límites reales',()=>{
 for(const item of games)assert.ok(text.includes(`Minijuego \`${item.id}\` — ${item.title}`),`Falta minijuego ${item.id}`);
 for(const warning of ['REQUIRES_REVIEW','Preact','Vite','Biome','localStorage','NO VERIFICADO','TerraBot'])assert.ok(text.includes(warning),`Falta límite ${warning}`);
});
