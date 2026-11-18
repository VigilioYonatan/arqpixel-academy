import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const paths=JSON.parse(readFileSync(new URL('../data/paths.json',import.meta.url)));
const mods=JSON.parse(readFileSync(new URL('../data/modules.json',import.meta.url)));
const ids=new Set(mods.map(x=>x.id));
test('ocho especializaciones completas con proyectos y requisitos existentes',()=>{
 assert.equal(paths.length,8);assert.equal(new Set(paths.map(x=>x.id)).size,8);
 for(const p of paths){assert.match(p.id,/^R0[1-8]$/);assert.ok(p.title&&p.summary&&p.tag&&p.capstone.length>40);assert.ok(p.modules.length>=4);assert.equal(new Set(p.modules).size,p.modules.length);for(const id of p.modules)assert.ok(ids.has(id),`${p.id}: módulo inexistente ${id}`)}
});
