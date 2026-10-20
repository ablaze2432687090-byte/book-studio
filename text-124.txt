/* Shared, bounded session history. Each editor owns its snapshots and saving. */
(() => {
 const clone=value=>structuredClone(value);
 const stable=value=>JSON.stringify(value,(_key,item)=>item&&typeof item==='object'&&!Array.isArray(item)?Object.fromEntries(Object.keys(item).sort().filter(k=>!['revision','updatedAt','status','publishedAt','preparedAt','shareUrl'].includes(k)).map(k=>[k,item[k]])):item);
 let inputGroup='';
 document.addEventListener('input',event=>{inputGroup=event.target.id||event.target.name||'input';queueMicrotask(()=>inputGroup='');},true);
 class History {
  constructor({restore,changed=()=>{},limit=60}){this.restore=restore;this.changed=changed;this.limit=limit;this.entries=[];this.cursor=-1;this.locked=false;this.lease=crypto.randomUUID();this.heartbeat=setInterval(()=>this.protect(),300000);}
  protect(){const refs=[...new Set(this.entries.flatMap(entry=>(entry.artworks||entry.pages||[]).map(item=>item.src).filter(src=>typeof src==='string'&&/^\/(?:media|gallery-media|library-media)\//.test(src))))];void fetch('/api/local-projects/media-lease',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:this.lease,refs})}).catch(()=>{});}
  reset(value){this.entries=[clone(value)];this.cursor=0;this.key='';this.notify();}
  reconcile(value){const fingerprint=stable(value);const index=this.entries.findLastIndex(entry=>stable(entry)===fingerprint);if(index>=0){this.entries.splice(index+1);this.cursor=index;}else this.reset(value);this.key='';this.notify();}
  record(value,key=inputGroup){if(this.locked||this.cursor<0)return;if(stable(value)===stable(this.entries[this.cursor]))return;
   const merge=key&&key===this.key&&Date.now()-this.time<800&&this.cursor===this.entries.length-1&&this.cursor>0;
   this.entries.splice(this.cursor+1);if(merge)this.entries[this.cursor]=clone(value);else{this.entries.push(clone(value));this.cursor++;}
   if(this.entries.length>this.limit+1){this.entries.shift();this.cursor--;}
   this.key=key;this.time=Date.now();this.notify();
  }
  async move(direction){if(this.locked||this.disabled?.())return;const next=this.cursor+direction;if(next<0||next>=this.entries.length)return;this.locked=true;this.notify();try{await this.restore(clone(this.entries[next]));this.cursor=next;this.key='';}finally{this.locked=false;this.notify();}}
  undo(){return this.move(-1);}redo(){return this.move(1);}
  notify(){clearTimeout(this.leaseTimer);this.leaseTimer=setTimeout(()=>this.protect(),400);this.changed({undo:this.cursor>0&&!this.locked&&!this.disabled?.(),redo:this.cursor>=0&&this.cursor<this.entries.length-1&&!this.locked&&!this.disabled?.()});}
 }
 function bind(parent,options){const controls=document.createElement('div');controls.className='studio-history-controls';controls.setAttribute('role','group');controls.setAttribute('aria-label','编辑历史');controls.innerHTML='<button type="button" data-history="undo" title="撤销 · Ctrl+Z" aria-label="撤销上一次编辑">↶ <span>撤销</span></button><button type="button" data-history="redo" title="重做 · Ctrl+Shift+Z / Ctrl+Y" aria-label="重做编辑">↷ <span>重做</span></button>';parent.prepend(controls);
  const history=new History({...options,changed:state=>{controls.querySelector('[data-history=undo]').disabled=!state.undo;controls.querySelector('[data-history=redo]').disabled=!state.redo;options.changed?.(state);}});history.disabled=options.disabled;
  document.addEventListener('close',()=>history.notify(),true);
  controls.onclick=event=>{const button=event.target.closest('[data-history]');if(button)history[button.dataset.history]().catch(error=>options.error?.(error));};
  const editable=()=>document.activeElement?.matches('input:not([type=range]):not([type=checkbox]),textarea,[contenteditable=true]');
  const action=kind=>{if(editable()){document.execCommand(kind);return;}return history[kind]();};
  document.addEventListener('keydown',event=>{if(!(event.ctrlKey||event.metaKey)||event.altKey||editable()||document.querySelector('dialog[open]'))return;let kind;if(event.key.toLowerCase()==='z')kind=event.shiftKey?'redo':'undo';else if(event.key.toLowerCase()==='y')kind='redo';if(kind){event.preventDefault();void history[kind]().catch(error=>options.error?.(error));}});
  globalThis.StudioHistory.active={action};history.notify();return history;
 }
 globalThis.StudioHistory={History,bind};
})();
