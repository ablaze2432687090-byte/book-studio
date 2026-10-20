let cropDrag = null;
let exportBusy = false;
let exportObjectUrl = '';

function updateCropPreview() {
  if (!cropSession) return;
  const page = album.pages.find((p) => p.id === cropSession.id);
  const sheet = [...document.querySelectorAll('#book .sheet')].find((s) => s.dataset.pageId === page.id);
  const image = sheet?.querySelector('img');
  if (image) PageComposition.mount(sheet.querySelector('.image-frame'), image, album, page, cropSession.draft);
  $('#cropZoom').min = cropSession.draft.fit === 'cover' ? 100 : 25;
  $('#cropZoom').value = Math.round(cropSession.draft.zoom * 100);
  $('#cropZoomValue').textContent = `${Math.round(cropSession.draft.zoom * 100)}%`;
  $('#cropContain').classList.toggle('active', cropSession.draft.fit === 'contain');
  $('#cropCover').classList.toggle('active', cropSession.draft.fit === 'cover');
  $('#cropUndo').disabled = !cropSession.history.length;
}

function rememberCrop() {
  if (!cropSession) return;
  const value = structuredClone(cropSession.draft);
  if (JSON.stringify(cropSession.history.at(-1)) !== JSON.stringify(value)) cropSession.history.push(value);
  if (cropSession.history.length > 40) cropSession.history.shift();
}

function changeCrop(values) {
  if (!cropSession) return;
  rememberCrop();
  cropSession.draft = PageComposition.normalize({ ...cropSession.draft, ...values }, album.fit);
  updateCropPreview();
}

function finishCrop() {
  cropSession = null; cropDrag = null;
  $('#cropPanel').hidden = true;
  $('.settings').inert = false;
  $('#title').readOnly = false;
  $('.page-list').inert = false;
  $('.preview-zoom-rail').inert = false;
  document.body.classList.remove('editing-composition');
  render();
  $('#editCrop').focus();
}

$('#editCrop').onclick = () => {
  const page = album.pages[selectedIndex()];
  if (!page?.src || cropSession) return;
  clearTimeout(toast.timer);
  $('#toast').classList.remove('show');
  cropSession = { id: page.id, draft: PageComposition.normalize(page.crop, album.fit), history: [] };
  spread = groupIndexForPage(selectedIndex());
  fitPreviewCamera(); render();
  $('#cropPanel').hidden = false;
  $('#cropPageName').textContent = page.name;
  $('#cropMessage').textContent = '构图尚未应用，取消可返回原来的画面。';
  $('.settings').inert = true;
  $('#title').readOnly = true;
  $('.page-list').inert = true;
  $('.preview-zoom-rail').inert = true;
  document.body.classList.add('editing-composition');
  const [cropWidth,cropHeight] = PageComposition.ratio(album);
  document.documentElement.style.setProperty('--crop-ratio',String(cropWidth/cropHeight));
  updateCropPreview();
  if (matchMedia('(max-width: 980px)').matches) window.scrollTo({top:0,behavior:'instant'});
  $('#cropZoom').focus({ preventScroll: true });
};
$('#cropContain').onclick = () => changeCrop({ fit: 'contain', zoom: 1, x: 0, y: 0 });
$('#cropCover').onclick = () => changeCrop({ fit: 'cover', zoom: 1, x: 0, y: 0 });
$('#cropCenter').onclick = () => changeCrop({ x: 0, y: 0 });
$('#cropReset').onclick = () => changeCrop({ fit: album.fit, zoom: 1, x: 0, y: 0 });
$('#cropUndo').onclick = () => { if (cropSession?.history.length) { cropSession.draft = cropSession.history.pop(); updateCropPreview(); } };
$('#cropZoom').addEventListener('pointerdown', rememberCrop);
$('#cropZoom').addEventListener('keydown', rememberCrop);
$('#cropZoom').oninput = (event) => {
  if (!cropSession) return;
  cropSession.draft.zoom = Number(event.target.value) / 100;
  updateCropPreview();
};
$('#cropCancel').onclick = finishCrop;
$('#cropApply').onclick = async () => {
  if (!cropSession) return;
  const page = album.pages.find((p) => p.id === cropSession.id);
  const previous = page.crop ? structuredClone(page.crop) : undefined;
  page.crop = structuredClone(cropSession.draft);
  $('#cropApply').disabled = true;
  $('#cropCancel').disabled = true;
  $('#cropMessage').textContent = '正在保存构图…';
  setDirty();
  if (await flushSave()) { finishCrop(); toast('本页构图已保存，预览和导出同步生效'); }
  else {
    if (previous) page.crop = previous; else delete page.crop;
    setDirty();
    $('#cropMessage').textContent = '保存未完成，构图保留在编辑区，请重试。';
  }
  $('#cropApply').disabled = false;
  $('#cropCancel').disabled = false;
};

$('#book').addEventListener('pointerdown', (event) => {
  if (!cropSession || event.button !== 0 || $('#cropApply').disabled) return;
  const sheet = event.target.closest('.is-cropping');
  const image = sheet?.querySelector('img');
  if (!image?.naturalWidth) return;
  const rect = sheet.querySelector('.image-frame').getBoundingClientRect();
  const g = PageComposition.geometry(image.naturalWidth,image.naturalHeight,rect.width,rect.height,cropSession.draft,album.fit);
  rememberCrop();
  cropDrag = { pointer: event.pointerId, startX: event.clientX, startY: event.clientY, x: cropSession.draft.x, y: cropSession.draft.y, spanX: Math.abs(rect.width-g.width)/2, spanY: Math.abs(rect.height-g.height)/2 };
  $('#book').setPointerCapture(event.pointerId);
  event.preventDefault(); event.stopPropagation();
}, { capture: true });
$('#book').addEventListener('pointermove', (event) => {
  if (!cropDrag || !cropSession || event.pointerId !== cropDrag.pointer) return;
  cropSession.draft.x = cropDrag.spanX > .5 ? clamp(cropDrag.x+(event.clientX-cropDrag.startX)/cropDrag.spanX,-1,1) : 0;
  cropSession.draft.y = cropDrag.spanY > .5 ? clamp(cropDrag.y+(event.clientY-cropDrag.startY)/cropDrag.spanY,-1,1) : 0;
  updateCropPreview();
});
['pointerup','pointercancel','lostpointercapture'].forEach((name) => $('#book').addEventListener(name, () => { cropDrag = null; }));
$('#book').addEventListener('wheel', (event) => {
  if (!cropSession || !event.target.closest('.is-cropping')) return;
  event.preventDefault(); event.stopPropagation();
  changeCrop({ zoom: cropSession.draft.zoom + (event.deltaY < 0 ? .05 : -.05) });
}, { passive: false, capture: true });
window.addEventListener('keydown', (event) => {
  if (cropSession && event.key === 'Escape' && !$('#cropApply').disabled) { finishCrop(); event.stopImmediatePropagation(); }
}, { capture: true });
window.addEventListener('beforeunload', (event) => { if (cropSession) { event.preventDefault(); event.returnValue = ''; } });

function exportOptions() {
  const pdf = $('#exportFormat').value === 'pdf';
  $('#pdfOptions').hidden = !pdf;
  $('#exportNote').textContent = pdf ? 'PDF 保留图片、裁剪和边距；翻页、灯光与动态阴影仅在互动版中呈现。' : '完整展示包包含：使用指南、互动入口和轻量阅读 PDF。完整解压后打开「02_打开画册.html」，无需后台。手机与微信建议使用阅读 PDF；修改画册后需重新导出。';
}
$('#openExport').onclick = () => { if (cropSession) return; $('#exportDialog').showModal(); exportOptions(); };
$('#closeExport').onclick = () => { if (!exportBusy) $('#exportDialog').close(); };
$('#exportDialog').addEventListener('cancel', (event) => { if (exportBusy) event.preventDefault(); });
$('#exportFormat').onchange = exportOptions;
$('#exportStart').onclick = async () => {
  if (exportBusy) return;
  exportBusy = true;
  $('#exportDownload').hidden = true;
  $('#exportProgress').hidden = false;
  $('#exportMessage').textContent = '正在保存当前修改…';
  ['exportStart','closeExport','exportFormat','exportLayout','exportQuality'].forEach((id) => $(`#${id}`).disabled = true);
  try {
    if (!await flushSave()) throw new Error('画册保存失败，请先重试保存。');
    const params = new URLSearchParams({ format: $('#exportFormat').value, layout: $('#exportLayout').value, quality: $('#exportQuality').value });
    $('#exportMessage').textContent = $('#exportFormat').value==='pdf'?'正在生成阅读 PDF…':'正在整理图片、生成阅读 PDF 并打包，大画册可能需要稍等…';
    const response = await fetch(`/api/albums/${encodeURIComponent(album.id)}/export?${params}`);
    if (!response.ok) { const result = await response.json(); throw new Error(result.error || '导出失败'); }
    const blob = await response.blob();
    if (exportObjectUrl) URL.revokeObjectURL(exportObjectUrl);
    exportObjectUrl = URL.createObjectURL(blob);
    const link = $('#exportDownload'); link.href = exportObjectUrl;
    link.download = `${album.title.replace(/[\\/:*?"<>|]/g,'_')}-${$('#exportFormat').value === 'pdf' ? $('#exportLayout').value+'.pdf' : (globalThis.StudioI18n?.language==='en'?'Presentation-Package.zip':'展示交付包.zip')}`;
    link.hidden = false; link.click();
    $('#exportMessage').textContent = `文件已生成 · ${(blob.size/1024/1024).toFixed(1)} MB。` + (window.BookStudioDesktop ? '请在系统对话框中选择保存位置。' : '文件保存至浏览器的下载位置。');
  } catch (error) { $('#exportMessage').textContent = error.message; }
  finally {
    exportBusy = false; $('#exportProgress').hidden = true;
    ['exportStart','closeExport','exportFormat','exportLayout','exportQuality'].forEach((id) => $(`#${id}`).disabled = false);
  }
};
