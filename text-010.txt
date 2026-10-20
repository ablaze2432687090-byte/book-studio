import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtemp,mkdir,rm,readFile} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
const require=createRequire(import.meta.url),{diagnostics,links,checkUpdates}=require('./release-tools.cjs'),{writableDirectory}=require('./storage-paths.cjs');
const config={owner:'example',repo:'book-studio',channel:'preview'};
const fake=(value,status=200)=>async()=>new Response(JSON.stringify(value),{status});
test('diagnostics use a strict allowlist, including nested fields',()=>{
 const result=diagnostics({version:'0.3.1',language:'en',platform:'win32',arch:'x64',ready:true,status:{books:1,assets:'SECRET',events:'API-Key',path:'C:/private',title:'Customer'}});
 assert.equal(result.counts.books,1);assert.equal(result.counts.assets,0);assert.equal(result.redacted,true);assert.doesNotMatch(JSON.stringify(result),/SECRET|API-Key|private|Customer|events/);
});
test('unconfigured update sources never access the network',async()=>{assert.equal(links({}),null);assert.equal(links({owner:'bad/path',repo:'book'}),null);assert.equal((await checkUpdates({},'0.3.1',()=>{throw Error('network');})).status,'unconfigured');});
test('updates distinguish empty, current, preview, stable, errors and limits',async()=>{
 const releases=[{tag_name:'v0.4.0',prerelease:true,body:'<script>not executable</script>'},{tag_name:'0.3.1',prerelease:false},{tag_name:'v99.0.0',draft:true}];
 assert.equal((await checkUpdates(config,'0.3.1',fake(releases))).status,'available');
 assert.equal((await checkUpdates({...config,channel:'stable'},'0.3.1',fake(releases))).status,'current');
 assert.equal((await checkUpdates(config,'0.3.1',fake([]))).status,'no_release');
 for(const code of [403,429])assert.equal((await checkUpdates(config,'0.3.1',fake({},code))).status,'rate_limited');
 assert.equal((await checkUpdates(config,'0.3.1',fake({},404))).status,'no_release');
 assert.equal((await checkUpdates(config,'0.3.1',fake({bad:true}))).status,'error');
 assert.equal((await checkUpdates(config,'0.3.1',()=>Promise.reject(Error('private path')))).status,'error');
 assert.equal((await checkUpdates(config,'0.3.1',fake([{tag_name:'1.2.3',body:'x'.repeat(530000)}]))).status,'error');
});
test('storage cannot overlap data, application or drive roots',async()=>{
 const area=await mkdtemp(path.join(tmpdir(),'book-paths-'));
 try{const data=path.join(area,'current'),application=path.join(area,'app');await mkdir(data);await mkdir(application);
  for(const target of [data,path.join(data,'backup'),area,application,path.parse(area).root])await assert.rejects(()=>writableDirectory(target,{data,application}));
  assert.equal(await writableDirectory(path.join(area,'external'),{data,application}),path.join(area,'external'));
 }finally{await rm(area,{recursive:true,force:true});}
});
test('public release modules and version are included in the desktop build',async()=>{
 const root=JSON.parse(await readFile(new URL('../package.json',import.meta.url))),desktop=JSON.parse(await readFile(new URL('./package.json',import.meta.url))),build=JSON.parse(await readFile(new URL('./electron-builder.json',import.meta.url)));
 assert.equal(root.version,desktop.version);for(const file of ['release-tools.cjs','storage-paths.cjs','release.json'])assert(build.files.includes(file));
});
