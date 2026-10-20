/* Explicit, allowlisted destinations; never rely on history length or referrer. */
(() => {
 const allowed=new Set(['/','/index.html','/projects.html','/gallery.html','/library.html']);
 let guard=null;
 function safePath(value,fallback='/projects.html'){
  try{const url=new URL(value,location.href);if(url.origin===location.origin&&allowed.has(url.pathname))return url.pathname+url.search;}catch{}
  return fallback;
 }
 async function go(target,beforeLeave=guard){const path=safePath(target);if(beforeLeave&&await beforeLeave(path)===false)return false;location.assign(path);return true;}
 function button(label,action){const node=document.createElement('button');node.type='button';node.className='studio-back';const arrow=document.createElement('span');arrow.setAttribute('aria-hidden','true');arrow.textContent='←';const text=document.createElement('span');text.textContent=label;node.append(arrow,text);node.setAttribute('aria-label',label);node.onclick=async()=>{if(node.disabled)return;node.disabled=true;try{await action();}finally{node.disabled=false;}};return node;}
 function addBack(parent,{label,target,beforeLeave}={}){const node=button(label||'返回项目中心',()=>go(typeof target==='function'?target():target,beforeLeave||guard));parent.prepend(node);return node;}
 function modalBack(dialog,{label='返回',target}={}){if(!dialog)return;const node=button(label,()=>{dialog.close();if(target)target.showModal();});const row=document.createElement('div');row.className='studio-return-row';row.append(node);(dialog.querySelector('.dialog-card,.share-card,.export-card')||dialog).append(row);return node;}
 function confirmLeave(message){return new Promise(resolve=>{const dialog=document.createElement('dialog');dialog.className='studio-nav-dialog';dialog.setAttribute('aria-label','返回前处理未保存修改');dialog.innerHTML='<h2>修改尚未保存</h2><p></p><div class="nav-actions"><button data-choice="discard">不保存并返回</button><button data-choice="cancel">继续编辑</button><button data-choice="retry">重试保存并返回</button></div>';dialog.querySelector('p').textContent=message+'\n已自动保存的内容不会因“不保存并返回”而撤销。';let choice='cancel';dialog.addEventListener('click',event=>{const action=event.target.closest('[data-choice]');if(action){choice=action.dataset.choice;dialog.close();}});dialog.addEventListener('close',()=>{dialog.remove();resolve(choice);},{once:true});document.body.append(dialog);dialog.showModal();dialog.querySelector('[data-choice=cancel]').focus();});}
 document.addEventListener('click',event=>{if(!guard||event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;const anchor=event.target.closest('a[href]');if(!anchor||anchor.download||anchor.target&&anchor.target!=='_self')return;let url;try{url=new URL(anchor.href);}catch{return;}if(url.origin!==location.origin||!allowed.has(url.pathname))return;event.preventDefault();event.stopImmediatePropagation();go(url.pathname+url.search).catch(()=>{});},true);
 globalThis.StudioNavigation={safePath,go,button,addBack,modalBack,confirmLeave,canLeave:()=>guard?guard():true,setGuard:value=>{guard=value;}};
})();
