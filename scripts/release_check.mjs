// One local release gate. Never publishes, initializes Git, or touches real data.
import {spawn,spawnSync} from 'node:child_process';
import {mkdir,mkdtemp,readdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),python=process.env.BOOK_STUDIO_PYTHON||'python';
await mkdir('work/release-check',{recursive:true});const area=await mkdtemp(path.join(root,'work/release-check/run-')),results=[];let service;
function run(name,args,environment={}){console.log('\n'+name);const result=spawnSync(process.execPath,args,{cwd:root,env:{...process.env,...environment},stdio:'inherit',windowsHide:true,timeout:900000});results.push({name,ok:result.status===0&&!result.error});if(result.status!==0||result.error)throw Error(name+' failed');}
try{
 run('Dependency security',['scripts/audit_dependencies.mjs']);run('Public source rules',['scripts/test_public_source.mjs']);run('Desktop contracts',['--test','desktop/release-tools.test.mjs']);run('Editor contracts',['--test','web/album-change-state.test.mjs','web/composition.test.mjs','web/editor-controls.test.mjs']);run('Storage and migration',['scripts/run_python_tests.mjs']);
 let occupied=false;try{await fetch('http://127.0.0.1:4187/api/health',{signal:AbortSignal.timeout(1500)});occupied=true;}catch{}
 if(occupied)throw Error('Port 4187 is occupied. No existing service was terminated.');
 service=spawn(python,['scripts/gallery_test_server.py'],{cwd:root,env:process.env,stdio:'inherit',windowsHide:true});
 let ready=false;for(let i=0;i<100;i++){try{const r=await fetch('http://127.0.0.1:4187/api/health');if(r.ok){ready=true;break;}}catch{}await new Promise(resolve=>setTimeout(resolve,100));}if(!ready)throw Error('Isolated UI server failed');
 run('Bilingual responsive UI',['scripts/check_bilingual.mjs']);run('Dialogs and interaction',['scripts/check_release_interactions.mjs']);service.kill();service=undefined;
 run('Frozen backend',['scripts/build_desktop_backend.mjs']);const licenses=spawnSync(python,['scripts/collect_desktop_licenses.py'],{stdio:'inherit',windowsHide:true,cwd:root});if(licenses.status!==0)throw Error('License collection failed');
 const previous=new Set(await readdir('release'));run('Package application',['scripts/package_desktop.mjs']);const built=(await readdir('release')).find(name=>!previous.has(name));if(!built)throw Error('No new build');
 const priorQA=new Set(await readdir('work/desktop-qa'));run('Packaged desktop',['scripts/check_desktop_public.mjs'],{BOOK_STUDIO_TEST_EXECUTABLE:path.join(root,'release',built,'win-unpacked/BOOK STUDIO.exe')});const qa=(await readdir('work/desktop-qa')).find(name=>!priorQA.has(name)&&name.startsWith('public-'));if(!qa)throw Error('Missing desktop QA report');
 run('Offline handoff',['scripts/check_offline_public.mjs'],{BOOK_STUDIO_TEST_PROFILE:path.join(root,'work/desktop-qa',qa)});
 const priorSource=new Set(await readdir('work/public-release'));run('Clean source export',['scripts/export_public_source.mjs']);const snapshot=(await readdir('work/public-release')).find(name=>!priorSource.has(name));if(!snapshot)throw Error('Missing clean source');run('Independent source copy',['scripts/validate_public_source.mjs',path.join(root,'work/public-release',snapshot,'source')]);
 const reportPath=path.join(root,'release',built,'release-verification.json'),verification=JSON.parse(await readFile(reportPath,'utf8'));Object.assign(verification,{packagedDesktopAcceptance:'passed',independentCleanMachineAcceptance:'pending',published:false,qa:path.join('work/desktop-qa',qa),source:path.join('work/public-release',snapshot,'source'),releaseCheck:path.relative(root,area)});await writeFile(reportPath,JSON.stringify(verification,null,2));
 await writeFile(path.join(area,'report.json'),JSON.stringify({ok:true,results,release:built,source:snapshot,qa,uploaded:false,independentCleanMachineAcceptance:'pending'},null,2));console.log('Local release gate passed:',area);
}catch(error){await writeFile(path.join(area,'report.json'),JSON.stringify({ok:false,results,error:error.message,uploaded:false},null,2));throw error;}finally{service?.kill();}
