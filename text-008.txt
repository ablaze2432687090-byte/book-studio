const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('BookStudioDesktop',Object.freeze({
  info:()=>ipcRenderer.invoke('studio:info'),
  reveal:kind=>ipcRenderer.invoke('studio:reveal',kind),
  backup:()=>ipcRenderer.invoke('studio:backup'),
  diagnostics:()=>ipcRenderer.invoke('studio:diagnostics'),
  storage:kind=>ipcRenderer.invoke('studio:storage',kind),
  checkUpdates:()=>ipcRenderer.invoke('studio:check-updates'),
  official:kind=>ipcRenderer.invoke('studio:official',kind),
  onDownload:callback=>{const listener=(_event,value)=>callback(value);ipcRenderer.on('studio:download',listener);return()=>ipcRenderer.removeListener('studio:download',listener);},
  importData:()=>ipcRenderer.invoke('studio:import'),
  restore:()=>ipcRenderer.invoke('studio:restore'),
  restart:()=>ipcRenderer.invoke('studio:restart'),
  retry:()=>ipcRenderer.invoke('studio:retry'),
  setZoom:value=>ipcRenderer.invoke('studio:zoom',value),
  setLanguage:value=>ipcRenderer.invoke('studio:language',value),
  onAction:callback=>{const listener=(_event,value)=>callback(value);ipcRenderer.on('studio:action',listener);return()=>ipcRenderer.removeListener('studio:action',listener);},
  onClose:callback=>{const listener=async(_event,purpose)=>{let result=false;try{result=await callback(purpose);}catch{}ipcRenderer.send('studio:close-result',Boolean(result));};ipcRenderer.on('studio:before-close',listener);return()=>ipcRenderer.removeListener('studio:before-close',listener);}
}));
