import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const d=JSON.parse(readFileSync(new URL('../data/lab-cases.json',import.meta.url)));
test('patrones, API e incidentes contienen 4 casos independientes por laboratorio',()=>{assert.deepEqual(Object.keys(d).sort(),['api','incident','patterns']);for(const [category,cases] of Object.entries(d)){assert.equal(cases.length,4,category);for(const c of cases){assert.equal(c.options.length,3);assert.ok(c.correct>=0&&c.correct<3);assert.ok(c.why.length>25)}}});
