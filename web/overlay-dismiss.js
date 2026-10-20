/* Shared dismissal policy for static, dynamic and exported dialogs. */
(() => {
 if(globalThis.StudioOverlays)return;
 const order=new WeakMap();let sequence=0,press=null,suppressClick=false;
 const top=()=>[...document.querySelectorAll('dialog[open]')].sort((a,b)=>(order.get(a)||0)-(order.get(b)||0)).at(-1);
 const outside=(dialog,event)=>{const rect=dialog.getBoundingClientRect();return event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom;};
 function request(dialog=top()){
  if(!dialog?.open)return;
  // Use the same cancel event as Escape; save/export guards stay effective.
  if(typeof dialog.requestClose==='function')dialog.requestClose('cancel');
  else if(dialog.dispatchEvent(new Event('cancel',{cancelable:true})))dialog.close('cancel');
 }
 document.addEventListener('beforetoggle',event=>{if(event.target instanceof HTMLDialogElement&&event.newState==='open')order.set(event.target,++sequence);},true);
 const observer=new MutationObserver(records=>{for(const record of records)if(record.type==='attributes'&&record.target instanceof HTMLDialogElement&&record.target.open)order.set(record.target,++sequence);});
 observer.observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['open']});
 document.addEventListener('pointerdown',event=>{const dialog=top();press=dialog&&event.button===0&&outside(dialog,event)?{dialog,id:event.pointerId,x:event.clientX,y:event.clientY}:null;},true);
 document.addEventListener('pointercancel',()=>press=null,true);
 document.addEventListener('pointerup',event=>{const start=press;press=null;if(!start||start.id!==event.pointerId||start.dialog!==top()||!outside(start.dialog,event)||Math.hypot(event.clientX-start.x,event.clientY-start.y)>8)return;suppressClick=true;setTimeout(()=>suppressClick=false,0);request(start.dialog);},true);
 document.addEventListener('click',event=>{if(suppressClick){suppressClick=false;event.preventDefault();event.stopImmediatePropagation();}},true);
 document.addEventListener('keydown',event=>{
  if(event.key!=='Escape'||event.isComposing)return;
  const dialog=top();if(dialog){event.preventDefault();event.stopImmediatePropagation();if(!event.repeat)request(dialog);return;}
  const menus=[...document.querySelectorAll('details.album-more[open]')];if(menus.length){event.preventDefault();for(const menu of menus)menu.open=false;menus.at(-1).querySelector('summary')?.focus();}
 },true);
 document.addEventListener('click',event=>{for(const menu of document.querySelectorAll('details.album-more[open]'))if(!menu.contains(event.target))menu.open=false;});
 globalThis.StudioOverlays={request,top};
})();
