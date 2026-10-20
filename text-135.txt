/* Admin-only workflow composition. Existing save/import APIs remain the source of truth. */
(() => {
 const $=selector=>document.querySelector(selector);
 function statusSave(){const original=$('#save,#saveGallery'),status=$('#status,#galleryStatus');if(!original||!status)return;
  const control=document.createElement('button');control.id=status.id;control.type='button';control.className='autosave-status';control.textContent=status.textContent;control.setAttribute('aria-live','polite');control.title='自动保存已开启；点击立即保存，或按 Ctrl+S';status.replaceWith(control);original.hidden=true;
  control.onclick=()=>{if(!original.disabled)original.click();};const sync=()=>{control.dataset.state=/失败|未完成|重试|failed|incomplete|retry/i.test(control.textContent)?'error':/正在|saving|working/i.test(control.textContent)?'saving':'saved';control.disabled=original.disabled;control.setAttribute('aria-busy',String(control.dataset.state==='saving'));};new MutationObserver(sync).observe(control,{childList:true,subtree:true});new MutationObserver(sync).observe(original,{attributes:true,attributeFilter:['disabled']});sync();
 }
 function gallery(){if(!$('#galleryViewport'))return;
  const preset=[...document.querySelectorAll('.gallery-scene-details')].find(d=>d.querySelector('#scene-presetChoice')),first=$('.gallery-scene-details');if(preset&&first){first.before(preset);preset.open=true;first.open=false;preset.querySelector('summary').textContent='快速场景预设';}
  const switcher=$('#galleryLibrary');switcher.classList.add('project-switch');switcher.textContent='切换展厅 ▾';$('.gallery-project').append(switcher);
  $('#galleryLibraryDialog h2').textContent='切换展厅';$('#galleryLibraryDialog .muted').textContent='正常与归档分开显示；回收站在项目中心恢复。';const legacyReturn=$('.gallery-note a');if(legacyReturn){legacyReturn.textContent='返回项目中心';legacyReturn.href='/projects.html?type=gallery';}
  const form=$('#galleryCreateForm'),newButton=$('#newGallery');form.hidden=!new URLSearchParams(location.search).has('new');newButton.textContent='＋ 新建展厅';newButton.className='gallery-create-toggle';form.before(newButton);newButton.onclick=()=>{form.hidden=!form.hidden;if(!form.hidden){$('#newGalleryTitle').focus();$('#newGalleryTitle').select();}};
  const add=$('#galleryAdd'),upload=$('#galleryUpload'),library=$('#galleryImport');upload.hidden=true;library.hidden=true;add.textContent='添加作品';add.setAttribute('aria-label','添加作品');
  const dialog=document.createElement('dialog');dialog.id='galleryAddDialog';dialog.className='gallery-dialog';dialog.innerHTML='<header><h2>添加作品</h2><button type="button" aria-label="关闭添加作品">×</button></header><p class="muted">支持批量选择，导入后可继续调整顺序与装裱。</p><div class="workflow-choices"><button data-source="local"><strong>从电脑导入</strong><small>多选图片，直接加入当前展厅</small></button><button data-source="library"><strong>从图库选择</strong><small>导入独立副本，不影响图库原图</small></button></div>';document.body.append(dialog);dialog.querySelector('header button').onclick=()=>dialog.close();dialog.querySelector('[data-source=local]').onclick=()=>{dialog.close();upload.click();};dialog.querySelector('[data-source=library]').onclick=()=>{dialog.close();library.click();};add.onclick=()=>{if(!add.disabled)dialog.showModal();};
  const manageLink=$('.gallery-actions a[href^="/library.html"]');if(manageLink){manageLink.className='workflow-library-link';manageLink.textContent='管理素材图库 ↗';dialog.append(manageLink);}
 }
 function boot(){statusSave();if($('#galleryTitle'))gallery();if($('#exportFormat')){$('#exportFormat').value='offline';$('#openExport').textContent='导出与交付';}}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
