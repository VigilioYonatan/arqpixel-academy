import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildSbom} from '../scripts/generate-sbom.mjs';
import {createHash} from 'node:crypto';

test('CycloneDX 1.5 offline distingue vendored y dependencia opcional sin declarar CVEs ficticias',()=>{
 const doc=buildSbom(),saved=JSON.parse(readFileSync('security/sbom.cdx.json','utf8'));
 assert.deepEqual(saved,doc);
 assert.equal(doc.bomFormat,'CycloneDX');assert.equal(doc.specVersion,'1.5');
 assert.ok(doc.components.some(c=>c.name==='typescript'&&c.version==='5.8.3'));
 assert.ok(doc.components.some(c=>c.name==='@biomejs/biome'&&c.scope==='optional'&&c.purl==='pkg:npm/%40biomejs/biome@2.6.3'));
 assert.ok(doc.components.some(c=>c.name==='@playwright/test'&&c.scope==='optional'&&c.purl==='pkg:npm/%40playwright/test@1.64.1'));
 assert.ok(doc.components.some(c=>c.name==='@axe-core/playwright'&&c.scope==='optional'&&c.purl==='pkg:npm/%40axe-core/playwright@4.12.1'));
 assert.ok(doc.metadata.properties.some(x=>x.value.includes('no CVE/SCA')));
});
test('hash de compiler coincide con bytes realmente entregados',()=>{
 const sbom=buildSbom(),compiler=sbom.components.find(c=>c.name==='typescript');
 const actual=createHash('sha256').update(readFileSync('tools/typescript/lib/tsc.js')).digest('hex');
 assert.equal(compiler.hashes[0].content,actual);
});
