import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {audit} from './audit_public.mjs';
import {allowed,files} from './public_policy.mjs';
const root=path.resolve(import.meta.dirname,'..'),require=createRequire(import.meta.url);
require('../web/i18n-catalog.js');const english=globalThis.BookStudioEnglish;
assert.equal(english['设置'],'Settings');assert.equal(english['返回项目中心'],'Back to projects');assert(Object.keys(english).length>500);
assert(!allowed('web/models/unused.glb'));assert(!files.some(f=>f.startsWith('data/')));
assert.equal(JSON.parse(await readFile(path.join(root,'package.json'))).version,JSON.parse(await readFile(path.join(root,'desktop/package.json'))).version);
const scratch=await mkdtemp(path.join(tmpdir(),'book-source-audit-'));
try{await writeFile(path.join(scratch,'safe.js'),'// generic fixture');assert((await audit(scratch)).ok);await writeFile(path.join(scratch,'bad.js'),['C:','Users','fixture-user','private.txt'].join(String.fromCharCode(92)));assert((await audit(scratch)).violations.some(v=>v.rule==='machine-specific-path'));await mkdir(path.join(scratch,'data'));await writeFile(path.join(scratch,'data','personal.txt'),'private');assert(!(await audit(scratch)).ok);}finally{await rm(scratch,{recursive:true,force:true});}
console.log('Public-source contracts passed; no publication performed.');
