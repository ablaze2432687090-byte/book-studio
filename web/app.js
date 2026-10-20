const $ = (s) => document.querySelector(s);
BookPresentation.setupControls();
const ratioPairs = { '16:9': [16, 9], '4:3': [4, 3], '16:10': [16, 10], '2:3': [2, 3], '1:1': [1, 1], '2:1': [2, 1], '1.618:1': [1.618, 1] };
const presentationDefaults = { landscape: false, material: 'none', texture: 0, thickness: 3, edgeColor: 'ivory', cornerRadius: 3, contactShadow: 42, coverFinish: 'none', flipSpeed: 760, shadowOpacity: 42, turnStyle: 'natural', immersive: true, introMotion: true, scene: 'charcoal', lighting: 'soft', lightIntensity: 50, customWidth: 3, customHeight: 4, backgroundImage: '' };
const edgeColors = { ivory: '#ebe5d9', white: '#f7f7f4', gray: '#a5a39f', black: '#29292b', kraft: '#b89568' };
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const settingsDefaults = {
  material: { material: 'none', texture: 0, thickness: 3, edgeColor: 'ivory', cornerRadius: 3, contactShadow: 42, coverFinish: 'none', materialScope:'all', gloss:45 },
  motion: { shadow: true, flipSpeed: 760, shadowOpacity: 42, turnStyle: 'natural', immersive: true, introMotion: true },
  scene: { scene: 'charcoal', lighting: 'soft', lightIntensity: 50, lightDirection:0, lightTemperature:5500, shadowSoftness:50 },
};
let album;
let selectedId;
let spread = 0;
let dirty = false;
let previewZoom = 1;
let previewPanX = 0;
let previewPanY = 0;
let previewCameraFrame = 0;
let previewDrag = null;
let previewClosing = false;
let autoSaveTimer = 0;
let saveInFlight = null;
let changeRevision = 0;
let allowNavigation = false;
let pendingDeleteId = null;
let pageMenuState = null;
let cropSession = null;
let entrySnapshot = '';
let savedSnapshot = '';
let saveFailed = false;
const contentSnapshot = (effective = false) => AlbumChangeState.snapshot(album, effective);
const hasSessionChanges = () => contentSnapshot(true) !== entrySnapshot;
const editHistory = StudioHistory.bind($('.top-actions'), {
  disabled: () => Boolean(cropSession || saveInFlight || document.querySelector('dialog[open]') || typeof exportBusy !== 'undefined' && exportBusy),
  error: error => toast(error.message),
  restore: value => {
    album = {...value, updatedAt: album.updatedAt};
    if (!album.pages.some(page => page.id === selectedId)) selectedId = album.pages[0]?.id;
    spread = groupIndexForPage(Math.max(0, selectedIndex()));
    setDirty(); render();
  },
});

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

function pageRatioPair(source = album) {
  let pair = source.ratio === 'custom'
    ? [Number(source.customWidth) || 3, Number(source.customHeight) || 4]
    : [...(ratioPairs[source.ratio] || ratioPairs['4:3'])];
  if (pair[0] !== pair[1]) {
    const short = Math.min(...pair);
    const long = Math.max(...pair);
    pair = source.landscape ? [long, short] : [short, long];
  }
  return pair;
}

// Editor-only preference: never part of the album, exports or customer viewer.
function setPanelTransparency(value, persist = true) {
  StudioEditorChrome.set(value,persist);
}

function initPanelTransparency() {
  StudioEditorChrome.mount({root:$('.workspace'),panels:[$('.settings'),$('.pages')],bars:[$('.stage-head'),$('.pager')],control:$('.panel-transparency')});
}

function setBackgroundBrightness(value, persist = true) {
  const amount=clamp(Number(value)||0,0,200);
  $('.stage').style.setProperty('--editor-background-brightness',String(amount/100));
  $('#backgroundBrightness').value=amount;
  $('#backgroundBrightnessValue').textContent=`${amount}%`;
  $('#backgroundBrightness').setAttribute('aria-valuetext',`${amount}% 背景亮度`);
  $('#backgroundBrightnessReset').disabled=amount===100;
  if(persist){try{localStorage.setItem('book-studio-background-brightness',String(amount));}catch{}}
}

function initBackgroundBrightness() {
  let amount=100;
  try{const saved=localStorage.getItem('book-studio-background-brightness');if(saved!==null&&saved.trim()!==''&&Number.isFinite(Number(saved)))amount=Number(saved);}catch{}
  setBackgroundBrightness(amount,false);
  $('#backgroundBrightness').addEventListener('input',event=>setBackgroundBrightness(event.target.value));
  $('#backgroundBrightnessReset').addEventListener('click',()=>setBackgroundBrightness(100));
}

function pageRatioCss(source = album) {
  const [width, height] = pageRatioPair(source);
  return `${width} / ${height}`;
}

function syncPreviewCamera(animate = false) {
  const wrap = $('.book-wrap');
  if (!wrap) return;
  if (previewZoom <= 1) { previewPanX = 0; previewPanY = 0; }
  wrap.classList.toggle('camera-transition', animate);
  wrap.classList.toggle('camera-draggable', previewZoom > 1);
  wrap.style.setProperty('--preview-zoom', String(previewZoom));
  wrap.style.setProperty('--preview-pan-x', `${previewPanX}px`);
  wrap.style.setProperty('--preview-pan-y', `${previewPanY}px`);
  const percent = Math.round(previewZoom * 100);
  if ($('#previewZoom')) $('#previewZoom').value = percent;
  if ($('#previewZoomValue')) $('#previewZoomValue').textContent = `${percent}%`;
  if ($('#previewZoomOut')) $('#previewZoomOut').disabled = percent <= 50 || previewClosing;
  if ($('#previewZoomIn')) $('#previewZoomIn').disabled = percent >= 200 || previewClosing;
  if ($('#previewZoomFit')) $('#previewZoomFit').disabled = percent === 100 && !previewPanX && !previewPanY;
  if ($('#previewCloseBook')) $('#previewCloseBook').disabled = spread === 0 || previewClosing;
}

function schedulePreviewCamera() {
  if (previewCameraFrame) return;
  previewCameraFrame = requestAnimationFrame(() => { previewCameraFrame = 0; syncPreviewCamera(); });
}

function setPreviewZoom(percent, animate = true) {
  previewZoom = clamp(Math.round(percent / 5) * 5, 50, 200) / 100;
  syncPreviewCamera(animate);
}

function fitPreviewCamera() {
  previewZoom = 1; previewPanX = 0; previewPanY = 0; syncPreviewCamera(true);
}

async function closePreviewBook() {
  if (previewClosing) return;
  const book = $('#book');
  previewClosing = true;
  $('.preview-zoom-rail').classList.add('is-locked');
  book.classList.remove('editor-fade-in');
  book.classList.add('editor-fade-out');
  await new Promise((resolve) => setTimeout(resolve, reducedMotion ? 0 : 220));
  spread = 0;
  selectedId = album.pages[0]?.id;
  fitPreviewCamera();
  render();
  const renderedBook = $('#book');
  renderedBook.classList.add('editor-fade-in');
  await new Promise((resolve) => setTimeout(resolve, reducedMotion ? 0 : 280));
  renderedBook.classList.remove('editor-fade-in');
  previewClosing = false;
  $('.preview-zoom-rail').classList.remove('is-locked');
  syncPreviewCamera();
}

function previewGroups(pages) {
  if (!pages.length) return [];
  const groups = [{ type: 'cover', indices: [0] }];
  const backIndex = pages.length - 1;
  for (let index = 1; index < backIndex; index += 2) {
    groups.push({ type: 'spread', indices: [index, index + 1 < backIndex ? index + 1 : null] });
  }
  if (backIndex > 0) groups.push({ type: 'back', indices: [backIndex] });
  return groups;
}

function groupIndexForPage(pageIndex, pages = album.pages) {
  return Math.max(0, previewGroups(pages).findIndex((group) => group.indices.includes(pageIndex)));
}

async function api(path, options = {}) {
  const response = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...options });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || '操作失败');
  return result;
}

function toast(message) {
  const node = $('#toast'); node.textContent = message; node.classList.add('show');
  clearTimeout(toast.timer); toast.timer = setTimeout(() => node.classList.remove('show'), 1800);
}

function setDirty(value = true) {
  if (value && album) editHistory.record(album);
  dirty = value;
  if (!value) {
    clearTimeout(autoSaveTimer);
    $('#status').textContent = '所有更改已保存';
    return;
  }
  changeRevision += 1;
  if (!saveInFlight && !saveFailed && contentSnapshot() === savedSnapshot) {
    dirty = false;
    clearTimeout(autoSaveTimer);
    $('#status').textContent = '所有更改已保存';
    return;
  }
  $('#status').textContent = '等待自动保存…';
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => save({ automatic: true }), 700);
}

function renderProjectIdentity() {
  if (album?.id) $('#projectCode').textContent = `PROJECT / ${album.id.slice(0, 6).toUpperCase()}`;
}

function render() {
  editHistory.notify();
  closePageMenu();
  delete album.aging;delete album.agingStyle;
  const pages = album.pages;
  const groups = previewGroups(pages);
  spread = Math.max(0, Math.min(spread, groups.length - 1));
  const currentGroup = groups[spread] || { type: 'cover', indices: [] };
  const currentIndices = currentGroup.indices;
  Object.entries(presentationDefaults).forEach(([key, value]) => { if (album[key] === undefined) album[key] = value; });
  Object.entries(BookPresentation.defaults).forEach(([key,value])=>{if(album[key]===undefined)album[key]=value;});
  requestAnimationFrame(()=>document.querySelectorAll('[data-reset-range]').forEach(button=>{button.disabled=Boolean(document.getElementById(button.dataset.resetRange)?.disabled);}));
  selectedId ||= pages[0]?.id;
  $('#title').value = album.title;
  $('#ratio').value = album.ratio;
  $('#customRatio').hidden = album.ratio !== 'custom';
  $('#landscape').checked = Boolean(album.landscape);
  $('#landscape').disabled = album.ratio === '1:1';
  $('#orientationHint').textContent = album.ratio === '1:1' ? '正方形无需切换方向' : album.landscape ? '当前为横版' : '当前为竖版';
  $('#customWidth').value = album.customWidth;
  $('#customHeight').value = album.customHeight;
  $('#margin').value = album.margin;
  $('#marginValue').textContent = `${album.margin}px`;
  $('#shadow').checked = album.shadow;
  $('#material').value = album.material;
  $('#texture').value = album.texture;
  $('#textureValue').textContent = album.material === 'none' ? '关闭' : `${album.texture}%`;
  $('#texture').disabled = album.material === 'none';
  $('#materialScope').value=album.materialScope;
  $('#materialScope').disabled=album.material==='none';
  const reflective=['pearl','holographic','coated','photo'].includes(album.material);
  $('#materialDescription').textContent=reflective?'反光材质：在预览画面内移动鼠标，可查看光泽变化；触屏保持静态反光。':album.material==='none'?'不叠加材质，保持原图。':'纹理叠加于图像表面；建议适度调整，保持文字可读。';
  $('#gloss').value=album.gloss;$('#gloss').disabled=!reflective;$('#glossValue').textContent=reflective?`${album.gloss}%`:'不适用';
  $('#thickness').value = album.thickness;
  $('#thicknessValue').textContent = `${album.thickness} / 5`;
  $('#edgeColor').value = album.edgeColor;
  $('#cornerRadius').value = album.cornerRadius;
  $('#cornerRadiusValue').textContent = `${album.cornerRadius}px`;
  $('#contactShadow').value = album.contactShadow;
  $('#contactShadowValue').textContent = `${album.contactShadow}%`;
  $('#coverFinish').value = album.coverFinish;
  $('#flipSpeed').value = album.flipSpeed;
  $('#flipSpeedValue').textContent = `${album.flipSpeed}ms`;
  $('#shadowOpacity').value = album.shadowOpacity;
  $('#shadowOpacityValue').textContent = `${album.shadowOpacity}%`;
  $('#shadowOpacity').disabled = !album.shadow;
  $('#turnStyle').value = album.turnStyle;
  $('#immersive').checked = album.immersive;
  $('#introMotion').checked = album.introMotion;
  $('#scene').value = album.scene;
  $('#lightIntensity').value = album.lightIntensity;
  $('#lightIntensityValue').textContent = album.lighting === 'none' ? '关闭' : `${album.lightIntensity}%`;
  $('#lightIntensity').disabled = album.lighting === 'none';
  for(const id of ['lightDirection','lightTemperature','shadowSoftness']){
    $('#'+id).value=album[id];$('#'+id+'Value').textContent=`${album[id]}${id==='lightDirection'?'°':id==='lightTemperature'?' K':'%'}`;
    $('#'+id).disabled=album.lighting==='none'&&id!=='shadowSoftness';
  }
  document.querySelectorAll('[data-lighting]').forEach((button) => button.classList.toggle('active', button.dataset.lighting === album.lighting));
  document.querySelectorAll('[data-scene-select]').forEach((button) => button.classList.toggle('active', button.dataset.sceneSelect === album.scene));
  $('#backgroundStatus').textContent = album.scene === 'custom' && album.backgroundImage ? '当前使用已上传的自定义背景' : '当前使用内置背景';
  const ratioLabel = `${album.ratio === 'custom' ? `${album.customWidth}:${album.customHeight}` : album.ratio} · ${album.ratio === '1:1' ? '方形' : album.landscape ? '横版' : '竖版'}`;
  const previewLabel = currentGroup.type === 'cover' ? '封面预览' : currentGroup.type === 'back' ? '封底预览' : '内页跨页';
  $('#summary').textContent = `${previewLabel} · ${ratioLabel} · ${pages.length} 页`;
  $('#pageCount').textContent = `${pages.length} 个页面`;
  document.querySelectorAll('[data-fit]').forEach((button) => button.classList.toggle('active', button.dataset.fit === album.fit));

  const book = $('#book');
  book.classList.toggle('no-shadow', !album.shadow);
  const singlePage = currentGroup.type !== 'spread';
  book.className = `book material-${album.material} ${singlePage ? `single-book ${currentGroup.type}-preview` : 'spread-book'}${album.shadow ? '' : ' no-shadow'}`;
  $('.book-wrap').classList.toggle('single-preview', singlePage);
  $('.book-wrap').classList.toggle('back-preview-wrap', currentGroup.type === 'back');
  book.style.setProperty('--ratio', pageRatioCss(album));
  book.style.setProperty('--margin', `${album.margin}px`);
  book.style.setProperty('--texture-opacity', String(album.material === 'none' ? 0 : album.texture / 300));
  $('.book-wrap').style.setProperty('--paper-edge', `${4 + album.thickness * 2}px`);
  $('.book-wrap').style.setProperty('--edge-color', edgeColors[album.edgeColor] || edgeColors.ivory);
  $('.book-wrap').style.setProperty('--corner-radius', `${album.cornerRadius}px`);
  $('.book-wrap').style.setProperty('--contact-shadow', String(album.contactShadow / 100));
  $('.stage').className = `stage scene-${album.scene} lighting-${album.lighting}`;
  $('.stage').style.setProperty('--light-intensity', String(album.lighting === 'none' ? 0 : album.lightIntensity / 100));
  $('.stage').style.backgroundImage = album.scene === 'custom' && album.backgroundImage ? `linear-gradient(#0005,#0005),url("${album.backgroundImage}")` : '';
  $('#backgroundRemove').disabled = !album.backgroundImage;
  book.innerHTML = currentIndices.map((pageIndex) => pageHtml(pageIndex === null ? null : pages[pageIndex], pageIndex ?? -1)).join('');
  book.querySelectorAll('[data-page-id]').forEach((sheet) => {
    const page = pages.find((p) => p.id === sheet.dataset.pageId);
    const image = sheet.querySelector('img');
    if (image) PageComposition.mount(sheet.querySelector('.image-frame'), image, album, page, cropSession?.id === page.id ? cropSession.draft : undefined);
    sheet.classList.toggle('is-cropping', cropSession?.id === page.id);
    BookPresentation.surface(sheet,Boolean(page.cover));
  });
  book.querySelectorAll('.sheet:not([data-page-id])').forEach(sheet=>BookPresentation.surface(sheet,false));
  BookPresentation.apply($('.stage'),book,album);
  $('#prev').disabled = spread === 0;
  $('#next').disabled = spread >= groups.length - 1;
  const visibleNumbers = currentIndices.filter((index) => index !== null).map((index) => index + 1);
  $('#pagerText').textContent = `${visibleNumbers.join('–')} / ${pages.length}`;
  $('#dots').innerHTML = groups.map((_, index) => `<i class="${index === spread ? 'active' : ''}"></i>`).join('');

  $('#pageList').innerHTML = pages.map((page, index) => {
    const fixedCover = index === 0 || index === pages.length - 1;
    const role = index === 0 ? '硬页 · 封面' : index === pages.length - 1 ? '硬页 · 封底' : '普通内页';
    return `<div class="page-item ${page.id === selectedId ? 'selected' : ''} ${fixedCover ? 'fixed-cover' : ''}" role="group" aria-label="第 ${index+1} 页：${escapeHtml(page.name)}" draggable="${!fixedCover}" data-id="${escapeHtml(page.id)}" data-index="${index}"><button class="page-select" type="button" aria-label="查看第 ${index+1} 页：${escapeHtml(page.name)}"><span class="handle">${fixedCover ? '◆' : '⠿'}</span><span class="thumb" style="background:${page.color || '#d2d0ca'}">${page.src ? `<img src="${page.src}" alt="" draggable="false">` : '▤'}<i>${index + 1}</i></span><span class="meta"><b>${escapeHtml(page.name)}</b><small>${role}</small></span></button><button class="page-more" type="button" draggable="false" aria-label="第 ${index+1} 页操作" aria-haspopup="menu" aria-expanded="false" aria-controls="pageContextMenu">⋯</button></div>`;
  }).join('');
  const index = pages.findIndex((page) => page.id === selectedId);
  $('#up').disabled = index <= 1 || index >= pages.length - 1;
  $('#down').disabled = index < 1 || index >= pages.length - 2;
  $('#delete').disabled = index <= 0 || index >= pages.length - 1 || pages.length <= 2;
  $('#replace').disabled = index < 0;
  ['viewAlbum','openExport','upload','addTop','save','backToProjects'].forEach((id) => { $(`#${id}`).disabled = Boolean(cropSession); });
  ['replace','up','down','delete','prev','next'].forEach((id) => { if (cropSession) $(`#${id}`).disabled = true; });
  $('#editCrop').disabled = Boolean(cropSession) || !pages[index]?.src;
  syncPreviewCamera();
  renderProjectIdentity();
}

function pageHtml(page, index) {
  if (!page) return '<div class="sheet"></div>';
  const coverClass = page.cover ? ` cover-finish-${album.coverFinish}` : '';
  if (page.src) return `<div class="sheet${coverClass}" data-page-id="${escapeHtml(page.id)}"><div class="image-frame"><img src="${page.src}" alt="${escapeHtml(page.name)}"></div></div>`;
  if (page.cover) return `<div class="sheet${coverClass}" data-page-id="${escapeHtml(page.id)}"><div class="placeholder" style="background:${page.color}"><small>PHOTO JOURNAL</small><h3>${escapeHtml(album.title)}</h3><em>${index === 0 ? '2026' : 'THE END'}</em></div></div>`;
  return `<div class="sheet" data-page-id="${escapeHtml(page.id)}"><div class="placeholder" style="background:${page.color}"><small>${String(index).padStart(2, '0')}</small><div class="photo-box">▧</div><em>${escapeHtml(page.name)}</em></div></div>`;
}

function escapeHtml(value = '') { const div = document.createElement('div'); div.textContent = value; return div.innerHTML; }

async function uploadFiles(files, replace = false) {
  if (!files?.length) return;
  $('#status').textContent = '正在保存图片…';
  const snapshot = structuredClone(album);
  const createdSources = [];
  try {
    const uploaded = [];
    for (const file of files) {
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) throw new Error(`${file.name} 格式不支持`);
      if (file.size > 25 * 1024 * 1024) throw new Error(`${file.name} 超过 25MB`);
      const result = await uploadImage(file);
      createdSources.push(result.src);
      uploaded.push({ id: crypto.randomUUID(), name: file.name.replace(/\.[^.]+$/, ''), src: result.src, color: '#d2d0ca' });
    }
    let oldSource = '';
    if (replace) {
      const index = album.pages.findIndex((p) => p.id === selectedId);
      if (index < 0) throw new Error('没有找到要替换的页面');
      const old = album.pages[index];
      oldSource = old.src || '';
      album.pages[index] = { ...uploaded[0], id: old.id, cover: old.cover, ...($('#keepCrop').checked && old.crop ? { crop: structuredClone(old.crop) } : {}) };
    } else {
      const at = Math.max(1, album.pages.length - 1);
      album.pages.splice(at, 0, ...uploaded); selectedId = uploaded[0].id; spread = groupIndexForPage(at);
    }
    setDirty(); render();
    if (!await flushSave()) throw new Error('保存失败，已恢复修改前内容');
    // Retain source images so session undo can restore replaced artwork.
    toast(replace ? '图片已替换并保存' : `已添加并保存 ${uploaded.length} 张照片`);
  } catch (error) {
    album = snapshot;
    editHistory.reconcile(album);
    selectedId = album.pages[0]?.id;
    spread = 0;
    dirty = false;
    render();
    await Promise.allSettled(createdSources.map((source) => api(`/api/images/${source.split('/').pop()}`, { method: 'DELETE' })));
    $('#status').textContent = '操作未完成，原画册已保留';
    toast(error.message);
  }
}

async function uploadBackground(file) {
  if (!file) return;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return toast('背景图仅支持 JPG、PNG 或 WebP');
  $('#status').textContent = '正在保存背景图…';
  const snapshot = structuredClone(album);
  let createdSource = '';
  try {
    if (file.size > 25 * 1024 * 1024) throw new Error('背景图不能超过 25MB');
    const result = await uploadImage(file);
    createdSource = result.src;
    const old = album.backgroundImage; album.backgroundImage = result.src; album.scene = 'custom';
    setDirty(); render();
    if (!await flushSave()) throw new Error('保存失败，已恢复原背景');
    // The previous background remains available to undo.
    toast('背景图已更新并保存');
  } catch (error) {
    album = snapshot; editHistory.reconcile(album); dirty = false; render();
    if (createdSource) await api(`/api/images/${createdSource.split('/').pop()}`, { method: 'DELETE' }).catch(() => {});
    $('#status').textContent = '背景未更改';
    toast(error.message);
  }
}

async function uploadImage(file) {
  const response = await fetch('/api/images', {
    method: 'POST',
    headers: { 'Content-Type': file.type, 'X-File-Name': encodeURIComponent(file.name) },
    body: file,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || '图片上传失败');
  return result;
}
function selectedIndex() { return album.pages.findIndex((page) => page.id === selectedId); }

async function save({ automatic = false, notify = false } = {}) {
  clearTimeout(autoSaveTimer);
  if (saveInFlight) return saveInFlight;
  const payloadSnapshot = contentSnapshot();
  if (!saveFailed && payloadSnapshot === savedSnapshot) {
    dirty = false;
    $('#status').textContent = '所有更改已保存';
    if (notify) toast('画册已保存');
    return true;
  }
  const revision = changeRevision;
  $('#status').textContent = automatic ? '正在自动保存…' : '正在保存…';
  saveInFlight = api(`/api/albums/${encodeURIComponent(album.id)}`, { method: 'PUT', body: JSON.stringify(album) })
    .then((result) => {
      savedSnapshot = payloadSnapshot;
      saveFailed = false;
      if (revision === changeRevision) {
        dirty = false;
        $('#status').textContent = '所有更改已保存';
      } else {
        $('#status').textContent = '等待自动保存…';
        clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(() => save({ automatic: true }), 350);
      }
      album.status = result.album.status;
      album.updatedAt = result.album.updatedAt;
      renderProjectIdentity();
      if (notify) toast('画册已保存');
      return true;
    })
    .catch((error) => {
      saveFailed = true;
      dirty = true;
      $('#status').textContent = '保存失败，请重试';
      toast(error.message);
      return false;
    })
    .finally(() => { saveInFlight = null; editHistory.notify(); });
  return saveInFlight;
}

async function flushSave() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    if (saveInFlight) await saveInFlight;
    if (!dirty && !saveFailed) return true;
    if (!await save()) return false;
  }
  return !dirty && !saveFailed;
}

async function toggleStageFullscreen() {
  const stage = $('.stage');
  try {
    const active = document.fullscreenElement || document.webkitFullscreenElement;
    if (active) {
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (exit) await exit.call(document);
    } else {
      const enter = stage.requestFullscreen || stage.webkitRequestFullscreen;
      if (enter) await enter.call(stage);
    }
  } catch {
    toast('浏览器未能切换全屏');
  }
}

function syncFullscreenButton() {
  const button = $('#fullscreen');
  if (!button) return;
  const active = (document.fullscreenElement || document.webkitFullscreenElement) === $('.stage');
  button.textContent = active ? '×' : '⛶';
  button.setAttribute('aria-label', active ? '退出全屏' : '全屏预览');
  button.title = active ? '退出全屏' : '全屏预览';
  button.setAttribute('aria-pressed', String(active));
}

function returnToProjects() {
  allowNavigation = true;
  window.location.href = '/projects.html';
}

async function init() {
  initPanelTransparency();
  initBackgroundBrightness();
  $('#backToProjects').classList.add('studio-back');$('#backToProjects').textContent='← 返回画册项目';$('#backToProjects').setAttribute('aria-label','返回画册项目');
  $('#backToProjects').onclick = returnToProjects; // Also works if loading the album fails; replaced with the save-aware handler after load.
  const exportReturn=StudioNavigation.modalBack($('#exportDialog'),{label:'返回画册编辑'});exportReturn.onclick=()=>$('#closeExport').click();
  const requestedId = new URLSearchParams(location.search).get('id');
  const source = requestedId ? `/api/albums/${encodeURIComponent(requestedId)}` : '/api/album';
  let recoveredMissingAlbum = false;
  try {
    album = await api(source);
  } catch (error) {
    if (!requestedId) throw error;
    album = await api('/api/album');
    recoveredMissingAlbum = true;
    const nextUrl = new URL(location.href);
    nextUrl.searchParams.set('id', album.id);
    history.replaceState({}, '', nextUrl);
  }
  selectedId = album.pages[0]?.id; spread = 0; render();
  entrySnapshot = contentSnapshot(true);
  savedSnapshot = contentSnapshot();
  editHistory.reset(album);
  if (recoveredMissingAlbum) toast('原画册不存在，已打开当前有效画册');
  $('#title').addEventListener('input', (e) => { album.title = e.target.value; setDirty(); render(); });
  $('#ratio').addEventListener('change', (e) => { album.ratio = e.target.value; setDirty(); render(); });
  $('#landscape').addEventListener('change', (e) => { album.landscape = e.target.checked; setDirty(); render(); });
  ['customWidth', 'customHeight'].forEach((id) => $(`#${id}`).addEventListener('input', (e) => { album[id] = Math.max(1, Math.min(100, Number(e.target.value) || 1)); setDirty(); render(); }));
  $('#margin').addEventListener('input', (e) => { album.margin = Number(e.target.value); setDirty(); render(); });
  $('#shadow').addEventListener('change', (e) => { album.shadow = e.target.checked; setDirty(); render(); });
  $('#material').addEventListener('change', (e) => { album.material = e.target.value; if (album.material !== 'none' && !album.texture) album.texture = 8; setDirty(); render(); });
  document.querySelectorAll('[data-reset-range]').forEach(button=>button.addEventListener('click',()=>{
    const key=button.dataset.resetRange;
    const rangeDefaults={margin:0,...presentationDefaults,...BookPresentation.defaults,texture:album.material==='none'?0:8};
    if(album[key]!==rangeDefaults[key]){album[key]=rangeDefaults[key];setDirty();render();}
  }));
  $('#texture').addEventListener('input', (e) => { album.texture = Number(e.target.value); setDirty(); render(); });
  $('#materialScope').addEventListener('change',e=>{album.materialScope=e.target.value;setDirty();render();});
  for(const id of ['gloss','lightDirection','lightTemperature','shadowSoftness'])$('#'+id).addEventListener('input',e=>{album[id]=Number(e.target.value);setDirty();render();});
  $('#thickness').addEventListener('input', (e) => { album.thickness = Number(e.target.value); setDirty(); render(); });
  $('#edgeColor').addEventListener('change', (e) => { album.edgeColor = e.target.value; setDirty(); render(); });
  $('#cornerRadius').addEventListener('input', (e) => { album.cornerRadius = Number(e.target.value); setDirty(); render(); });
  $('#contactShadow').addEventListener('input', (e) => { album.contactShadow = Number(e.target.value); setDirty(); render(); });
  $('#coverFinish').addEventListener('change', (e) => { album.coverFinish = e.target.value; setDirty(); render(); });
  $('#flipSpeed').addEventListener('input', (e) => { album.flipSpeed = Number(e.target.value); setDirty(); render(); });
  $('#shadowOpacity').addEventListener('input', (e) => { album.shadowOpacity = Number(e.target.value); setDirty(); render(); });
  $('#turnStyle').addEventListener('change', (e) => { album.turnStyle = e.target.value; setDirty(); render(); });
  $('#immersive').addEventListener('change', (e) => { album.immersive = e.target.checked; setDirty(); render(); });
  $('#introMotion').addEventListener('change', (e) => { album.introMotion = e.target.checked; setDirty(); render(); });
  $('#scene').addEventListener('change', (e) => { album.scene = e.target.value; setDirty(); render(); });
  document.querySelectorAll('[data-lighting]').forEach((button) => button.addEventListener('click', () => { album.lighting = button.dataset.lighting; setDirty(); render(); }));
  $('#lightIntensity').addEventListener('input', (e) => { album.lightIntensity = Number(e.target.value); setDirty(); render(); });
  document.querySelectorAll('[data-scene-select]').forEach((button) => button.addEventListener('click', () => { album.scene = button.dataset.sceneSelect; setDirty(); render(); }));
  $('#backgroundUpload').onclick = () => $('#backgroundInput').click();
  $('#backgroundInput').onchange = (e) => { uploadBackground(e.target.files?.[0]).finally(() => { e.target.value = ''; }); };
  $('#backgroundRemove').onclick = async () => {
    const snapshot = structuredClone(album);
    const old = album.backgroundImage;
    album.backgroundImage = '';
    album.scene = 'charcoal';
    setDirty(); render();
    if (!await flushSave()) {
      album = snapshot; dirty = false; render(); toast('背景移除失败，原背景已保留'); return;
    }
    // Keep the original background for undo.
    toast('背景图已移除并保存');
  };
  document.querySelectorAll('[data-fit]').forEach((button) => button.addEventListener('click', () => { album.fit = button.dataset.fit; setDirty(); render(); }));
  document.querySelectorAll('[data-settings-tab]').forEach((button) => button.addEventListener('click', () => selectSettingsTab(button.dataset.settingsTab)));
  document.querySelectorAll('[data-reset-settings]').forEach((button) => button.addEventListener('click', () => {
    Object.assign(album, settingsDefaults[button.dataset.resetSettings]);
    setDirty(); render(); toast('已恢复默认设置');
  }));
  $('#prev').onclick = () => { if (previewClosing) return; spread = Math.max(0, spread - 1); selectedId = album.pages[previewGroups(album.pages)[spread]?.indices[0]]?.id; render(); };
  $('#next').onclick = () => { if (previewClosing) return; spread = Math.min(previewGroups(album.pages).length - 1, spread + 1); selectedId = album.pages[previewGroups(album.pages)[spread]?.indices[0]]?.id; render(); };
  $('#save').onclick = () => save({ notify: true });
  $('#viewAlbum').onclick = async () => {
    if (!await flushSave()) return;
    if (window.DevicePreview?.available()) window.DevicePreview.open(album.id);
    else window.location.href = `/album/?id=${encodeURIComponent(album.id)}`;
  };
  document.querySelectorAll('a[href="/projects.html"]').forEach(link => link.addEventListener('click', event => { event.preventDefault(); $('#backToProjects').click(); }));
  $('#backToProjects').onclick = async () => {
    const button = $('#backToProjects');
    if (button.disabled) return;
    if (!hasSessionChanges()) {
      // A reverted edit may still have a pending/in-flight autosave. Settle it
      // silently so the restored state, not an intermediate effect, is kept.
      button.disabled = true;
      const saved = await flushSave();
      button.disabled = false;
      if (saved && !hasSessionChanges()) { returnToProjects(); return; }
    }
    $('#leaveMessage').textContent = saveFailed ? '保存失败，返回前请重试保存，避免丢失当前内容。' : dirty ? '当前有尚未保存的修改，返回前是否保存？' : '当前画册与进入时相比已有修改，修改已自动保存。是否确认后返回？';
    $('#leaveDialog').showModal();
  };
  $('#leaveCancel').onclick = () => $('#leaveDialog').close();
  $('#leaveClose').onclick = () => $('#leaveDialog').close();
  $('#leaveDiscard').onclick = returnToProjects;
  $('#leaveSave').onclick = async () => {
    const button = $('#leaveSave');
    button.disabled = true;
    button.textContent = '正在保存…';
    if (await flushSave()) returnToProjects();
    button.disabled = false;
    button.textContent = '保存并返回';
  };
  $('#upload').onclick = $('#addTop').onclick = () => $('#addInput').click();
  $('#replace').onclick = () => $('#replaceInput').click();
  $('#addInput').onchange = (e) => { uploadFiles(e.target.files).finally(() => { e.target.value = ''; }); };
  $('#replaceInput').onchange = (e) => { uploadFiles(e.target.files, true).finally(() => { e.target.value = ''; }); };
  $('#pageList').onclick = (e) => {
    if (cropSession) return toast('请先应用或取消当前构图');
    const item = e.target.closest('.page-item'); if (!item) return;
    const more=e.target.closest('.page-more');
    if(more){e.stopPropagation();openPageMenu(item.dataset.id,more);return;}
    selectedId = item.dataset.id; spread = groupIndexForPage(Number(item.dataset.index)); render();
  };
  enablePageMenu();
  enablePageDragging();
  $('#up').onclick = () => move(-1); $('#down').onclick = () => move(1);
  $('#delete').onclick = requestDeleteSelected;
  $('#deletePageCancel').onclick = () => { pendingDeleteId = null; $('#deletePageDialog').close(); };
  $('#deletePageClose').onclick = () => { pendingDeleteId = null; $('#deletePageDialog').close(); };
  $('#deletePageConfirm').onclick = confirmDeleteSelected;
  $('#fullscreen').onclick = toggleStageFullscreen;
  if (!($('.stage').requestFullscreen || $('.stage').webkitRequestFullscreen)) $('#fullscreen').hidden = true;
  document.addEventListener('fullscreenchange', syncFullscreenButton);
  document.addEventListener('webkitfullscreenchange', syncFullscreenButton);
  syncFullscreenButton();
  $('#previewZoom').addEventListener('input', (event) => setPreviewZoom(Number(event.target.value), false));
  $('#previewZoomIn').onclick = () => setPreviewZoom(previewZoom * 100 + 10);
  $('#previewZoomOut').onclick = () => setPreviewZoom(previewZoom * 100 - 10);
  $('#previewZoomFit').onclick = fitPreviewCamera;
  $('#previewCloseBook').onclick = closePreviewBook;
  $('.book-stage').addEventListener('wheel', (event) => {
    if (!event.ctrlKey || previewClosing || cropSession) return;
    event.preventDefault();
    setPreviewZoom(previewZoom * 100 + (event.deltaY < 0 ? 10 : -10), false);
  }, { passive: false });
  $('.book-wrap').addEventListener('pointerdown', (event) => {
    if (cropSession || previewZoom <= 1 || previewClosing || (event.button !== undefined && event.button !== 0)) return;
    previewDrag = { id: event.pointerId, x: event.clientX, y: event.clientY, panX: previewPanX, panY: previewPanY };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.currentTarget.classList.add('camera-dragging');
    event.preventDefault();
  });
  $('.book-wrap').addEventListener('pointermove', (event) => {
    if (!previewDrag || previewDrag.id !== event.pointerId) return;
    const stage = $('.book-stage').getBoundingClientRect();
    const limitX = stage.width * (previewZoom - 1) * .46;
    const limitY = stage.height * (previewZoom - 1) * .46;
    previewPanX = clamp(previewDrag.panX + event.clientX - previewDrag.x, -limitX, limitX);
    previewPanY = clamp(previewDrag.panY + event.clientY - previewDrag.y, -limitY, limitY);
    schedulePreviewCamera();
  });
  const endPreviewDrag = (event) => {
    if (!previewDrag || previewDrag.id !== event.pointerId) return;
    previewDrag = null;
    event.currentTarget.classList.remove('camera-dragging');
  };
  $('.book-wrap').addEventListener('pointerup', endPreviewDrag);
  $('.book-wrap').addEventListener('pointercancel', endPreviewDrag);
  window.addEventListener('keydown', (event) => {
    if (cropSession || document.querySelector('dialog[open]') || previewClosing || event.target.matches('input,select,button')) return;
    if (event.key === 'ArrowLeft') { spread = Math.max(0, spread - 1); selectedId = album.pages[previewGroups(album.pages)[spread]?.indices[0]]?.id; render(); }
    if (event.key === 'ArrowRight') { spread = Math.min(previewGroups(album.pages).length - 1, spread + 1); selectedId = album.pages[previewGroups(album.pages)[spread]?.indices[0]]?.id; render(); }
  });
  window.addEventListener('beforeunload', (e) => { if (dirty && !allowNavigation) { e.preventDefault(); e.returnValue = ''; } });
  registerAgentTools();
}

function registerAgentTools() {
  const context = document.modelContext;
  if (!context?.registerTool) return;
  context.registerTool({
    name: 'read_album_summary',
    title: '读取画册信息',
    description: '读取当前画册的名称、尺寸比例、页数和页面顺序。',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, untrustedContentHint: false },
    execute() { return { title: album.title, ratio: album.ratio, pageCount: album.pages.length, pages: album.pages.map((page) => page.name) }; },
  });
  context.registerTool({
    name: 'save_album_settings',
    title: '保存画册设置',
    description: '修改并保存当前画册的名称、尺寸比例、图片适配方式、页边距或阴影设置。',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', minLength: 1, maxLength: 120 },
      ratio: { type: 'string', enum: ['16:9', '4:3', '16:10', '2:3', '1:1', '2:1', '1.618:1', 'custom'] }, landscape: { type: 'boolean' }, customWidth: { type: 'number', minimum: 0.1, maximum: 100 }, customHeight: { type: 'number', minimum: 0.1, maximum: 100 },
        fit: { type: 'string', enum: ['cover', 'contain'] },
        margin: { type: 'integer', minimum: 0, maximum: 60 },
        shadow: { type: 'boolean' }, material: { type: 'string', enum: Object.keys(BookPresentation.materials) },
        materialScope:{type:'string',enum:['all','cover','pages']}, gloss:{type:'integer',minimum:0,maximum:100},
        lightDirection:{type:'integer',minimum:-90,maximum:90}, lightTemperature:{type:'integer',minimum:2700,maximum:7500}, shadowSoftness:{type:'integer',minimum:0,maximum:100},
        texture: { type: 'integer', minimum: 0, maximum: 24 }, thickness: { type: 'integer', minimum: 1, maximum: 5 },
        coverFinish: { type: 'string', enum: ['none', 'matte', 'linen', 'soft-touch'] },
        edgeColor: { type: 'string', enum: ['ivory', 'white', 'gray', 'black', 'kraft'] }, cornerRadius: { type: 'integer', minimum: 0, maximum: 8 }, contactShadow: { type: 'integer', minimum: 0, maximum: 70 },
        flipSpeed: { type: 'integer', minimum: 450, maximum: 1200 }, shadowOpacity: { type: 'integer', minimum: 10, maximum: 60 },
        turnStyle: { type: 'string', enum: ['natural', 'soft', 'crisp'] }, immersive: { type: 'boolean' }, introMotion: { type: 'boolean' },
        lighting: { type: 'string', enum: Object.keys(BookPresentation.lights) }, lightIntensity: { type: 'integer', minimum: 0, maximum: 100 },
        scene: { type: 'string', enum: Object.keys(BookPresentation.scenes) }, backgroundImage: { type: 'string' },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    async execute(input) {
      if (!input || typeof input !== 'object') throw new Error('请提供要修改的画册设置');
      if (input.title !== undefined && (!input.title.trim() || input.title.length > 120)) throw new Error('画册名称需要为 1–120 个字符');
      if (input.ratio !== undefined && ![...Object.keys(ratioPairs), 'custom'].includes(input.ratio)) throw new Error('不支持这个页面比例');
      if (input.fit !== undefined && !['cover', 'contain'].includes(input.fit)) throw new Error('图片适配只能是 cover 或 contain');
      if (input.margin !== undefined && (!Number.isInteger(input.margin) || input.margin < 0 || input.margin > 60)) throw new Error('页边距需要是 0–60 的整数');
      Object.assign(album, input); render(); await save();
      return { ok: true, title: album.title, ratio: album.ratio, pageCount: album.pages.length };
    },
  });
}

function selectSettingsTab(name) {
  document.querySelectorAll('[data-settings-tab]').forEach((button) => {
    const active = button.dataset.settingsTab === name;
    button.classList.toggle('active', active); button.setAttribute('aria-selected', String(active));
  });
  document.querySelectorAll('[data-settings-panel]').forEach((panel) => {
    const active = panel.dataset.settingsPanel === name;
    panel.hidden = !active; panel.classList.toggle('active', active);
  });
}

function enablePageDragging() {
  let draggedId = null;
  $('#pageList').addEventListener('dragstart', (event) => {
    closePageMenu();
    if(event.target.closest('.page-more')){event.preventDefault();return;}
    if (cropSession) { event.preventDefault(); return; }
    const item = event.target.closest('.page-item'); if (!item) return;
    const index = Number(item.dataset.index); if (index === 0 || index === album.pages.length - 1) { event.preventDefault(); return; }
    draggedId = item.dataset.id; item.classList.add('dragging'); event.dataTransfer.effectAllowed = 'move';
  });
  $('#pageList').addEventListener('dragend', () => { draggedId = null; document.querySelectorAll('.page-item').forEach((item) => item.classList.remove('dragging', 'drag-over')); });
  $('#pageList').addEventListener('dragover', (event) => { const item = event.target.closest('.page-item'); if (!item || item.dataset.id === draggedId) return; event.preventDefault(); document.querySelectorAll('.page-item').forEach((node) => node.classList.toggle('drag-over', node === item)); });
  $('#pageList').addEventListener('drop', (event) => {
    const target = event.target.closest('.page-item'); if (!target || !draggedId || target.dataset.id === draggedId) return;
    event.preventDefault(); const from = album.pages.findIndex((page) => page.id === draggedId); const to = album.pages.findIndex((page) => page.id === target.dataset.id);
    if (from <= 0 || from >= album.pages.length - 1 || to <= 0 || to >= album.pages.length - 1) return;
    const [page] = album.pages.splice(from, 1); album.pages.splice(to, 0, page); selectedId = page.id; spread = groupIndexForPage(to); setDirty(); render();
  });
}

function closePageMenu(restoreFocus=false) {
  const state=pageMenuState;
  pageMenuState=null;
  const menu=$('#pageContextMenu');if(menu)menu.hidden=true;
  if(state?.trigger?.isConnected){state.trigger.setAttribute('aria-expanded','false');if(restoreFocus)state.trigger.focus({preventScroll:true});}
}

function openPageMenu(id,trigger) {
  if(pageMenuState?.id===id){closePageMenu(true);return;}
  closePageMenu();
  const index=album.pages.findIndex(page=>page.id===id);if(index<0||cropSession)return;
  const page=album.pages[index],last=album.pages.length-1,cover=index===0||index===last;
  const menu=$('#pageContextMenu');
  $('#pageMenuTitle').textContent=`第 ${index+1} 页 · ${page.name}`;
  $('#pageMenuHint').hidden=!cover;
  const disabled={crop:!page.src,replace:false,copy:false,up:index<=1||index>=last,down:index<1||index>=last-1,delete:cover||album.pages.length<=2};
  menu.querySelectorAll('[data-page-action]').forEach(button=>{button.disabled=disabled[button.dataset.pageAction];});
  pageMenuState={id,trigger};trigger.setAttribute('aria-expanded','true');menu.hidden=false;
  positionPageMenu();
  menu.querySelector('button:not(:disabled)')?.focus({preventScroll:true});
}

function positionPageMenu() {
  if(!pageMenuState)return;
  const {trigger}=pageMenuState,menu=$('#pageContextMenu');
  const rect=trigger.getBoundingClientRect(),box=menu.getBoundingClientRect();
  if(!trigger.isConnected||rect.bottom<0||rect.top>innerHeight){closePageMenu();return;}
  const left=clamp(rect.right-box.width,12,Math.max(12,innerWidth-box.width-12));
  let top=rect.bottom+6;if(top+box.height>innerHeight-12)top=rect.top-box.height-6;
  menu.style.left=`${left}px`;menu.style.top=`${clamp(top,12,Math.max(12,innerHeight-box.height-12))}px`;
}

function duplicateSelectedPage() {
  const index=selectedIndex();if(index<0||cropSession)return;
  const duplicate=structuredClone(album.pages[index]);
  duplicate.id=crypto.randomUUID();duplicate.cover=false;
  duplicate.name=`${(duplicate.name||'页面').slice(0,155)} · 副本`;
  const at=Math.min(index+1,album.pages.length-1);
  album.pages.splice(at,0,duplicate);selectedId=duplicate.id;spread=groupIndexForPage(at);
  setDirty();render();
  $('#pageList').querySelector(`[data-id="${CSS.escape(duplicate.id)}"] .page-select`)?.focus({preventScroll:true});
  toast('已复制为普通内页，构图保持不变');
}

function enablePageMenu() {
  const menu=$('#pageContextMenu');
  menu.addEventListener('click',event=>{
    const button=event.target.closest('[data-page-action]');if(!button||button.disabled||!pageMenuState)return;
    const id=pageMenuState.id,action=button.dataset.pageAction;closePageMenu();
    const index=album.pages.findIndex(page=>page.id===id);if(index<0||cropSession)return;
    selectedId=id;spread=groupIndexForPage(index);render();
    if(action==='crop')$('#editCrop').click();
    if(action==='replace')$('#replaceInput').click();
    if(action==='copy')duplicateSelectedPage();
    if(action==='up'||action==='down')move(action==='up'?-1:1);
    if(action==='delete')requestDeleteSelected();
  });
  document.addEventListener('pointerdown',event=>{
    if(pageMenuState&&!menu.contains(event.target)&&!event.target.closest('.page-more'))closePageMenu();
  });
  document.addEventListener('focusin',event=>{
    if(pageMenuState&&!menu.contains(event.target)&&!event.target.closest('.page-more'))closePageMenu();
  });
  document.addEventListener('keydown',event=>{
    if(!pageMenuState)return;
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closePageMenu(true);return;}
    if(!menu.contains(event.target)||!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
    event.preventDefault();event.stopPropagation();
    const items=[...menu.querySelectorAll('button:not(:disabled)')],index=items.indexOf(document.activeElement);
    const next=event.key==='Home'?0:event.key==='End'?items.length-1:(index+(event.key==='ArrowDown'?1:-1)+items.length)%items.length;
    items[next]?.focus({preventScroll:true});
  },true);
  window.addEventListener('resize',()=>closePageMenu());
  window.addEventListener('scroll',event=>{if(!(event.target instanceof Node)||!menu.contains(event.target))positionPageMenu();},true);
}

function move(direction) {
  const index = selectedIndex(), target = index + direction;
  if (index <= 0 || index >= album.pages.length - 1 || target <= 0 || target >= album.pages.length - 1) return;
  [album.pages[index], album.pages[target]] = [album.pages[target], album.pages[index]];
  spread = groupIndexForPage(target); setDirty(); render();
}

function requestDeleteSelected() {
  const index = selectedIndex();
  if (index <= 0 || index >= album.pages.length - 1 || album.pages.length <= 2) return;
  pendingDeleteId = selectedId;
  const page = album.pages[index];
  $('#deletePageMessage').textContent = `“${page.name}”会从画册中移除，本次编辑期间可以撤销恢复。`;
  $('#deletePageDialog').showModal();
}

async function confirmDeleteSelected() {
  const index = album.pages.findIndex((page) => page.id === pendingDeleteId);
  if (index <= 0 || index >= album.pages.length - 1 || album.pages.length <= 2) return;
  const button = $('#deletePageConfirm');
  const snapshot = structuredClone(album);
  const page = album.pages[index];
  button.disabled = true; button.textContent = '正在删除…';
  album.pages.splice(index, 1);
  const nextIndex = Math.max(1, index - 1);
  selectedId = album.pages[nextIndex]?.id || album.pages[0]?.id;
  spread = groupIndexForPage(nextIndex);
  setDirty(); render();
  if (await flushSave()) {
    // Original image stays local for undo; exports include current pages only.
    $('#deletePageDialog').close();
    pendingDeleteId = null;
    toast('页面已删除并保存');
  } else {
    album = snapshot; editHistory.reconcile(album); dirty = false; selectedId = page.id; spread = groupIndexForPage(index); render();
    toast('删除失败，页面已恢复');
  }
  button.disabled = false; button.textContent = '确认删除';
}

init().catch((error) => { $('#status').textContent = '载入失败'; toast(error.message); });
