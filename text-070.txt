/* Optional AI studio. No secrets are stored in browser storage. */
(() => {
  let mode = 'normal', settings = null, references = [], uploading = false, activeJob = null, timer = null;
  let selected = new Set(), busy = false, jobs = [];
  let automaticPrompt = false, promptBrief = '';
  const terminal = new Set(['complete', 'failed', 'cancelled', 'interrupted']);
  const labels = {queued:'等待生成', running:'正在生成', ready:'已生成', complete:'已完成', failed:'已暂停：出现错误', cancelled:'已停止', cancelling:'正在停止后续请求', interrupted:'后台曾中断，请手动继续'};
  const values = ['width','height','count','theme','style','palette','background','type','language','copy','preserve','avoid','notes','output','layout','treatment'];
  const request = (url, body, method = 'POST') => api(url, {method, body:JSON.stringify(body)});
  const message = (id, text) => { $(id).textContent = text; $(id).hidden = !text; };
  const guard = (fn, id) => async () => {
    try { await fn(); } catch (error) { toast(error.message); if (id) message(id, error.message); }
  };
  function getBrief() {
    const result = {title:$('#newTitle').value.trim() || '未命名画册',uiLanguage:globalThis.StudioI18n?.language||'zh-CN'};
    for (const name of values) {
      const value = ['width','height','count','layout','treatment'].includes(name)
        ? $('#brief' + name[0].toUpperCase() + name.slice(1)).value : window.AlbumBrief.resolve(name);
      result[name] = ['width','height','count'].includes(name) ? Number(value) : value;
    }
    if (mode === 'api') result.layout = 'single';
    return result;
  }
  async function generatePrompt() {
    if (!$('#createForm').reportValidity()) throw new Error('请检查自定义内容、图片尺寸与画册名称');
    const result = await request('/api/ai/prompt', {brief:getBrief()});
    $('#aiPrompt').value = result.prompt;
    automaticPrompt = true; promptBrief = JSON.stringify(getBrief());
    message('#createMessage', '指令已按当前表单更新，可直接编辑。');
    return result.prompt;
  }
  async function ensurePrompt() { return (!$('#aiPrompt').value.trim() || (automaticPrompt && promptBrief !== JSON.stringify(getBrief()))) ? await generatePrompt() : $('#aiPrompt').value.trim(); }
  $('#aiPrompt').addEventListener('input', () => { automaticPrompt=false; });
  async function copyPrompt() {
    const text = await ensurePrompt();
    try { await navigator.clipboard.writeText(text); }
    catch { $('#aiPrompt').focus(); $('#aiPrompt').select(); throw new Error('浏览器不允许自动复制，已选中指令，请按 Ctrl+C 或长按复制。'); }
    message('#createMessage', '指令已复制。请与全部参考图片一起发给 AI。'); toast('生成指令已复制');
  }
  async function readSettings() {
    settings = await api('/api/ai/settings');
    $('#apiSummary').textContent = settings.hasKey
      ? `${settings.model} · ${settings.size} · ${settings.inputMode === 'references' ? '支持参考图' : '仅文字生成'}。每面一次请求，费用以服务商为准。`
      : '尚未保存 API Key。可先设置接口，或选择正常新建 / 复制生成指令。';
    return settings;
  }
  function updateMode() {
    document.querySelectorAll('[data-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
    $('#aiBrief').hidden = mode === 'normal';
    $('#apiReferences').hidden = mode !== 'api';
    $('#aiBrief').querySelectorAll('input,select,textarea').forEach(input => { input.disabled = mode === 'normal'; });
    window.AlbumBrief.sync(mode !== 'normal');
    $('#briefLayout').disabled = mode !== 'prompt';
    $('#confirmCreate').textContent = mode === 'normal' ? '创建并打开' : mode === 'prompt' ? '复制指令' : `开始生成 · ${$('#briefCount').value} 次请求`;
    message('#createMessage','');
  }
  document.querySelectorAll('[data-mode]').forEach(button => button.onclick = guard(async () => {
    mode = button.dataset.mode; updateMode();
    if (mode === 'api') await readSettings();
  },'#createMessage'));
  $('#briefCount').addEventListener('input', () => { if (mode === 'api') $('#confirmCreate').textContent = `开始生成 · ${$('#briefCount').value} 次请求`; });
  $('#refreshPrompt').onclick = guard(generatePrompt,'#createMessage');
  $('#copyPrompt').onclick = guard(copyPrompt,'#createMessage');
  $('#downloadPrompt').onclick = guard(async () => {
    const url = URL.createObjectURL(new Blob([await ensurePrompt()],{type:'text/plain;charset=utf-8'}));
    const link = document.createElement('a'); link.href=url; link.download=globalThis.StudioI18n?.language==='en'?'Book-Generation-Prompt.txt':'画册生成指令.txt'; link.click();
    setTimeout(() => URL.revokeObjectURL(url),1000);
  },'#createMessage');

  function renderReferences() {
    $('#referenceList').innerHTML = references.map((ref,index) => `<div class="reference-item"><img src="${escapeHtml(ref.src)}" alt=""><span>${escapeHtml(ref.name)}</span><button type="button" data-remove-ref="${index}">移除参考</button></div>`).join('');
  }
  $('#referenceList').onclick = event => {
    const button = event.target.closest('[data-remove-ref]');
    if (button && !uploading) { references.splice(Number(button.dataset.removeRef),1); renderReferences(); }
  };
  $('#referenceFiles').onchange = guard(async () => {
    const input = $('#referenceFiles'), files = [...input.files]; input.value='';
    if (references.length + files.length > 16) throw new Error('参考图最多 16 张，请减少选择');
    if (files.some(file => !['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 25*1024*1024)) throw new Error('参考图只支持 JPG / PNG / WebP，单张最多 25MB');
    uploading = true; input.disabled = true;
    try {
      for (let index=0; index<files.length; index++) {
        message('#referenceStatus', `正在上传 ${index+1}/${files.length}…`);
        const response = await fetch('/api/images',{method:'POST', headers:{'Content-Type':files[index].type}, body:files[index]});
        const data = await response.json(); if (!response.ok) throw new Error(data.error || '参考图上传失败');
        references.push({src:data.src,name:files[index].name}); renderReferences();
      }
      message('#referenceStatus', `已保存 ${references.length} 张参考图到本机。`);
    } finally { uploading=false; input.disabled=mode === 'normal'; }
  },'#referenceStatus');

  $('#settingsFromCreate').onclick = () => window.StudioApp?.open('ai');
  document.querySelectorAll('[data-close]').forEach(button => button.onclick = () => $('#'+button.dataset.close).close());

  function renderJob() {
    if (!activeJob) {
      $('#jobResults').innerHTML=''; $('#importAIResults').disabled=true;
      $('#cancelAIJob').hidden=$('#retryAIJob').hidden=true;
      message('#jobStatus','还没有生成任务。请从“新建画册 → AI 接口生成”开始。'); return;
    }
    const done = activeJob.items.filter(item => item.status === 'ready').length;
    const stopped = terminal.has(activeJob.status), imported = Boolean(activeJob.albumId);
    for (const index of [...selected]) if (activeJob.items[index]?.status !== 'ready') selected.delete(index);
    message('#jobStatus', `${activeJob.brief.title} · ${labels[activeJob.status] || activeJob.status} · ${done}/${activeJob.items.length} 面 · ${activeJob.model}${imported ? ' · 已导入' : ''}${activeJob.status === 'cancelling' ? '。当前请求可能仍会完成并收费，之后不再请求。' : ''}`);
    $('#cancelAIJob').hidden=stopped; $('#cancelAIJob').disabled=busy || activeJob.status === 'cancelling';
    $('#retryAIJob').hidden=!stopped || imported || !activeJob.items.some(item => ['failed','queued'].includes(item.status));
    $('#retryAIJob').disabled=busy;
    $('#jobResults').innerHTML=activeJob.items.map(item => `<article class="job-result">
      ${item.src ? `<img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.name)}" loading="lazy">` : `<div class="result-placeholder">${escapeHtml(labels[item.status] || item.status)}</div>`}
      <label class="checkbox-label"><input type="checkbox" data-result="${item.index}" ${selected.has(item.index) ? 'checked' : ''} ${item.status !== 'ready' || imported ? 'disabled' : ''}>${escapeHtml(item.name)}</label>
      <small>${escapeHtml(labels[item.status] || item.status)} · 请求 ${item.attempts || 0} 次</small>
      ${item.error ? `<p>${escapeHtml(item.error)}</p>` : ''}
      ${stopped && !imported ? `<button type="button" data-retry-page="${item.index}" ${busy ? 'disabled' : ''}>重生成本面（可能收费）</button>` : ''}
    </article>`).join('');
    updateSelection();
  }
  function updateSelection() {
    $('#selectedResults').textContent = activeJob?.albumId ? '已导入，点击可再次打开' : `已选 ${selected.size} 面；未选封面 / 封底时保留空白占位，可在编辑器补充。`;
    $('#importAIResults').textContent = activeJob?.albumId ? '打开已导入画册' : '导入为新画册';
    $('#importAIResults').disabled=busy || !activeJob || !terminal.has(activeJob.status) || (!activeJob.albumId && !selected.size);
  }
  function schedule() {
    clearTimeout(timer); timer=null;
    if ($('#aiJobsDialog').open && activeJob && !terminal.has(activeJob.status)) timer=setTimeout(guard(refreshActive,'#jobMessage'),document.hidden ? 5000 : 1500);
  }
  async function refreshActive() {
    if (!activeJob) return;
    activeJob=(await api(`/api/ai/jobs/${activeJob.id}`)).job; renderJob(); schedule();
  }
  async function refreshJobs(id) {
    jobs=(await api('/api/ai/jobs')).jobs;
    const chosen=id || activeJob?.id || jobs[0]?.id;
    $('#jobSelect').innerHTML=jobs.length ? jobs.map(job=>`<option value="${job.id}">${escapeHtml(job.brief.title)} · ${escapeHtml(labels[job.status] || job.status)} · ${escapeHtml(new Date(job.createdAt).toLocaleString())}</option>`).join('') : '<option value="">还没有任务</option>';
    if (activeJob?.id !== chosen) selected=new Set();
    activeJob=jobs.find(job=>job.id===chosen) || jobs[0] || null;
    $('#jobSelect').value=activeJob?.id || ''; renderJob(); schedule();
  }
  async function openJobs(id) { await refreshJobs(id); if(!$('#aiJobsDialog').open) $('#aiJobsDialog').showModal(); schedule(); }
  $('#openAIJobs').onclick=guard(()=>openJobs(),'#jobMessage');
  $('#refreshJobs').onclick=guard(()=>refreshJobs(),'#jobMessage');
  $('#jobSelect').onchange=guard(()=>refreshJobs($('#jobSelect').value),'#jobMessage');
  $('#aiJobsDialog').addEventListener('close',()=>clearTimeout(timer));
  async function jobAction(action, body={}) {
    if(!activeJob || busy) return;
    busy=true; renderJob(); message('#jobMessage','正在处理…');
    try {
      const result=await request(`/api/ai/jobs/${activeJob.id}/${action}`,body);
      if(action==='import') {await load(); location.href=`/?id=${encodeURIComponent(result.album.id)}`; return;}
      activeJob=result.job; message('#jobMessage',action==='cancel' ? '已请求停止，当前已发送请求无法撤销。' : '已手动开始生成，不会自动重复请求。');
    } finally {busy=false; renderJob(); schedule();}
  }
  $('#cancelAIJob').onclick=guard(()=>jobAction('cancel'),'#jobMessage');
  $('#retryAIJob').onclick=guard(()=>jobAction('retry'),'#jobMessage');
  $('#importAIResults').onclick=guard(()=>jobAction('import',{indices:[...selected]}),'#jobMessage');
  $('#jobResults').onchange=event => {const input=event.target.closest('[data-result]'); if(input) {const index=Number(input.dataset.result); input.checked ? selected.add(index) : selected.delete(index); updateSelection();}};
  $('#jobResults').addEventListener('click', event => {
    const button=event.target.closest('[data-retry-page]');
    if(button) guard(()=>jobAction('retry',{indices:[Number(button.dataset.retryPage)]}),'#jobMessage')();
  });
  window.AlbumAI={submit:async () => {
    if(mode==='normal') return createProject();
    if(mode==='prompt') return copyPrompt();
    if(uploading) throw new Error('参考图仍在上传，请稍候');
    await readSettings(); if(!settings.hasKey) throw new Error('请先保存 API Key，或选择复制生成指令');
    if(references.length && settings.inputMode !== 'references') throw new Error('当前接口仅支持文字，不能读取参考图。请调整接口能力或移除参考。');
    // API jobs always generate independent leaves, even when the universal prompt requests spreads.
    const result=await request('/api/ai/jobs',{brief:getBrief(),prompt:await ensurePrompt(),references:references.map(ref=>ref.src)});
    selected=new Set(); $('#createDialog').close(); await openJobs(result.job.id);
  }};
  updateMode();
})();
