const {app,BrowserWindow,ipcMain,dialog:systemDialog,shell,Menu,nativeTheme}=require('electron');
const path=require('node:path'),fs=require('node:fs/promises'),{spawn}=require('node:child_process'),crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const releaseTools=require('./release-tools.cjs'),releaseConfig=require('./release.json');
const {writableDirectory}=require('./storage-paths.cjs');
const argument=name=>process.argv.find(value=>value.startsWith('--'+name+'='))?.slice(name.length+3);
const appRoot=app.isPackaged?path.join(process.resourcesPath,'studio'):path.resolve(__dirname,'..');
require(path.join(appRoot,'web','i18n-catalog.js'));
const english=globalThis.BookStudioEnglish;
const tr=text=>state.language==='en'?(english[text]||text):text;
function localizeOptions(value){if(Array.isArray(value))return value.map(localizeOptions);if(!value||typeof value!=='object')return value;return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,['label','title','message','detail','name'].includes(key)&&typeof item==='string'?tr(item):key==='buttons'?item.map(tr):key==='submenu'||key==='filters'?localizeOptions(item):item]));}
const dialog=new Proxy(systemDialog,{get(target,key){const method=target[key];return typeof method==='function'?(...args)=>method.apply(target,args.map(arg=>arg&&typeof arg==='object'&&!(arg instanceof BrowserWindow)?localizeOptions(arg):arg)):method;}});
const dataHome=path.resolve(argument('studio-home')||path.join(app.getPath('appData'),'BookStudio'));
app.setPath('userData',dataHome);app.setName('BOOK STUDIO');
if(process.platform==='win32')app.setAppUserModelId('local.bookstudio.desktop');
const startup=pathToFileURL(path.join(__dirname,'startup.html')).href;
const token=crypto.randomBytes(32).toString('hex');
let window,service,origin='',starting=null,startupError='',quitting=false,replacing=false,closePending=false,downloads=0,state={},exitResolver;
const children=new Set();
const dataPath=()=>state.dataPath||path.join(dataHome,'data');
const backupPath=()=>state.backupPath||path.join(dataHome,'backups');
const env=()=>({...process.env,PYTHONIOENCODING:'utf-8',BOOK_STUDIO_HOME:dataHome,BOOK_STUDIO_DATA:dataPath(),BOOK_STUDIO_BACKUPS:backupPath(),BOOK_STUDIO_RESOURCE_ROOT:appRoot,BOOK_STUDIO_SESSION_TOKEN:token,BOOK_STUDIO_VERSION:app.getVersion()});
async function log(event){await fs.mkdir(path.join(dataHome,'logs'),{recursive:true});await fs.appendFile(path.join(dataHome,'logs','desktop.log'),new Date().toISOString()+' '+event+'\n');}
let stateWrites=Promise.resolve();
function saveState(){const snapshot=JSON.stringify(state,null,2);const operation=stateWrites.catch(()=>{}).then(async()=>{await fs.mkdir(dataHome,{recursive:true});const target=path.join(dataHome,'window-state.json');await fs.writeFile(target+'.tmp',snapshot);await fs.rename(target+'.tmp',target);});stateWrites=operation;return operation;}
function command(args=[]){return app.isPackaged?{exe:path.join(process.resourcesPath,'backend','BookStudioService.exe'),args}:{exe:process.env.BOOK_STUDIO_PYTHON||'python',args:[path.join(__dirname,'service_entry.py'),...args]};}
function spawnService(args=[]){const cmd=command(args);return spawn(cmd.exe,cmd.args,{cwd:appRoot,env:env(),windowsHide:true,stdio:['ignore','pipe','pipe']});}
async function api(route,options={}){const response=await fetch(origin+route,{...options,signal:AbortSignal.timeout(120000),headers:{'X-Book-Studio-Token':token,'Content-Type':'application/json',...options.headers}});const data=await response.json();if(!response.ok)throw Error(data.error||'本地服务请求失败');return data;}
function trusted(event){const sender=event.senderFrame;if(!sender||sender!==event.sender.mainFrame)return false;return sender.url===startup||(origin&&new URL(sender.url).origin===origin);}
function invoke(name,action){ipcMain.handle(name,async(event,...args)=>{if(!trusted(event))throw Error('不允许的客户端请求');return action(...args);});}
function owns(url){try{return origin&&new URL(url).origin===origin;}catch{return false;}}
async function external(url){let target;try{target=new URL(url);}catch{return;}if(!['https:','http:'].includes(target.protocol)||target.username||target.password)return;const answer=await dialog.showMessageBox(window,{type:'question',title:'打开外部链接',message:'是否在默认浏览器打开外部网站？',detail:target.hostname,buttons:['取消','打开'],defaultId:0,cancelId:0});if(answer.response===1)await shell.openExternal(target.href);}
function protect(win){
 win.webContents.setWindowOpenHandler(({url})=>{
  if(url==='about:blank'||owns(url))return{action:'allow',overrideBrowserWindowOptions:{width:1200,height:820,backgroundColor:'#101012',autoHideMenuBar:true,webPreferences:{contextIsolation:true,sandbox:true,nodeIntegration:false}}};
  void external(url);return{action:'deny'};
 });
 win.webContents.on('did-create-window',child=>{children.add(child);child.on('closed',()=>children.delete(child));protect(child);});
 win.webContents.on('will-navigate',(event,url)=>{if(url===startup||owns(url))return;event.preventDefault();void external(url);});
 win.webContents.on('will-redirect',(event,url)=>{if(!owns(url))event.preventDefault();});
}
async function stopService(){const child=service;service=null;if(!child||child.exitCode!==null)return;await new Promise(resolve=>{const timeout=setTimeout(resolve,4000);child.once('exit',()=>{clearTimeout(timeout);resolve();});child.kill();});}
async function startService(){
 if(starting)return starting;
 if(service&&service.exitCode===null&&origin){try{await api('/api/health');const preferences=await api('/api/studio/settings');await window.loadURL(origin+'/projects.html?type='+preferences.startup);return;}catch{await stopService();}}
 starting=(async()=>{
  if(state.dataPath){try{await fs.access(path.join(state.dataPath,'projects.json'));}catch{throw Error('作品数据位置不可用，请连接原磁盘后重试；不会创建空仓库替代。');}}
  startupError='';const child=spawnService();service=child;
  const ready=await new Promise((resolve,reject)=>{let buffer='';const timer=setTimeout(()=>reject(Error('本地服务启动超时，请重试或查看日志。')),25000);const fail=error=>{clearTimeout(timer);reject(error);};
   child.on('error',fail);child.once('exit',code=>{fail(Error('本地服务已退出（'+code+'）'));if(service===child&&!quitting&&!replacing){service=null;startupError='本地服务意外停止。已保存的作品仍保留，可重新连接。';void log('service-exit '+code);void window?.loadURL(startup);}});
   child.stdout.on('data',chunk=>{buffer+=chunk.toString('utf8');let index;while((index=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,index);buffer=buffer.slice(index+1);try{const data=JSON.parse(line);if(data.ready&&Number.isInteger(data.port)){clearTimeout(timer);resolve(data);}}catch{}}});
   child.stderr.on('data',chunk=>{const text=chunk.toString('utf8');if(!/^127\.0\.0\.1/.test(text))void log(text.replaceAll(token,'[session]'));});
  });
  origin='http://127.0.0.1:'+ready.port;
  await api('/api/health');
  await window.webContents.session.cookies.set({url:origin,name:'book_studio_session',value:token,httpOnly:true,sameSite:'strict'});
  let preferences=await api('/api/studio/settings');
  try{await fs.access(path.join(dataHome,'studio-settings.json'));}catch{if(state.language)preferences=await api('/api/studio/settings',{method:'PUT',body:JSON.stringify({language:state.language})});}
  await window.loadURL(origin+'/projects.html?type='+preferences.startup);
  if(preferences.autoBackup){try{const status=await api('/api/studio/status');if(!status.lastBackup||Date.now()-new Date(status.lastBackup).getTime()>86400000)await api('/api/studio/backup',{method:'POST',body:'{}'});}catch{await log('automatic-backup-failed');}}
  await log('service-ready');
 })().catch(async error=>{startupError=error.message;await stopService();await log('service-start-failed '+error.message);if(window&&!window.isDestroyed()){await window.loadURL(startup);window.webContents.send('studio:action','service-error');}throw error;}).finally(()=>{starting=null;});return starting;
}
async function rendererCanClose(purpose='close'){if(!owns(window.webContents.getURL()))return true;if(exitResolver)return false;return new Promise(resolve=>{exitResolver=resolve;window.webContents.send('studio:before-close',purpose);setTimeout(()=>{if(exitResolver===resolve){exitResolver=null;resolve(false);}},12000);});}
async function confirmLeave(){
 if(replacing){await dialog.showMessageBox(window,{type:'info',message:'正在处理数据，请稍候'});return false;}
 if(downloads){await dialog.showMessageBox(window,{type:'info',message:'文件正在导出或保存，请完成后再退出或切换数据。'});return false;}
 if(!await rendererCanClose()){await dialog.showMessageBox(window,{type:'warning',message:'仍有未完成操作或未保存修改，请先回到界面处理。'});return false;}
 const preferences=origin?await api('/api/studio/settings').catch(()=>({confirmExit:true})):{confirmExit:true};
 if(preferences.confirmExit){const answer=await dialog.showMessageBox(window,{type:'question',title:'BOOK STUDIO',message:'退出 BOOK STUDIO？',detail:'已保存的作品保留在本机。退出后会同时关闭预览窗口和本地服务。',buttons:['取消','退出'],defaultId:0,cancelId:0});if(answer.response!==1)return false;}
 return true;
}
async function exit(){if(closePending||quitting)return;closePending=true;try{if(!await confirmLeave())return;state.bounds=window.getNormalBounds();state.maximized=window.isMaximized();await saveState();quitting=true;await stopService();for(const child of children)child.destroy();window.destroy();app.quit();}finally{closePending=false;}}
async function reveal(kind){const paths={data:dataPath(),backups:backupPath(),logs:path.join(dataHome,'logs'),exports:path.join(dataHome,'output','exports')};if(!paths[kind])throw Error('未知目录');await fs.mkdir(paths[kind],{recursive:true});const error=await shell.openPath(paths[kind]);if(error)throw Error(error);return{ok:true};}
async function storageOperation(kind){
 if(replacing)throw Error('正在处理数据，请稍候');
 if(downloads)throw Error('文件正在导出或保存，请完成后再退出或切换数据。');
 if(!await rendererCanClose('storage'))return {cancelled:true};
 const choice=await dialog.showOpenDialog(window,{title:kind==='backup'?'选择备份位置':'选择作品数据位置',properties:['openDirectory','createDirectory']});
 if(choice.canceled)return {cancelled:true};
 const target=path.join(choice.filePaths[0],kind==='backup'?'BOOK STUDIO Backups':'BOOK STUDIO Data');
 await writableDirectory(kind==='backup'?target:path.dirname(target),{data:dataPath(),application:appRoot});
 if(kind==='data'){try{await fs.access(target);throw Error('目标已存在，请选择另一个空位置');}catch(error){if(error.code!=='ENOENT')throw error;}}
 const answer=await dialog.showMessageBox(window,{type:'warning',message:kind==='backup'?'更改备份保存位置？':'复制并校验作品数据后切换位置？',detail:target+'\n'+tr('原位置和已有备份保留，不会删除；请勿在操作时断开磁盘。'),buttons:['取消','继续'],defaultId:0,cancelId:0});
 if(answer.response!==1)return {cancelled:true};
 replacing=true;const previous={...state};
 try{
  if(kind==='data')await api('/api/studio/backup',{method:'POST',body:'{}'});
  for(const child of children)child.destroy();await stopService();await window.loadURL(startup);
  if(kind==='data'){await runDataCommand('migrate',target);state.dataPath=target;}else state.backupPath=target;
  await saveState();await startService();return {ok:true};
 }catch(error){state=previous;await saveState();await startService().catch(()=>{});throw error;}finally{replacing=false;}
}
async function dataOperation(kind,source){
 if(replacing)throw Error('正在处理数据，请稍候');
 if(downloads)throw Error('文件正在导出或保存，请完成后再退出或切换数据。');
 if(!await rendererCanClose('storage'))return{cancelled:true};
 let selection=source;
 if(!selection){const result=await dialog.showOpenDialog(window,kind==='import'?{title:'选择旧工作台或数据文件夹',properties:['openDirectory']}:{title:'选择 BOOK STUDIO 备份',filters:[{name:'BOOK STUDIO 备份',extensions:['zip']}],properties:['openFile']});if(result.canceled)return{cancelled:true};selection=result.filePaths[0];}
 const answer=await dialog.showMessageBox(window,{type:'warning',title:kind==='import'?'导入已有仓库':'恢复备份',message:'将切换到所选仓库，是否继续？',detail:'当前仓库会保留为恢复副本。不会删除或修改导入来源，不导入 API 密钥。',buttons:['取消','继续'],defaultId:0,cancelId:0});if(answer.response!==1)return{cancelled:true};
 replacing=true;
 try{try{await api('/api/studio/backup',{method:'POST',body:'{}'});}catch{const choice=await dialog.showMessageBox(window,{type:'warning',message:'当前仓库无法生成校验备份，是否继续修复？',detail:'导入/恢复仍会保留整个旧数据目录，不会删除。可先取消并查看日志。',buttons:['取消','继续并保留旧目录'],defaultId:0,cancelId:0});if(choice.response!==1)return{cancelled:true};}for(const child of children)child.destroy();await stopService();await window.loadURL(startup);
  const result=await runDataCommand(kind,selection);await startService();return result;
 }catch(error){await startService().catch(()=>{});throw error;}finally{replacing=false;}
}
function runDataCommand(kind,source){return new Promise((resolve,reject)=>{const child=spawnService(['--'+kind,source]);let output='';child.stdout.on('data',chunk=>output+=chunk.toString('utf8'));child.stderr.on('data',()=>{});child.once('error',reject);child.once('exit',()=>{try{const data=JSON.parse(output.trim().split('\n').at(-1));data.ok?resolve(data):reject(Error(data.error));}catch{reject(Error('数据校验或导入失败；原仓库仍保留。'));}});});}
function configureIpc(){
 invoke('studio:info',()=>({version:app.getVersion(),platform:process.platform,desktop:true,dataPath:dataPath(),backupPath:backupPath(),error:tr(startupError),zoom:state.zoom||1,packaged:app.isPackaged,updatesConfigured:!!releaseTools.links(releaseConfig),links:releaseTools.links(releaseConfig),language:state.language||'zh-CN',translations:state.language==='en'?english:{}}));
 invoke('studio:language',async value=>{if(!['zh-CN','en'].includes(value))throw Error('Invalid language');const changed=state.language!==value;state.language=value;menu();if(changed)await saveState();return{ok:true,language:state.language,menu:Menu.getApplicationMenu().items.map(item=>item.label)};});
 invoke('studio:reveal',reveal);invoke('studio:backup',()=>api('/api/studio/backup',{method:'POST',body:'{}'}));
 invoke('studio:diagnostics',async()=>{const result=await dialog.showSaveDialog(window,{title:'导出诊断信息',defaultPath:'BOOK-STUDIO-diagnostics.json',filters:[{name:'JSON 诊断信息',extensions:['json']}]});if(result.canceled)return{cancelled:true};const status=await api('/api/studio/status').catch(()=>({}));await fs.writeFile(result.filePath,JSON.stringify(releaseTools.diagnostics({version:app.getVersion(),platform:process.platform,arch:process.arch,language:state.language||'zh-CN',ready:!!status.version,packaged:app.isPackaged,status}),null,2));return{ok:true};});
 invoke('studio:storage',kind=>{if(!['data','backup'].includes(kind))throw Error('Invalid storage operation');return storageOperation(kind);});
 let checkingUpdates=null;
 invoke('studio:check-updates',()=>{if(!checkingUpdates)checkingUpdates=releaseTools.checkUpdates(releaseConfig,app.getVersion()).finally(()=>checkingUpdates=null);return checkingUpdates;});
 invoke('studio:official',async kind=>{const url=releaseTools.links(releaseConfig)?.[kind];if(!url)throw Error('官方仓库尚未配置。');await external(url);return {ok:true};});
 invoke('studio:import',()=>dataOperation('import'));invoke('studio:restore',()=>dataOperation('restore'));
 invoke('studio:retry',()=>startService());invoke('studio:restart',async()=>{if(!await rendererCanClose('storage'))return{cancelled:true};replacing=true;try{for(const child of children)child.destroy();await stopService();await window.loadURL(startup);await startService();return{ok:true};}finally{replacing=false;}});
 invoke('studio:zoom',async value=>{if(![.8,.9,1,1.1,1.25,1.5].includes(value))throw Error('缩放比例无效');state.zoom=value;window.webContents.setZoomFactor(value);await saveState();return{ok:true};});
 ipcMain.on('studio:close-result',(event,value)=>{if(trusted(event)&&exitResolver){const resolve=exitResolver;exitResolver=null;resolve(value===true);}});
}
function menu(){Menu.setApplicationMenu(Menu.buildFromTemplate(localizeOptions([
 {label:'文件',submenu:[{label:'项目中心',accelerator:'CmdOrCtrl+Shift+H',click:()=>window.webContents.send('studio:action','home')},{label:'保存当前项目',accelerator:'CmdOrCtrl+S',click:()=>window.webContents.send('studio:action','save')},{label:'备份工作台',click:()=>window.webContents.send('studio:action','backup')},{type:'separator'},{label:'设置',accelerator:'CmdOrCtrl+,',click:()=>window.webContents.send('studio:action','settings')},{type:'separator'},{label:'退出',accelerator:'Alt+F4',click:exit}]},
 {label:'编辑',submenu:[{label:'撤销',accelerator:'CmdOrCtrl+Z',click:()=>window.webContents.send('studio:action','undo')},{label:'重做',accelerator:'CmdOrCtrl+Shift+Z',click:()=>window.webContents.send('studio:action','redo')},{type:'separator'},{role:'cut',label:'剪切'},{role:'copy',label:'复制'},{role:'paste',label:'粘贴'},{role:'selectAll',label:'全选'}]},
 {label:'视图',submenu:[{role:'togglefullscreen',label:'全屏',accelerator:'F11'},{label:'恢复界面缩放',accelerator:'CmdOrCtrl+0',click:async()=>{state.zoom=1;window.webContents.setZoomFactor(1);await saveState();}}]},
 {label:'帮助',submenu:[{label:'使用说明',click:()=>window.webContents.send('studio:action','help')},{label:'关于 BOOK STUDIO',click:()=>window.webContents.send('studio:action','about')}]}])));}
if(!app.requestSingleInstanceLock()){app.quit();}else{
 app.on('second-instance',()=>{if(window){if(window.isMinimized())window.restore();window.show();window.focus();}});
 app.on('before-quit',event=>{if(!quitting){event.preventDefault();void exit();}});
 app.on('window-all-closed',()=>{if(quitting)app.quit();});
 app.whenReady().then(async()=>{
  nativeTheme.themeSource='dark';await fs.mkdir(dataHome,{recursive:true});try{state=JSON.parse(await fs.readFile(path.join(dataHome,'window-state.json'),'utf8'));}catch{}
  if(!state.language){try{const language=(await fs.readFile(path.join(dataHome,'installer-language.txt'),'utf8')).trim();if(['zh-CN','en'].includes(language))state.language=language;}catch{}}
  const oldLog=path.join(dataHome,'logs','desktop.log');try{if((await fs.stat(oldLog)).size>2*1024*1024)await fs.rename(oldLog,oldLog+'.previous');}catch{}
  window=new BrowserWindow({title:'BOOK STUDIO',width:state.bounds?.width||1440,height:state.bounds?.height||960,minWidth:860,minHeight:640,backgroundColor:'#101012',show:false,icon:path.join(appRoot,'assets','BOOK-STUDIO.ico'),webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,sandbox:true,nodeIntegration:false,webSecurity:true}});
  window.on('close',event=>{if(!quitting){event.preventDefault();void exit();}});window.webContents.on('did-finish-load',()=>window.webContents.setZoomFactor(state.zoom||1));
  protect(window);configureIpc();menu();
  window.webContents.on('render-process-gone',()=>{startupError='界面进程意外停止，请重新连接；已保存的作品仍保留。';void window.loadURL(startup);});
  const session=window.webContents.session;
  session.setPermissionRequestHandler((contents,permission,callback)=>callback(owns(contents.getURL())&&permission==='clipboard-sanitized-write'));
  session.setPermissionCheckHandler((contents,permission)=>Boolean(contents&&owns(contents.getURL())&&permission==='clipboard-sanitized-write'));
  session.webRequest.onHeadersReceived((details,callback)=>{const headers={...details.responseHeaders};if(owns(details.url))headers['Content-Security-Policy']=["default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'self'"];callback({responseHeaders:headers});});
  session.on('will-download',(_event,item)=>{downloads++;const filename=path.basename(item.getFilename());item.setSaveDialogOptions({title:tr('保存 BOOK STUDIO 导出文件'),defaultPath:path.join(app.getPath('downloads'),filename)});item.once('done',async(_event,result)=>{downloads--;if(result==='completed'){await fs.mkdir(path.join(dataHome,'output','exports'),{recursive:true});window?.webContents.send('studio:download',{status:'completed',name:filename});const answer=await dialog.showMessageBox(window,{type:'info',message:'导出文件已保存',detail:filename,buttons:['关闭','打开文件位置'],defaultId:0,cancelId:0});if(answer.response===1)shell.showItemInFolder(item.getSavePath());}else{window?.webContents.send('studio:download',{status:result==='cancelled'?'cancelled':'failed',name:filename});if(result!=='cancelled')void dialog.showMessageBox(window,{type:'warning',message:'导出文件未能保存，请重新导出。'});}});});
  await window.loadURL(startup);if(argument('studio-qa'))window.showInactive();else window.show();if(state.maximized)window.maximize();
  const source=argument('import-source');if(source){try{await fs.access(path.join(dataHome,'data','projects.json'));}catch{await runDataCommand('import',source);}}
  await startService().catch(()=>{});
 }).catch(async error=>{await log('startup-error '+error.message);await dialog.showMessageBox({type:'error',title:'BOOK STUDIO',message:'客户端启动失败',detail:error.message});quitting=true;await stopService();app.quit();});
}
