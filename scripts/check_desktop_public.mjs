import {_electron} from 'playwright';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {mkdir,mkdtemp,writeFile,readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
const require=createRequire(import.meta.url),root=path.resolve(import.meta.dirname,'..');
const executable=process.env.BOOK_STUDIO_TEST_EXECUTABLE;
const parent=path.join(root,'work/desktop-qa');await mkdir(parent,{recursive:true});
const area=await mkdtemp(path.join(parent,'public-')),profile=path.join(area,'profile'),source=path.join(area,'source');
const python=process.env.BOOK_STUDIO_PYTHON||'python';
const seed=spawnSync(python,['scripts/seed_test_profile.py',source],{cwd:root,stdio:'inherit',windowsHide:true});if(seed.status!==0)throw Error('Could not seed isolated QA data');
const app=await _electron.launch({executablePath:executable||require('electron'),args:[...(executable?[]:[path.join(root,'desktop')]),'--studio-home='+profile,'--studio-qa=1','--import-source='+source],env:process.env,timeout:60000});
let origin,completed=false;const errors=[];
try{
 const page=await app.firstWindow();page.on('pageerror',e=>errors.push(e.message));await page.waitForURL('**/projects.html?type=*',{timeout:60000});await page.locator('.album-card').first().waitFor();origin=new URL(page.url()).origin;
 assert.equal((await fetch(origin+'/api/health')).status,403);assert.equal(await page.evaluate(()=>typeof require),'undefined');
 const info=await page.evaluate(()=>BookStudioDesktop.info());assert.equal(info.version,JSON.parse(await readFile(path.join(root,'package.json'),'utf8')).version);assert.equal(info.packaged,Boolean(executable));
 await page.evaluate(async()=>{await fetch('/api/studio/settings',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({autoBackup:false,confirmExit:false})});});
 await page.evaluate(()=>StudioApp.open());await page.locator('[data-setting=language]').selectOption('en');await page.waitForFunction(()=>document.documentElement.lang==='en');
 await page.waitForFunction(async()=>(await BookStudioDesktop.info()).language==='en');
 assert.deepEqual(await app.evaluate(({Menu})=>Menu.getApplicationMenu().items.map(i=>i.label)),['File','Edit','View','Help']);
 for(const width of [860,1024,1440]){await app.evaluate(({BrowserWindow},w)=>BrowserWindow.getAllWindows()[0].setSize(w,900),width);for(const tab of ['general','data','ai','help','about']){await page.locator(`[data-tab=${tab}]`).click();await page.waitForTimeout(60);assert.equal(await page.locator('#studioSettings').evaluate(n=>n.scrollWidth<=n.clientWidth),true);}}
 await page.locator('[data-tab=data]').click();await page.locator('#studioBackup').click();await page.waitForFunction(()=>document.querySelector('#studioSettingsMessage').textContent.startsWith('Backup saved:'));await page.screenshot({path:path.join(area,'settings-en.png')});await page.locator('#studioSettingsBack').click();
 await page.locator('.album-actions [data-action=open]').first().click();await page.waitForFunction(()=>typeof entrySnapshot!=='undefined'&&entrySnapshot.length>0);
 const before=await page.locator('#margin').inputValue();await page.locator('#margin').fill('12');await page.waitForFunction(()=>!dirty&&!saveInFlight);await page.locator('#summary').click();
 await app.evaluate(({Menu})=>Menu.getApplicationMenu().items.find(i=>i.label==='Edit').submenu.items[0].click());await page.waitForFunction(v=>document.querySelector('#margin').value===v,before);await page.waitForFunction(()=>!dirty&&!saveInFlight);
 const exports=await page.evaluate(async()=>{const result=[];for(const format of ['pdf','offline']){const r=await fetch('/api/albums/sample-book/export?format='+format);const raw=new Uint8Array(await r.arrayBuffer());result.push({format,ok:r.ok,bytes:raw.length,signature:[...raw.slice(0,4)]});}return result;});assert(exports.every(e=>e.ok&&e.bytes>1000));assert.deepEqual(exports[0].signature,[37,80,68,70]);assert.deepEqual(exports[1].signature.slice(0,2),[80,75]);
 const downloadFile=path.join(area,'native-export.pdf');
 await app.evaluate(({BrowserWindow,dialog},filename)=>{globalThis.__qaMessage=dialog.showMessageBox;dialog.showMessageBox=async()=>({response:0});globalThis.__qaSaved=false;BrowserWindow.getAllWindows()[0].webContents.session.once('will-download',(_event,item)=>{item.setSavePath(filename);item.once('done',(_e,state)=>globalThis.__qaSaved=state==='completed');});},downloadFile);
 await page.locator('#openExport').click();await page.locator('#exportFormat').selectOption('pdf');await page.locator('#exportStart').click();
 for(let attempt=0;attempt<100;attempt++){if(await app.evaluate(()=>globalThis.__qaSaved))break;await page.waitForTimeout(100);}
 assert.equal(await app.evaluate(()=>globalThis.__qaSaved),true);assert.equal((await readFile(downloadFile)).subarray(0,4).toString(),'%PDF');
 await app.evaluate(({dialog})=>{dialog.showMessageBox=globalThis.__qaMessage;delete globalThis.__qaMessage;});await page.locator('#closeExport').click();
 const gallery=await page.evaluate(async()=>{const headers={'Content-Type':'application/json'},image=await fetch('/media/synthetic-1.png'),upload=await(await fetch('/api/gallery-images',{method:'POST',headers:{'Content-Type':'image/png'},body:await image.blob()})).json(),g=await(await fetch('/api/galleries',{method:'POST',headers,body:JSON.stringify({title:'设置'})})).json();g.artworks=[{id:'synthetic-art',title:'设置',description:'Original user content 中文',src:upload.src,width:900,height:1200}];return(await fetch('/api/galleries/'+g.id,{method:'PUT',headers,body:JSON.stringify(g)})).json();});
 await page.goto(origin+'/gallery.html?id='+gallery.id);await page.waitForFunction(()=>document.querySelector('#galleryStatus').textContent==='All gallery changes saved');assert.equal(await page.locator('.row-name b').textContent(),'设置');assert.equal(await page.locator('.gallery-zoom input').getAttribute('min'),'100');
 const handoff=await page.evaluate(async()=>{const id=new URLSearchParams(location.search).get('id'),check=await(await fetch('/api/galleries/'+id+'/preflight')).json(),pdf=await fetch('/api/galleries/'+id+'/export?format=guide'),zip=await fetch('/api/galleries/'+id+'/export');return{ok:check.ok,pdf:pdf.ok,zip:zip.ok,zipBytes:Array.from(new Uint8Array(await zip.arrayBuffer()))};});assert.deepEqual({ok:handoff.ok,pdf:handoff.pdf,zip:handoff.zip},{ok:true,pdf:true,zip:true});await writeFile(path.join(profile,'output/exports/Gallery.zip'),Buffer.from(handoff.zipBytes));
 await page.evaluate(()=>StudioApp.open());await page.locator('[data-setting=language]').selectOption('zh-CN');await page.waitForFunction(async()=>(await BookStudioDesktop.info()).language==='zh-CN');await page.waitForFunction(()=>!document.querySelector('[data-setting=language]').disabled);assert.equal(await app.evaluate(({Menu})=>Menu.getApplicationMenu().items[0].label),'文件');await page.locator('[data-setting=language]').selectOption('en');await page.waitForFunction(async()=>(await BookStudioDesktop.info()).language==='en');await page.locator('#studioSettingsBack').click();
 // Storage actions must work from the busy settings surface, and keep originals.
 await page.evaluate(()=>StudioApp.open('data'));
 await app.evaluate(({dialog})=>{globalThis.__qaOpen=dialog.showOpenDialog;dialog.showOpenDialog=async()=>({canceled:true,filePaths:[]});});
 await page.locator('#studioImport').click();await page.waitForFunction(()=>document.querySelector('#studioSettingsMessage').textContent==='Operation cancelled');
 await app.evaluate(({dialog})=>{dialog.showOpenDialog=globalThis.__qaOpen;delete globalThis.__qaOpen;});
 const originalData=(await page.evaluate(()=>BookStudioDesktop.info())).dataPath;
 const oldOriginal=await readFile(path.join(originalData,'photos/synthetic-1.png'));
 for(const kind of ['backup','data']){
  const parent=path.join(area,'external-'+kind);await mkdir(parent,{recursive:true});
  await app.evaluate(async({ipcMain,BrowserWindow,dialog},input)=>{
   const open=dialog.showOpenDialog,message=dialog.showMessageBox;
   dialog.showOpenDialog=async()=>({canceled:false,filePaths:[input.parent]});dialog.showMessageBox=async()=>({response:1});
   try{const win=BrowserWindow.getAllWindows().find(w=>!w.isDestroyed()&&w.webContents.getURL().includes('127.0.0.1'));return await ipcMain._invokeHandlers.get('studio:storage')({sender:win.webContents,senderFrame:win.webContents.mainFrame},input.kind);}finally{dialog.showOpenDialog=open;dialog.showMessageBox=message;}
  },{kind,parent});
  await page.waitForURL('**/projects.html?type=*');await page.waitForFunction(()=>window.StudioApp);
 }
 const migrated=await page.evaluate(()=>BookStudioDesktop.info());assert.notEqual(migrated.dataPath,originalData);assert(migrated.backupPath.includes('external-backup'));
 assert.deepEqual(await readFile(path.join(migrated.dataPath,'photos/synthetic-1.png')),oldOriginal);assert.deepEqual(await readFile(path.join(originalData,'photos/synthetic-1.png')),oldOriginal);
 const diagnostic=await app.evaluate(async({ipcMain,BrowserWindow,dialog},filename)=>{const save=dialog.showSaveDialog;dialog.showSaveDialog=async()=>({canceled:false,filePath:filename});try{const win=BrowserWindow.getAllWindows()[0];return await ipcMain._invokeHandlers.get('studio:diagnostics')({sender:win.webContents,senderFrame:win.webContents.mainFrame});}finally{dialog.showSaveDialog=save;}},path.join(area,'diagnostics.json'));
 assert(diagnostic.ok);const diagnosis=JSON.parse(await readFile(path.join(area,'diagnostics.json'),'utf8'));assert.equal(diagnosis.redacted,true);assert(!JSON.stringify(diagnosis).includes(area));assert(!('events' in diagnosis));
 const releaseConfig=JSON.parse(await readFile(path.join(root,'desktop/release.json'),'utf8'));
 const updateResult=await page.evaluate(()=>BookStudioDesktop.checkUpdates());
 if(releaseConfig.owner&&releaseConfig.repo){assert.equal(info.updatesConfigured,true);assert(['no_release','current','available','rate_limited'].includes(updateResult.status),'Official update check failed: '+updateResult.status);console.log('Official update endpoint status:',updateResult.status);}
 else assert.equal(updateResult.status,'unconfigured');
 const migratedPDF=await page.evaluate(async()=>{const response=await fetch('/api/albums/sample-book/export?format=pdf');return {ok:response.ok,bytes:(await response.arrayBuffer()).byteLength};});assert(migratedPDF.ok&&migratedPDF.bytes>1000);
 assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>StudioApp.prepareClose()),true);completed=true;
 await writeFile(path.join(area,'report.json'),JSON.stringify({ok:true,version:info.version,packaged:info.packaged,checks:['authenticated backend','renderer isolation','bilingual native menus','settings responsive','backup','book save and undo','PDF and offline export','gallery export','user-content protection','safe close'],exports,errors,independentCleanMachineAcceptance:'pending'},null,2));
 console.log('Desktop QA passed:',area);
}finally{await app.close();}
if(completed&&origin){await new Promise(r=>setTimeout(r,300));let alive=false;try{await fetch(origin+'/api/health');alive=true;}catch{}assert.equal(alive,false,'Owned backend must stop on close');}
