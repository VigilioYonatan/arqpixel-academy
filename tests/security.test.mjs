import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {scanTree} from '../scripts/security-scan.mjs';
import {licenseCheck} from '../scripts/check-licenses.mjs';

test('scanner detects sensitive filenames but ignores third-party vendored code',()=>{
 const root=mkdtempSync(join(tmpdir(),'arqpixel-scan-'));
 try {
   mkdirSync(join(root,'tools'));writeFileSync(join(root,'tools','vendor.ts'),'placeholder');
   writeFileSync(join(root,'.env'),'do-not-ship');
   const found=scanTree(root);
   assert.equal(found.length,1);assert.equal(found[0].file,'.env');
 } finally {rmSync(root,{recursive:true,force:true})}
});
test('scanner flags private key markers',()=>{
 const root=mkdtempSync(join(tmpdir(),'arqpixel-secret-'));
 try {writeFileSync(join(root,'bad.ts'),'const secret = "'+'-----BEGIN '+'PRIVATE KEY-----'+'";');
      assert.equal(scanTree(root)[0].issue,'private key');
 } finally {rmSync(root,{recursive:true,force:true})}
});
test('scanner leaves ordinary source untouched',()=>{
 const root=mkdtempSync(join(tmpdir(),'arqpixel-clean-'));
 try {writeFileSync(join(root,'sample.ts'),'const sample = "example-value";');
      assert.deepEqual(scanTree(root),[]);
 } finally {rmSync(root,{recursive:true,force:true})}
});
test('vendored compiler license is present',()=>{assert.deepEqual(licenseCheck(),{pass:true,errors:[]})});
