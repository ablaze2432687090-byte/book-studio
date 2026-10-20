// Online release-time checks only. This script never runs inside the customer app.
import {spawnSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
const directory='work/security-audit';await mkdir(directory,{recursive:true});
const node=spawnSync(process.platform==='win32'?(process.env.ComSpec||'cmd.exe'):'pnpm',process.platform==='win32'?['/d','/s','/c','pnpm audit --json']:['audit','--json'],{encoding:'utf8',windowsHide:true,timeout:120000,maxBuffer:8*1024*1024});
let npm;try{npm=JSON.parse(node.stdout);}catch{throw Error('Node dependency audit unavailable; release check cannot pass.');}
if(node.error||npm.error||!npm.metadata?.vulnerabilities)throw Error('Node dependency audit failed; inspect network and registry.');
const findings=Object.values(npm.advisories||{}).map(item=>({id:item.github_advisory_id,module:item.module_name,severity:item.severity,patched:item.patched_versions,findings:item.findings}));
// Upstream has no patched version. Only the optional build-time logging dependency
// is accepted here, not any packaged dependency or any future high severity issue.
const accepted=item=>item.id==='GHSA-hp3w-g68c-fv3c'&&item.module==='sprintf-js'&&item.severity==='moderate'&&item.findings.length>0&&item.findings.every(f=>f.dev===true&&f.optional===true&&f.bundled===false&&f.version==='1.1.3');
const exceptions=findings.filter(accepted).map(item=>({...item,reason:'Optional Electron downloader logging dependency; not shipped. No upstream patch. Re-evaluate on every release.'}));
const blocked=findings.filter(item=>!accepted(item));
const py=spawnSync(process.env.BOOK_STUDIO_PYTHON||'python',['-m','pip_audit','-r','desktop/requirements-build.txt','--no-deps','--disable-pip','--format','json','--progress-spinner','off'],{encoding:'utf8',windowsHide:true,timeout:180000,maxBuffer:8*1024*1024});
let python;try{python=JSON.parse(py.stdout);}catch{throw Error('Python audit unavailable. Install pip-audit in the build environment; no result is not a pass.');}
const pythonBlocked=(python.dependencies||[]).flatMap(item=>(item.vulns||[]).map(v=>({name:item.name,version:item.version,...v})));
const ok=!blocked.length&&!pythonBlocked.length&&!py.error&&py.status===0;
const report={ok,checkedAt:new Date().toISOString(),node:{blocked,exceptions,counts:npm.metadata.vulnerabilities},python:{blocked:pythonBlocked,dependencies:python.dependencies?.length||0},notASignature:true};
await writeFile(directory+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(!ok)process.exitCode=1;
