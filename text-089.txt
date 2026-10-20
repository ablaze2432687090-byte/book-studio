/* Admin-only preview. Never included in public/offline album exports. */
(() => {
  const available = () => innerWidth >= 1024 && !/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) && !(navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let dialog, activeId, controller, generation = 0, opener;
  let device = 'desktop', landscape = false;
  const dimensions = { desktop:[1440,900], phone:[402,874], tablet:[1024,1366] };
  const $ = s => dialog.querySelector(s);
  const sizes = () => { const [w,h] = dimensions[device]; return landscape && device !== 'desktop' ? [h,w] : [w,h]; };
  function create() {
    dialog = document.createElement('dialog'); dialog.className='device-preview'; dialog.id='devicePreviewDialog';
    dialog.setAttribute('aria-labelledby','dpTitle');
    dialog.innerHTML=`<div class="dp-shell"><header class="dp-header"><div><h2 id="dpTitle">设备预览</h2><p id="dpAlbumTitle"></p></div><button type="button" class="dp-close" aria-label="关闭设备预览">×</button></header>
      <div class="dp-toolbar"><div class="dp-group" aria-label="设备类型"><span class="dp-label">设备</span><button type="button" data-device="desktop">电脑</button><button type="button" data-device="phone">手机</button><button type="button" data-device="tablet">平板</button></div>
      <div class="dp-group" id="dpOrientation"><button type="button" data-orientation="portrait">竖屏</button><button type="button" data-orientation="landscape">横屏</button></div>
      <span class="dp-label">实际预览</span></div>
      <section class="dp-stage" aria-label="设备预览画面"><div class="dp-live"><div class="dp-device" data-device="desktop"><iframe title="可操作的画册预览" sandbox="allow-scripts allow-same-origin" allow="fullscreen 'none'"></iframe></div></div><div class="dp-message" role="status" hidden></div></section>
      <footer class="dp-footer"><div><span id="dpHint"></span></div><span id="dpSize"></span></footer></div>`;
    document.body.append(dialog);
    $('.dp-close').innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6L18 18M18 6L6 18"/></svg>';
    $('.dp-close').onclick=()=>dialog.close();
    if(globalThis.StudioNavigation){const back=StudioNavigation.button('返回上一界面',()=>dialog.close());back.id='devicePreviewBack';dialog.querySelector('.dp-footer').prepend(back);}
    dialog.addEventListener('close', cleanup);
    dialog.querySelectorAll('[data-device]').forEach(b=> { if(b.tagName==='BUTTON') b.onclick=()=>{ device=b.dataset.device; landscape=false; update(); }; });
    dialog.querySelectorAll('[data-orientation]').forEach(b=>b.onclick=()=>{landscape=b.dataset.orientation==='landscape';update();});
    $('iframe').onload=()=>{
      const doc=$('iframe').contentDocument;
      if(!doc || !dialog.open) return;
      for(const selector of ['.viewer-nav','#viewerFullscreen']) {
        const element=doc.querySelector(selector);if(element){element.hidden=true;element.style.setProperty('display','none','important');}
      }
      // Fullscreen belongs to the outer modal. Embedded preview must remain closable.
      $('iframe').contentWindow.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();dialog.close();}});
    };
    new ResizeObserver(fit).observe($('.dp-stage'));
  }
  function message(text) {
    const box=$('.dp-message');box.replaceChildren();box.hidden=!text;
    if(!text)return;
    const p=document.createElement('p');p.textContent=text;box.append(p);
  }
  function fit() {
    if(!dialog?.open)return;
    const [w,h]=sizes(), box=$('.dp-live'), frame=$('iframe'), shell=$('.dp-device');
    frame.width=w;frame.height=h;shell.dataset.device=device;
    const scale=Math.max(.05,Math.min((box.clientWidth-24)/(shell.offsetWidth*(device==='desktop'?1.08:1)),(box.clientHeight-24)/(shell.offsetHeight+(device==='desktop'?16:0)),1));
    shell.style.transform=`translate(-50%, -50%) scale(${scale})`;
    $('#dpSize').textContent=`${w} × ${h}`;
  }
  function update() {
    dialog.querySelectorAll('button[data-device]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.device===device)));
    dialog.querySelectorAll('[data-orientation]').forEach(b=>b.setAttribute('aria-pressed',String((b.dataset.orientation==='landscape')===landscape)));
    $('#dpOrientation').hidden=device==='desktop';
    $('#dpHint').textContent='可翻页、缩放；按尺寸预览，不代替真实设备浏览器测试。';
    fit();message('');
    const frame=$('iframe');
    const src=`/album/?id=${encodeURIComponent(activeId)}&previewDevice=${device}&previewOrientation=${landscape?'landscape':'portrait'}`;
    if(frame.getAttribute('src')!==src)frame.src=src;
  }
  function cleanup() {
    generation++;controller?.abort();
    $('iframe').src='about:blank';document.body.style.overflow=dialog.dataset.previousOverflow||'';opener?.focus();
  }
  async function open(id) {
    if(!available())return;
    if(!dialog)create();if(dialog.open)return;
    opener=document.activeElement;activeId=id;device='desktop';landscape=false;
    dialog.dataset.previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
    dialog.showModal();message('正在读取画册…');$('#dpAlbumTitle').textContent='';
    dialog.querySelectorAll('.dp-toolbar button,.dp-toolbar select').forEach(b=>b.disabled=true);
    controller=new AbortController();const token=++generation;
    try {
      const r=await fetch(`/api/albums/${encodeURIComponent(id)}`,{signal:controller.signal,cache:'no-store'});
      if(!r.ok)throw new Error('无法读取这本画册，请关闭后重试');
      const data=await r.json();if(token!==generation||!dialog.open)return;const album=data.album||data;
      $('#dpAlbumTitle').textContent=album.title||'未命名画册';
      if(!album.pages?.length)throw new Error('画册中还没有可预览的页面');
      dialog.querySelectorAll('.dp-toolbar button,.dp-toolbar select').forEach(b=>b.disabled=false);
      await update();
    }catch(e){if(token===generation&&e.name!=='AbortError')message(e.message);}
  }
  function labelEntry(){ const b=document.querySelector('#viewAlbum');if(b)b.textContent=available()?'设备预览 ↗':'预览成品 ↗'; }
  labelEntry();
  addEventListener('resize',()=>{labelEntry();if(dialog?.open&&!available())dialog.close();});
  window.DevicePreview={available,open};
})();
