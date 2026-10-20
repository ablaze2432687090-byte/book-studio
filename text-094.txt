/* Authoring controls depend on an adapter, not the book or library stores. */
(() => {
 function attach(adapter){
  const $=s=>document.querySelector(s),chosen=new Set();
  const options=(pairs)=>pairs.map(([v,t])=>`<option value="${v}">${t}</option>`).join('');
  const frames=[['inherit','跟随展厅'],['black','黑色厚框'],['thin','极细黑框'],['wood','自然木框'],['white','白色画框'],['brass','暖金属框'],['none','无边框']];
  const section=document.createElement('section');section.className='gallery-layout-settings';section.innerHTML='<label for="galleryLayout">作品尺寸规则</label><select id="galleryLayout">'+options([['height','等高 · 统一视觉高度'],['width','等宽 · 统一视觉宽度'],['original','原比例 · 保留尺寸差异']])+'</select><label for="galleryAlign">对齐方式</label><select id="galleryAlign">'+options([['center','中心对齐'],['top','顶部对齐'],['bottom','底部对齐']])+'</select><label for="galleryMat">装裱卡纸</label><select id="galleryMat">'+options([['none','不加卡纸'],['ivory','象牙白卡纸'],['black','炭黑卡纸']])+'</select><label for="galleryLighting">照明方式</label><select id="galleryLighting">'+options([['spot','作品射灯'],['soft','柔和漫射'],['none','关闭照明']])+'</select>';
  $('#galleryFrame').closest('section').after(section);
  for(const [value,text]of [['wood','自然木框'],['white','白色画框']])$('#galleryFrame').add(new Option(text,value));
  for(const [value,text]of [['concrete','水泥灰展墙'],['navy','深蓝展墙']])$('#galleryWall').add(new Option(text,value));
  for(const [id,key]of [['galleryLayout','layout'],['galleryAlign','align'],['galleryMat','mat'],['galleryLighting','lighting']])$('#'+id).onchange=e=>adapter.mutate(g=>g[key]=e.target.value);
  const properties=document.createElement('details');properties.className='gallery-extra-properties';properties.innerHTML='<summary>作者、尺寸、展区与单件画框</summary><div class="gallery-prop-grid"><label>作者<input id="artAuthor" maxlength="120" placeholder="可选"></label><label>年份<input id="artYear" maxlength="40" placeholder="可选"></label></div><label for="artDimensions">作品尺寸说明</label><input id="artDimensions" maxlength="120" placeholder="例如 60 × 90 cm，可选"><label for="artSection">所属展区 / 章节</label><input id="artSection" maxlength="120" placeholder="相同名称归为一个展区" list="gallerySections"><datalist id="gallerySections"></datalist><label for="artFrame">单件画框</label><select id="artFrame">'+options(frames)+'</select>';
  $('#artDescription').after(properties);
  for(const [id,key]of [['artAuthor','author'],['artYear','year'],['artDimensions','dimensions'],['artSection','section'],['artFrame','frame']])$('#'+id).addEventListener('input',e=>adapter.mutate(g=>{const item=g.artworks.find(a=>a.id===adapter.selected());if(item)item[key]=e.target.value;}));
  const batch=document.createElement('div');batch.className='gallery-batch';batch.innerHTML='<label><input type="checkbox" id="gallerySelectAll"> 全选作品 <span id="gallerySelectedCount">已选 0 件</span></label><select id="galleryBatchFrame" aria-label="批量设置画框"><option value="">批量画框…</option>'+options(frames)+'</select><select id="galleryBatchSize" aria-label="批量设置尺寸"><option value="">批量尺寸…</option><option value="80">80%</option><option value="100">100% · 默认</option><option value="125">125%</option></select><button id="galleryBatchShow" type="button">显示</button><button id="galleryBatchHide" type="button">隐藏</button><button id="galleryBatchDelete" type="button" class="danger">删除所选</button>';
  $('#galleryArtList').before(batch);
  function apply(fn){if(!chosen.size||adapter.busy())return;adapter.mutate(g=>g.artworks.filter(a=>chosen.has(a.id)).forEach(fn));}
  $('#gallerySelectAll').onchange=e=>{chosen.clear();if(e.target.checked)for(const item of adapter.get()?.artworks||[])chosen.add(item.id);sync();};
  $('#galleryArtList').addEventListener('change',e=>{if(!e.target.matches('.gallery-select-art'))return;const id=e.target.closest('[data-id]').dataset.id;if(e.target.checked)chosen.add(id);else chosen.delete(id);sync();});
  $('#galleryBatchFrame').onchange=e=>{if(e.target.value)apply(item=>item.frame=e.target.value);e.target.value='';};$('#galleryBatchSize').onchange=e=>{if(e.target.value)apply(item=>item.scale=Number(e.target.value));e.target.value='';};
  $('#galleryBatchShow').onclick=()=>apply(item=>item.hidden=false);$('#galleryBatchHide').onclick=()=>apply(item=>item.hidden=true);
  const confirmation=document.createElement('dialog');confirmation.className='gallery-dialog';confirmation.id='galleryBatchDeleteDialog';confirmation.innerHTML='<h2>移除选中的作品？</h2><p>只从当前展厅移除，本次编辑期间可以撤销恢复。</p><div class="dialog-actions"><button type="button" data-cancel>取消</button><button type="button" class="primary" data-delete>确认移除</button></div>';document.body.append(confirmation);
  $('#galleryBatchDelete').onclick=()=>{if(chosen.size&&!adapter.busy())confirmation.showModal();};confirmation.querySelector('[data-cancel]').onclick=()=>confirmation.close();confirmation.querySelector('[data-delete]').onclick=()=>{adapter.mutate(g=>g.artworks=g.artworks.filter(a=>!chosen.has(a.id)));chosen.clear();confirmation.close();sync();};
  let galleryId;
  function sync(){const g=adapter.get();if(g?.id!==galleryId){chosen.clear();galleryId=g?.id;}const artworks=g?.artworks||[];for(const id of chosen)if(!artworks.some(item=>item.id===id))chosen.delete(id);
   for(const [id,key,fallback]of [['galleryLayout','layout','height'],['galleryAlign','align','center'],['galleryMat','mat','none'],['galleryLighting','lighting','spot']])$('#'+id).value=g?.[key]||fallback;
   const item=artworks.find(a=>a.id===adapter.selected());if(item)for(const [id,key]of [['artAuthor','author'],['artYear','year'],['artDimensions','dimensions'],['artSection','section'],['artFrame','frame']])if(document.activeElement!==$('#'+id))$('#'+id).value=item[key]||(key==='frame'?'inherit':'');
   const datalist=$('#gallerySections');datalist.replaceChildren();for(const name of new Set(artworks.map(item=>item.section).filter(Boolean)))datalist.append(new Option(name,name));
   $('#galleryArtList').querySelectorAll('[data-id]').forEach(row=>{let check=row.querySelector('.gallery-select-art');if(!check){check=document.createElement('input');check.type='checkbox';check.className='gallery-select-art';check.setAttribute('aria-label','选择作品 '+(row.querySelector('b')?.textContent||''));check.draggable=false;check.onpointerdown=e=>e.stopPropagation();row.prepend(check);}check.checked=chosen.has(row.dataset.id);});
   $('#gallerySelectedCount').textContent='已选 '+chosen.size+' 件';$('#gallerySelectAll').checked=!!artworks.length&&chosen.size===artworks.length;$('#gallerySelectAll').indeterminate=chosen.size>0&&chosen.size<artworks.length;
   batch.dataset.hasSelection=String(chosen.size>0);
   for(const control of batch.querySelectorAll('button,select'))control.disabled=!chosen.size||adapter.busy();
   advanced.sync();
  }
  const advanced=GalleryStudio.attach(adapter,chosen);
  return {sync,move(id,dx,dy){const ids=chosen.has(id)?chosen:new Set([id]);adapter.mutate(g=>{const snap=Number(g.snap)||10;for(const item of g.artworks)if(ids.has(item.id)){item.offsetX=Math.max(-500,Math.min(500,Math.round(((item.offsetX||0)+dx)/snap)*snap));item.offsetY=Math.max(-200,Math.min(200,Math.round(((item.offsetY||0)+dy)/snap)*snap));}});}};
 }
 globalThis.GalleryAuthoring={attach};
})();
