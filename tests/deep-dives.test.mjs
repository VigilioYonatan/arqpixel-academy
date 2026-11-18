import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const base=JSON.parse(readFileSync(new URL('../data/modules.json',import.meta.url)));
const deep=JSON.parse(readFileSync(new URL('../data/deep-dives.json',import.meta.url)));
test('las 36 lecciones incluyen comparación, fundamentos, métrica y transferencia',()=>{assert.equal(base.length,36);assert.equal(deep.length,36);assert.equal(new Set(deep.map(x=>x.id)).size,36);for(const item of base){const d=deep.find(x=>x.id===item.id);assert.ok(d,item.id);for(const key of ['comparison','reason','metric','transfer'])assert.ok(d[key].length>=(key==='comparison'?10:20),`${item.id}.${key}`)}});
