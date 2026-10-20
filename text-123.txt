const $ = (selector) => document.querySelector(selector);
let albums = [];
let query = '';
let view = localStorage.getItem('bookStudioView') || 'grid';
let pendingDeleteAlbum = null;
let bookFilter='active',bookTrash=[],projectManaging=false;
const bookFilters=CollectionUI.filters({label:'画册项目状态',attribute:'bookFilter',onChange:key=>{bookFilter=key;render();}});
$('#albumGrid').before(bookFilters.node);
const bookNote=document.createElement('p');bookNote.className='collection-state-note';bookFilters.node.after(bookNote);
const coverColors = new Map();
const bookSizes = new Map();
const bookConfigs = new Map();
const configErrors = new Set();
const edgeColors = {ivory:'#ebe5d9',white:'#f7f7f4',gray:'#a5a39f',black:'#29292b',kraft:'#b89568'};
const bounded = (value, fallback, min, max) => Math.min(max,Math.max(min,Number.isFinite(Number(value))?Number(value):fallback));

function applyBookConfig(card) {
  const config=bookConfigs.get(card.dataset.id);
  if(!config)return;
  const book=card.querySelector('.album-book'),page=config.pages?.[0]||{};
  const scale=Math.max(...bookDimensions(config))/640;
  card.style.setProperty('--book-edge',edgeColors[config.edgeColor]||edgeColors.ivory);
  card.style.setProperty('--book-depth',((4+bounded(config.thickness,3,1,5)*2)*scale)+'px');
  card.style.setProperty('--book-radius',(bounded(config.cornerRadius,3,0,8)*scale)+'px');
  card.style.setProperty('--book-shadow',String(bounded(config.contactShadow,42,0,70)/100));
  card.style.setProperty('--book-texture',String(config.material==='none'?0:bounded(config.texture,0,0,24)/300));
  book.dataset.material=Object.hasOwn(BookPresentation.materials,config.material)?config.material:'none';
  book.dataset.finish=['matte','linen','soft-touch'].includes(config.coverFinish)?config.coverFinish:'none';
  book.dataset.lighting=Object.hasOwn(BookPresentation.lights,config.lighting)?config.lighting:'soft';
  card.style.setProperty('--book-light',String(bounded(config.lightIntensity,50,0,100)/100));
  const scenes={
    charcoal:'radial-gradient(ellipse,#252529,transparent 70%)',
    gallery:'radial-gradient(ellipse,#dededa66,transparent 70%)',
    burgundy:'radial-gradient(ellipse,#6a293380,transparent 70%)',
    warm:'radial-gradient(ellipse,#b5aea366,transparent 70%)',
    concrete:'repeating-linear-gradient(115deg,#303133 0 2px,#28292b 2px 6px)'
  };
  const cover=card.querySelector('.album-cover');
  cover.style.setProperty('--book-scene',scenes[config.scene]||scenes.charcoal);
  if(config.scene==='custom'&&typeof config.backgroundImage==='string'&&config.backgroundImage.startsWith('/media/'))
    cover.style.setProperty('--book-scene',`linear-gradient(#0006,#0006),url(${JSON.stringify(config.backgroundImage)})`);
  const image=book.querySelector('img');
  if(image)PageComposition.mount(book.querySelector('.image-frame'),image,config,page);
  else{
    const placeholder=book.querySelector('.empty-cover');placeholder.style.background=page.color||'#171719';
    card.style.setProperty('--cover-glow',colorRgb(page.color));
  }
  BookPresentation.surface(book.querySelector('.album-front'),true);
  BookPresentation.apply(cover,book,config,true);
}

function colorRgb(color) {
  const hex=/^#([0-9a-f]{6})$/i.exec(color||'');
  return hex?[0,2,4].map(i=>parseInt(hex[1].slice(i,i+2),16)).join(' '):'140 140 150';
}

function bookDimensions(album) {
  const pairs = {'16:9':[16,9], '4:3':[4,3], '16:10':[16,10], '2:3':[2,3], '1:1':[1,1], '2:1':[2,1], '1.618:1':[1.618,1]};
  let pair = album.ratio === 'custom' ? [Number(album.customWidth)||3, Number(album.customHeight)||4] : (pairs[album.ratio]||[3,4]);
  const short=Math.min(...pair),long=Math.max(...pair);
  pair=album.landscape?[long,short]:[short,long];
  const scale=Math.min(218/pair[0],216/pair[1]);
  return [pair[0]*scale,pair[1]*scale];
}

function decorateCover(img) {
  const card=img.closest('.album-card');
  if(!card || !img.naturalWidth)return;
  // Use only a tiny sample of an already loaded local cover; never alter sources.
  const config=bookConfigs.get(card.dataset.id),page=config?.pages?.[0]||{};
  const key=img.currentSrc+JSON.stringify([config?.ratio,config?.landscape,config?.customWidth,config?.customHeight,config?.margin,config?.fit,page.crop,page.color]);
  let color=coverColors.get(key);
  if(!color){
    try{
      const canvas=document.createElement('canvas');canvas.width=24;canvas.height=24;
      const ctx=canvas.getContext('2d',{willReadFrequently:true});
      if(config){
        const [rw,rh]=PageComposition.ratio(config),unit=640/Math.max(rw,rh),w=rw*unit,h=rh*unit;
        const margin=Math.min(Number(config.margin)||0,Math.min(w,h)*.45);
        const g=PageComposition.geometry(img.naturalWidth,img.naturalHeight,w-2*margin,h-2*margin,page.crop,config.fit);
        ctx.fillStyle='#f4f0e8';ctx.fillRect(0,0,24,24);
        ctx.save();ctx.scale(24/w,24/h);ctx.beginPath();ctx.rect(margin,margin,w-2*margin,h-2*margin);ctx.clip();
        ctx.fillStyle=page.color||'#d2d0ca';ctx.fillRect(margin,margin,w-2*margin,h-2*margin);
        ctx.drawImage(img,margin+g.left,margin+g.top,g.width,g.height);ctx.restore();
      }else ctx.drawImage(img,0,0,24,24);
      const pixels=ctx.getImageData(0,0,24,24).data,bins=new Map();
      for(let i=0;i<pixels.length;i+=4){
        const r=pixels[i],g=pixels[i+1],b=pixels[i+2],high=Math.max(r,g,b),low=Math.min(r,g,b);
        if(pixels[i+3]<128||high<35||low>225)continue;
        const key=[r>>5,g>>5,b>>5].join(',');
        const bin=bins.get(key)||{r:0,g:0,b:0,count:0,weight:0};
        bin.r+=r;bin.g+=g;bin.b+=b;bin.count++;bin.weight+=.25+(high-low)/Math.max(high,1);
        bins.set(key,bin);
      }
      const dominant=[...bins.values()].sort((a,b)=>b.weight-a.weight)[0];
      if(dominant){
        const rgb=[dominant.r,dominant.g,dominant.b].map(v=>v/dominant.count);
        const gain=Math.max(1,160/Math.max(...rgb));
        color=rgb.map(v=>Math.min(220,Math.round(v*gain))).join(' ');
      }else color='140 140 150';
    }catch{color='140 140 150';}
    coverColors.set(key,color);
  }
  card.style.setProperty('--cover-glow',color);
}

async function api(path, options = {}) {
  const response = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...options });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || '操作失败');
  return result;
}

function toast(message) {
  const node = $('#toast'); node.textContent = message; node.classList.add('show');
  clearTimeout(toast.timer); toast.timer = setTimeout(() => node.classList.remove('show'), 1800);
}

function formatTime(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat(globalThis.StudioI18n?.language==='en'?'en-US':'zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}


function render() {
  const normalized = query.trim().toLowerCase();
  const visible = (bookFilter==='trash'?bookTrash:albums.filter(a=>Boolean(a.archived)===(bookFilter==='archived'))).filter((album) => {
    return (!normalized || album.title.toLowerCase().includes(normalized));
  });
  $('#bookProjectCount').textContent = albums.filter(a=>!a.archived).length;
  bookNote.textContent=CollectionUI.note(bookFilter);bookNote.hidden=!bookNote.textContent;
  $('#emptyState h2').textContent=bookFilter==='trash'?'回收站为空':bookFilter==='archived'?'还没有归档的画册':'还没有符合条件的画册';
  $('#emptyState [data-create]').hidden=bookFilter!=='active';
  $('#emptyState').hidden = visible.length > 0;
  $('#albumGrid').className = `album-grid ${view === 'list' ? 'list' : ''}`;
  $('#gridView').classList.toggle('active', view === 'grid');
  $('#listView').classList.toggle('active', view === 'list');
  $('#albumGrid').innerHTML = visible.map((album) => `
    <article class="album-card" data-id="${album.id}" tabindex="0" role="group" aria-label="${escapeHtml(album.title)}">
      <div class="album-cover"><div class="album-book"><div class="album-front">${album.coverSrc ? `<div class="image-frame"><img src="${escapeHtml(album.coverSrc)}" alt="" loading="lazy" decoding="async"></div>` : `<div class="empty-cover"><small>PHOTO JOURNAL</small><strong>${escapeHtml(album.title)}</strong><span>2026</span></div>`}<i class="album-texture" aria-hidden="true"></i><i class="album-light" aria-hidden="true"></i></div></div></div>
      <div class="album-info">
        <div class="album-title-row"><h2>${escapeHtml(album.title)}</h2></div>
        <p class="album-meta">${bookFilter==='trash'?'恢复后回到'+(album.archived?'已归档':'正常')+'列表 · ':''}${configErrors.has(album.id)?'配置读取失败，请刷新重试':`${album.pageCount} 页 · 修改于 ${formatTime(album.updatedAt)}`}</p>
        <div class="album-actions">
          ${bookFilter==='trash'?'<button class="open" data-action="restore-trash">恢复项目</button>':`<button class="open" data-action="open">打开编辑</button>
          <button data-action="preview">${window.DevicePreview?.available() ? '设备预览' : '预览'}</button>
          <details class="album-more"><summary aria-label="更多画册操作">⋯</summary><div class="album-menu"><button data-action="rename">重命名</button><button data-action="duplicate">复制项目</button><button data-action="archive">${album.archived?'取消归档':'归档'}</button><button data-action="delete" class="danger">移入回收站</button></div></details>`}
        </div>
      </div>
    </article>`).join('');
  document.querySelectorAll('.album-card').forEach(card=>{
    const size=bookSizes.get(card.dataset.id)||[162,216];
    card.style.setProperty('--book-width',size[0]+'px');card.style.setProperty('--book-height',size[1]+'px');
    applyBookConfig(card);
    const img=card.querySelector('img');
    if(img){img.addEventListener('load',()=>decorateCover(img),{once:true});if(img.complete)decorateCover(img);}
  });
  const showBooks=$('#galleryProjectSection').hidden;bookFilters.node.hidden=!showBooks;bookNote.hidden=!showBooks||!bookNote.textContent;
}

function escapeHtml(value = '') { const node = document.createElement('div'); node.textContent = value; return node.innerHTML; }

async function load() {
  const [result,trash]=await Promise.all([api('/api/albums'),api('/api/local-projects/book/trash')]);bookTrash=trash.items;
  albums = result.albums;
  // Read saved book ratios, not the image ratio (a landscape image may be on a portrait leaf).
  const pending=[...albums];
  await Promise.all(Array.from({length:Math.min(4,pending.length)},async()=>{
    while(pending.length){
      const item=pending.shift();
      try{
        const data=await api(`/api/albums/${encodeURIComponent(item.id)}`),config=data.album||data;
        bookConfigs.set(item.id,config);bookSizes.set(item.id,bookDimensions(config));configErrors.delete(item.id);
        item.coverSrc=config.pages?.[0]?.src||'';
      }
      catch{configErrors.add(item.id);if(!bookSizes.has(item.id))bookSizes.set(item.id,[162,216]);}
    }
  }));
  render();
}

async function createProject() {
  const title = $('#newTitle').value.trim() || '未命名画册';
  $('#globalStatus').textContent = '正在创建…';
  const result = await api('/api/albums', { method: 'POST', body: JSON.stringify({ title }) });
  location.href = `/?id=${encodeURIComponent(result.album.id)}`;
}

$('#search').addEventListener('input', (event) => { query = event.target.value; render(); });
$('#gridView').onclick = () => { view = 'grid'; localStorage.setItem('bookStudioView', view); render(); };
$('#listView').onclick = () => { view = 'list'; localStorage.setItem('bookStudioView', view); render(); };
const openCreate = () => { $('#createDialog').showModal(); setTimeout(() => $('#newTitle').select(), 0); };
$('#createAlbum').onclick = () => $('#projectTypeDialog').showModal();
window.BookStudioProjects = { openCreate,setVisible:visible=>{bookFilters.node.hidden=!visible;bookNote.hidden=!visible||!bookNote.textContent;} };
document.querySelectorAll('[data-create]').forEach((button) => button.onclick = openCreate);
$('#createForm').addEventListener('submit', (event) => {
  if (event.submitter?.value === 'cancel') return;
  event.preventDefault();
  const button = $('#confirmCreate');
  button.disabled = true;
  (window.AlbumAI ? window.AlbumAI.submit() : createProject()).catch((error) => {
    $('#globalStatus').textContent = '操作未完成'; toast(error.message);
    const message = $('#createMessage'); message.hidden = false; message.textContent = error.message;
  }).finally(() => { button.disabled = false; });
});
$('#albumGrid').addEventListener('click', async (event) => {
  if(event.target.closest('summary'))return;
  const action = event.target.closest('[data-action]')?.dataset.action;
  const card = event.target.closest('[data-id]');
  if (!card) return;
  const id = card.dataset.id;
  card.querySelector('details')?.removeAttribute('open');
  if(projectManaging)return;
  if(bookFilter==='trash'&&action!=='restore-trash')return;
  if(['rename','archive','restore-trash'].includes(action)){
    projectManaging=true;$('#albumGrid').inert=true;bookFilters.node.inert=true;
    try{const item=albums.find(a=>a.id===id);let payload={};if(action==='rename'){const title=await StudioProjectTools.rename(item);if(!title)return;payload={title};}if(action==='archive')payload={archived:!item.archived};await StudioProjectTools.action('book',id,action,payload);await load();toast(action==='restore-trash'?'已恢复到移除前的分类':'项目已更新');}catch(e){toast(e.message);}finally{projectManaging=false;$('#albumGrid').inert=false;bookFilters.node.inert=false;}return;
  }
  if (!action) { location.href = `/?id=${encodeURIComponent(id)}`; return; }
  if (action === 'open') location.href = `/?id=${encodeURIComponent(id)}`;
  if (action === 'preview') {
    if (window.DevicePreview?.available()) window.DevicePreview.open(id);
    else location.href = `/album/?id=${encodeURIComponent(id)}`;
  }
  if (action === 'duplicate') {
    try { await api(`/api/albums/${id}/duplicate`, { method: 'POST' }); await load(); toast('画册副本已创建'); }
    catch (error) { toast(error.message); }
  }
  if (action === 'delete') {
    pendingDeleteAlbum = albums.find((album) => album.id === id) || null;
    if (!pendingDeleteAlbum) return;
    $('#deleteProjectMessage').textContent = `“${pendingDeleteAlbum.title}”将移入回收站，可以随时恢复；原始图片和已导出的文件不受影响。`;
    $('#deleteDialog').showModal();
  }
});
$('#albumGrid').addEventListener('keydown', (event) => {
  if (!['Enter', ' '].includes(event.key) || event.target.closest('button,summary')) return;
  const card = event.target.closest('[data-id]');
  if (!card) return;
  if(bookFilter==='trash')return;
  event.preventDefault();
  location.href = `/?id=${encodeURIComponent(card.dataset.id)}`;
});
document.addEventListener('click',event=>{
  document.querySelectorAll('.album-more[open]').forEach(menu=>{if(!menu.contains(event.target))menu.open=false;});
});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape')document.querySelectorAll('.album-more[open]').forEach(menu=>{menu.open=false;menu.querySelector('summary').focus();});
});
$('#cancelDelete').onclick = () => { pendingDeleteAlbum = null; $('#deleteDialog').close(); };
$('#confirmDelete').onclick = async () => {
  if (!pendingDeleteAlbum) return;
  const button = $('#confirmDelete');
  button.disabled = true; button.textContent = '正在删除…';
  try {
    await api(`/api/albums/${pendingDeleteAlbum.id}`, { method: 'DELETE' });
    pendingDeleteAlbum = null;
    $('#deleteDialog').close();
    await load();
    toast('画册已移入回收站');
  } catch (error) { toast(error.message); }
  finally { button.disabled = false; button.textContent = '移入回收站'; }
};
load().catch((error) => { $('#globalStatus').textContent = '读取失败'; toast(error.message); });
