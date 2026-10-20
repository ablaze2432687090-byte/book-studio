(async()=>{
 const $=s=>document.querySelector(s);
 const embeddedData=$('#galleryData').textContent.trim();
 if(!embeddedData&&['127.0.0.1','localhost','::1'].includes(location.hostname)){
  const params=new URLSearchParams(location.search),id=params.get('id'),preview=params.get('preview')==='1';
  const back=document.createElement('button');back.type='button';back.id='viewerBack';back.className='studio-back';back.textContent=preview?'← 关闭预览':'← 返回展厅项目';
  back.onclick=()=>{if(preview){window.close();setTimeout(()=>{if(!window.closed)location.href=id?'/gallery.html?id='+encodeURIComponent(id):'/projects.html?type=gallery';},100);}else location.href='/projects.html?type=gallery';};$('.viewer-heading').prepend(back);
 }
 try{
  const embedded=embeddedData;let gallery;
  if(embedded)gallery=JSON.parse(embedded);
  else{const id=new URLSearchParams(location.search).get('id');if(!id)throw Error('缺少展厅编号');const response=await fetch('/api/galleries/'+encodeURIComponent(id));if(!response.ok)throw Error('展厅无法读取，请返回后台确认保存');gallery=await response.json();}
  document.title=gallery.title+' · 作品展厅';$('#viewerTitle').textContent=gallery.title;
  const wall=new GalleryWall($('#galleryViewport'),{viewer:true,position:({index,count,progress})=>{$('#galleryPosition').textContent=`${count?index+1:0} / ${count}`;$('#galleryProgress').value=progress*1000;$('#galleryPrevious').disabled=index<=0;$('#galleryNext').disabled=index>=count-1;}});
  GalleryTools.attach(wall);GalleryPresentation.attach(wall);
  wall.set(gallery);$('#galleryPrevious').onclick=()=>wall.focusIndex(wall.index()-1);$('#galleryNext').onclick=()=>wall.focusIndex(wall.index()+1);$('#galleryHome').onclick=()=>wall.focusIndex(0);$('#galleryProgress').oninput=e=>{wall.root.scrollLeft=(wall.root.scrollWidth-wall.root.clientWidth)*e.target.value/1000;};
  $('#viewerFullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{}}
 }catch(error){$('#viewerError').hidden=false;$('#viewerError').textContent=error.message;}
})();
