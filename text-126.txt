/* Shared UI localization. User content and form values are deliberately excluded. */
(() => {
 'use strict';
 const dictionary=globalThis.BookStudioEnglish||{}, records=new WeakMap(), attributes=new WeakMap();
 const protectedSelector='[data-user-content],[translate="no"],script,style,textarea,input,.album-title-row h2,.empty-cover strong,.hub-gallery-info h2,.row-name b,.asset-caption b,#libraryFolders,#gallerySections option,#galleryAssetPicker select option:not([value=""]):not([value="__archived"]),.gallery-view-tools select[data-section] option:not([value=""]),#libraryMove option[value]:not([value=""]),#libraryDetailName,#libraryDetailTags,.library-entry span,.art-detail h2,.art-detail p,.art-caption,.gallery-section-marker,.overview-art span,.overview-art small,.gallery-intro h2,.gallery-intro h3,.gallery-intro p,.gallery-intro [data-curator],#dpAlbumTitle,.gallery-manager-row b,#viewerTitle,#album-title,.generated-cover,.gallery-art-title,.gallery-art-description,.page-item .meta b,#promptOutput,#generatedPrompt';
 let language='zh-CN',observer,scheduled=false;
 function translate(source){
  if(language!=='en'||typeof source!=='string')return source;
  const trimmed=source.trim(),exact=dictionary[trimmed];
  if(exact)return source.slice(0,source.indexOf(trimmed))+exact+source.slice(source.indexOf(trimmed)+trimmed.length);
  const patterns=[
   [/^选择作品 (.+)$/,m=>`Select artwork ${m[1]}`],
   [/^文件已生成 · ([\d.]+) MB。请在系统对话框中选择保存位置。$/,m=>`File ready · ${m[1]} MB. Choose a save location in the system dialog.`],
   [/^文件已生成 · ([\d.]+) MB。文件保存至浏览器的下载位置。$/,m=>`File ready · ${m[1]} MB. Check your browser downloads.`],
   [/^展出 (\d+) 件 · 隐藏 (\d+) 件（不导出） · 原图约 ([\d.]+) MB([\s\S]*)$/,m=>`${m[1]} on display · ${m[2]} hidden (excluded) · ${m[3]} MB of originals${m[4].replace('图片完整，可以导出。','Images verified. Ready to export.').replace('缺失图片：','Missing images: ').replaceAll('长文字请在作品详情中查看：','Read long text in artwork details: ')}`],
   [/^(作品目录|使用指南|Artwork-Catalog|User-Guide) PDF 已生成并开始下载，可直接打开或转发。$/,m=>`${m[1]==='作品目录'?'Artwork catalog':m[1]==='使用指南'?'User guide':m[1]} PDF is ready to download, open or share.`],
   [/^未完成：([\s\S]+)。可点击“重试导出”，无需关闭窗口。$/,m=>`Export failed: ${translate(m[1])}. Retry here without closing the dialog.`],
   [/^优先加载封面与首屏 · (\d+)%$/,m=>`Loading cover and first pages · ${m[1]}%`],
   [/^“(.+)”可以随时恢复；原图和已经导出的文件不会被删除。$/,m=>`“${m[1]}” can be restored. Original images and exports will not be deleted.`],
   [/^“(.+)”将移入回收站，可以随时恢复；原始图片和已导出的文件不受影响。$/,m=>`“${m[1]}” will move to trash and can be restored. Originals and exports are preserved.`],
   [/^已整理 (\d+) 张，未永久删除。重新检查后可再次整理。$/,m=>`${m[1]} images moved to recoverable storage. Check again before another cleanup.`],
   [/^已恢复 (\d+) 张原图。请重新打开此窗口以刷新检查结果。$/,m=>`${m[1]} originals restored. Reopen this window to refresh the scan.`],
   [/^素材共 ([\d.]+) MB；超过 7 天且未被项目、回收站、恢复点或编辑历史引用的原图 (\d+) 张，约 ([\d.]+) MB。\n整理只移入本地暂存区，可以撤销，不会永久删除。$/,m=>`Media: ${m[1]} MB. ${m[2]} originals (${m[3]} MB) are over 7 days old and unreferenced by projects, trash, recovery points, or editing history.\nCleanup moves them to recoverable local storage; nothing is permanently deleted.`],
   [/^(\d+) 件作品 · (\d+) 件展出$/,m=>`${m[1]} artworks · ${m[2]} on display`],
   [/^封面预览 · (.+) · (竖版|横版) · (\d+) 页$/,m=>`Cover preview · ${m[1]} · ${m[2]==='竖版'?'portrait':'landscape'} · ${m[3]} pages`],
   [/^单面 (\d+) × (\d+) px · (竖版|横版) · (.+)。API 实际输出尺寸以接口设置为准。$/,m=>`Page ${m[1]} × ${m[2]} px · ${m[3]==='竖版'?'portrait':'landscape'} · ${m[4]}. API settings determine output size.`],
   [/^(\d+) (?:个页面|页|面)$/,m=>`${m[1]} pages`],
   [/^(\d+) 件作品$/,m=>`${m[1]} artworks`],
   [/^已选 (\d+) (张|件)$/,m=>`${m[1]} selected`],
   [/^(\d+) \/ (\d+) 页 · 每页 (\d+) 张$/,m=>`${m[1]} / ${m[2]} · ${m[3]} per page`],
   [/^(\d+) 张图片 · 图库共 (\d+) 张 · 内容重复的图片不重复占用空间$/,m=>`${m[1]} images · ${m[2]} in library · duplicates share storage`],
   [/^(.+) · Windows 客户端$/,m=>`${m[1]} · Windows desktop`],
   [/^(.+) · 网页开发模式$/,m=>`${m[1]} · development mode`],
   [/^最近备份：(.+) · 共 (\d+) 份$/,m=>`Last backup: ${m[1]} · ${m[2]} copies`],
   [/^完整备份已保存：(.+)$/,m=>`Backup saved: ${m[1]}`],
   [/^正在导入 (.+)$/,m=>`Importing ${m[1]}`],
   [/^本地保存 · (\d+) 件作品 · 修改于 (.+)$/,m=>`Saved locally · ${m[1]} artworks · updated ${m[2]}`],
   [/^(\d+) 页 · 修改于 (.+)$/,m=>`${m[1]} pages · updated ${m[2]}`]
  ];
  for(const [pattern,render]of patterns){const match=trimmed.match(pattern);if(match)return render(match);}
  return source;
 }
 function isProtected(element){return !element||Boolean(element.closest(protectedSelector));}
 function text(node){
  if(isProtected(node.parentElement))return;
  const current=node.nodeValue;let record=records.get(node);
  if(!record||current!==record.rendered)record={source:current,rendered:current};
  const rendered=translate(record.source);record.rendered=rendered;records.set(node,record);
  if(current!==rendered)node.nodeValue=rendered;
 }
 function visit(root){
  // Option text is sometimes the underlying value. Freeze it BEFORE translation.
  for(const option of root.querySelectorAll('option:not([value])'))option.value=option.textContent;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;while((node=walker.nextNode()))text(node);
  for(const element of root.querySelectorAll('[title],[aria-label],[placeholder],[label]')){
   if(isProtected(element)&&!element.matches('input'))continue;
   let record=attributes.get(element);if(!record){record={};attributes.set(element,record);}
   for(const name of ['title','aria-label','placeholder','label']){if(!element.hasAttribute(name)||name==='aria-label'&&element.matches('.album-card'))continue;const current=element.getAttribute(name),old=record[name];const source=old&&current===old.rendered?old.source:current,rendered=translate(source);record[name]={source,rendered};if(current!==rendered)element.setAttribute(name,rendered);}
  }
 }
 function refresh(){scheduled=false;observer?.disconnect();try{visit(document.documentElement);}finally{observer?.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title','aria-label','placeholder','label']});}}
 function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(refresh);}
 function setLanguage(value){language=value==='en'?'en':'zh-CN';document.documentElement.lang=language;document.documentElement.dataset.studioLanguage=language;refresh();try{localStorage.setItem('book-studio-language',language);}catch{}document.dispatchEvent(new CustomEvent('studio:language',{detail:language}));return language;}
 function source(node){return records.get(node?.firstChild)?.source||node?.textContent||'';}
 function missing(){const result=new Set(),walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;while((node=walker.nextNode())){const parent=node.parentElement;if(!isProtected(parent)&&(parent.getClientRects().length&&getComputedStyle(parent).visibility!=='hidden'||parent.matches('option,optgroup'))&&/[\u4e00-\u9fff]/.test(node.nodeValue))result.add(node.nodeValue.trim());}return [...result];}
 globalThis.StudioI18n=Object.freeze({t:translate,setLanguage,source,missing,get language(){return language;}});
 try{language=(globalThis.__BOOK_STUDIO_LANGUAGE__||localStorage.getItem('book-studio-language'))==='en'?'en':'zh-CN';}catch{}
 document.documentElement.lang=language;
 function start(){observer=new MutationObserver(schedule);setLanguage(language);}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
