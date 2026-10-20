import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir,mkdtemp,copyFile,cp,unlink,lstat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {allowed} from './public_policy.mjs';
import {audit} from './audit_public.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const toolchain=process.env.BOOK_STUDIO_TOOLCHAIN?path.resolve(process.env.BOOK_STUDIO_TOOLCHAIN):root;
const require=createRequire(path.join(toolchain,'package.json'));
const policyRequire=createRequire(import.meta.url);
policyRequire('../desktop/release-tools.cjs').assertReleasePolicy(JSON.parse(await readFile(path.join(root,'desktop/release.json'),'utf8')),JSON.parse(await readFile(path.join(root,'package.json'),'utf8')).version);
const {build}=require('electron-builder');
const electronDist=path.dirname(require('electron'));
const electronVersion=require('electron/package.json').version;
const builderRequire=createRequire(require.resolve('electron-builder'));
const libraryRequire=createRequire(builderRequire.resolve('app-builder-lib'));
const asar=libraryRequire('@electron/asar');
const config=JSON.parse(await readFile(path.join(root,'desktop/electron-builder.json'),'utf8'));
await mkdir(path.join(root,'work/desktop-licenses'),{recursive:true});
// Preserve upstream license texts alongside the frozen runtime.
for(const name of ['LICENSE','LICENSES.chromium.html'])await copyFile(path.join(electronDist,name),path.join(root,'work/desktop-licenses',name));
// Only product files enter the build, never project data or old website templates.
const version=JSON.parse(await readFile(path.join(root,'desktop/package.json'),'utf8')).version;
const release=path.join(root,'release',version+'-'+new Date().toISOString().replace(/[^0-9]/g,''));
const staging=await mkdtemp(path.join(root,'work/desktop-app-')),unpacked=path.join(release,'win-unpacked');
for(const name of ['main.cjs','preload.cjs','release-tools.cjs','storage-paths.cjs','release.json','startup.html','startup.js','package.json'])await copyFile(path.join(root,'desktop',name),path.join(staging,name));
await cp(electronDist,unpacked,{recursive:true});
await copyFile(path.join(unpacked,'electron.exe'),path.join(unpacked,'BOOK STUDIO.exe'));
await unlink(path.join(unpacked,'electron.exe')); // Only the just-copied build runtime, not user data.
execFileSync(process.env.BOOK_STUDIO_PYTHON||'python',[path.join(root,'scripts/stamp_desktop_exe.py'),path.join(unpacked,'BOOK STUDIO.exe')],{stdio:'inherit',windowsHide:true});
await asar.createPackage(staging,path.join(unpacked,'resources/app.asar'));
for(const resource of [...config.extraResources,{from:'../work/desktop-licenses',to:'licenses'}]){
 const source=path.resolve(root,'desktop',resource.from);
 await cp(source,path.join(unpacked,'resources',resource.to),{recursive:true,filter:async candidate=>{
  if((await lstat(candidate)).isSymbolicLink())throw Error('Build inputs must not contain links');
  const relative=path.relative(source,candidate).split(path.sep).join('/');
  if(!allowed(relative)||relative.endsWith('.test.mjs'))return false;
  if(!resource.filter||!relative)return true;
  return resource.filter.some(pattern=>pattern===relative||pattern.startsWith(relative+'/'));
 }});
}
const names=asar.listPackage(path.join(unpacked,'resources/app.asar'));
if(names.some(name=>name.includes('node_modules')||name.includes('.private')||name.includes('/data/')))throw Error('Unexpected private/dependency files in desktop archive');
const resources=path.join(unpacked,'resources');
const report=await audit(resources,{packaged:true});
report.backendAudit=JSON.parse(execFileSync(process.env.BOOK_STUDIO_PYTHON||'python',[path.join(root,'scripts/audit_backend.py'),path.join(resources,'backend/BookStudioService.exe')],{encoding:'utf8',windowsHide:true}));
report.version=version;report.electronVersion=electronVersion;report.archiveFiles=names;report.packagedDesktopAcceptance='pending';
await writeFile(path.join(release,'resource-audit.json'),JSON.stringify(report,null,2));
if(!report.ok)throw Error('Packaged resources failed privacy audit. No installer was built.');
const result=await build({projectDir:path.join(root,'desktop'),prepackaged:unpacked,publish:'never',config:{...config,directories:{output:release},electronVersion,electronDist,extraResources:[]}});
report.artifacts=[];
for(const filename of result){if(!filename.endsWith('.exe'))continue;const digest=createHash('sha256').update(await readFile(filename)).digest('hex');await writeFile(filename+'.sha256',digest+'  '+path.basename(filename)+'\n');report.artifacts.push({file:path.basename(filename),sha256:digest});}
await writeFile(path.join(release,'release-verification.json'),JSON.stringify(report,null,2));
console.log('Desktop artifacts:',result);
