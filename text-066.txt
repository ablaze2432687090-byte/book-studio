/* Verify a disposable copy; the distributable source snapshot stays clean. */
import {cp,mkdir,mkdtemp,readFile,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {audit} from './audit_public.mjs';
const root=path.resolve(import.meta.dirname,'..'),source=path.resolve(process.argv[2]||'');
if(!source.startsWith(path.join(root,'work/public-release')+path.sep)||path.basename(source)!=='source')throw Error('Select an exported source snapshot');
const scan=await audit(source);if(!scan.ok)throw Error('Source failed audit before validation');
const parent=path.join(root,'work/public-validation');await mkdir(parent,{recursive:true});const directory=await mkdtemp(path.join(parent,'check-')),checkout=path.join(directory,'source');await cp(source,checkout,{recursive:true});
const install=process.platform==='win32'?[process.env.ComSpec||'cmd.exe',['/d','/s','/c','pnpm install --frozen-lockfile --ignore-scripts']]:['pnpm',['install','--frozen-lockfile','--ignore-scripts']];
const commands=[install,[process.execPath,['scripts/test_public_source.mjs']],[process.execPath,['--test','desktop/release-tools.test.mjs']],[process.execPath,['--test','web/album-change-state.test.mjs','web/composition.test.mjs','web/editor-controls.test.mjs']],[process.execPath,['scripts/run_python_tests.mjs']]];
const results=[];
for(const [command,args]of commands){const result=spawnSync(command,args,{cwd:checkout,env:process.env,stdio:'inherit',windowsHide:true});results.push({command:path.basename(command),args,exitCode:result.status,error:result.error?.message});if(result.error||result.status!==0)break;}
const after=await audit(source);const report={ok:results.length===commands.length&&results.every(r=>r.exitCode===0)&&after.ok,version:JSON.parse(await readFile(path.join(source,'package.json'),'utf8')).version,source:path.relative(root,source).split(path.sep).join('/'),results,sourceRemainsClean:after.ok,independentCleanMachineAcceptance:'pending'};
await writeFile(path.join(directory,'validation.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({ok:report.ok,directory},null,2));if(!report.ok)process.exitCode=1;
