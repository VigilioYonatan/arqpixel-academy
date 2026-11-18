import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {checkHeaders} from '../scripts/check-security-headers.mjs';
test('source HTML and static host deployment policy are aligned',()=>{
 assert.deepEqual(checkHeaders(readFileSync('index.html','utf8'),readFileSync('public/_headers','utf8')),[]);
});
test('missing CSP and X-Frame-Options are rejected',()=>{
 const errors=checkHeaders('<html/>','X-Content-Type-Options: nosniff');
 assert.ok(errors.some(x=>x.includes('CSP')));assert.ok(errors.some(x=>x.includes('X-Frame-Options')));
});
test('release dist must include headers and CSP',()=>{
 const html=readFileSync('dist/index.html','utf8');
 const headers=readFileSync('dist/_headers','utf8');
 assert.deepEqual(checkHeaders(html,headers),[]);
});
