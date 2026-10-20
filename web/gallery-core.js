/* A finite collection on an automatically extending wall; no WebGL or animation loop. */
(() => {
  class GalleryWall {
    constructor(root, callbacks = {}) {
      this.root=root;this.callbacks=callbacks;this.items=[];this.drag=null;this.moved=false;this.zoom=1;
      this.imageObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){const img=entry.target;if(img.dataset.src){img.src=img.dataset.src;delete img.dataset.src;}this.imageObserver.unobserve(img);}},{root,rootMargin:'0px 100%'});
      root.tabIndex=0;root.setAttribute('role','region');root.setAttribute('aria-label','横向展墙，使用左右方向键浏览');
      root.addEventListener('wheel',e=>{if(e.ctrlKey||e.metaKey){e.preventDefault();this.setZoom(this.zoom*Math.exp(-e.deltaY*.003));return;}if(Math.abs(e.deltaX)>Math.abs(e.deltaY))return;e.preventDefault();root.scrollLeft+=e.deltaY*(e.deltaMode===1?24:1);},{passive:false});
      root.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'||e.button!==0)return;this.drag={id:e.pointerId,x:e.clientX,scroll:root.scrollLeft};this.moved=false;});
      root.addEventListener('pointermove',e=>{if(!this.drag||e.pointerId!==this.drag.id)return;const dx=e.clientX-this.drag.x;if(Math.abs(dx)>5){this.moved=true;root.setPointerCapture(e.pointerId);root.classList.add('panning');}if(this.moved){e.preventDefault();root.scrollLeft=this.drag.scroll-dx;}});
      const end=e=>{if(this.drag?.id===e.pointerId){this.drag=null;root.classList.remove('panning');if(root.hasPointerCapture(e.pointerId))root.releasePointerCapture(e.pointerId);}};
      root.addEventListener('pointerup',end);root.addEventListener('pointercancel',end);
      root.addEventListener('lostpointercapture',()=>{this.drag=null;root.classList.remove('panning');});
      root.addEventListener('click',e=>{if(this.moved){e.preventDefault();this.moved=false;return;}const button=e.target.closest('[data-art]');if(button){this.callbacks.select?.(button.dataset.art);if(callbacks.viewer)this.open(button.dataset.art);}});
      root.addEventListener('dblclick',e=>{const button=e.target.closest('[data-art]');if(button&&!this.moved)this.open(button.dataset.art);});
      root.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const current=this.index();this.focusIndex(e.key==='Home'?0:e.key==='End'?this.items.length-1:current+(e.key==='ArrowRight'?1:-1));});
      root.addEventListener('scroll',()=>{if(this.frame)return;this.frame=requestAnimationFrame(()=>{this.frame=0;this.notify();});},{passive:true});
      this.observer=new ResizeObserver(()=>this.layout());this.observer.observe(root);
      this.dialog=document.createElement('dialog');this.dialog.className='art-dialog';
      this.dialog.innerHTML='<button class="art-close" aria-label="关闭作品详情">×</button><img alt=""><div class="art-detail"><h2></h2><p></p></div><nav><button data-detail="prev" aria-label="上一件作品">←</button><span></span><button data-detail="next" aria-label="下一件作品">→</button></nav>';
      document.body.append(this.dialog);this.dialog.querySelector('.art-close').onclick=()=>this.dialog.close();
      const back=document.createElement('button');back.className='studio-back studio-detail-back';back.type='button';back.textContent='← 返回展厅';back.onclick=()=>this.dialog.close();this.dialog.prepend(back);
      this.dialog.addEventListener('click',e=>{if(e.target.dataset.detail)this.openIndex(this.detailIndex+(e.target.dataset.detail==='next'?1:-1));});
      this.dialog.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();e.stopPropagation();this.openIndex(this.detailIndex+(e.key==='ArrowRight'?1:-1));}});
    }
    set(config,selected) {
      const anchor=this.items[this.index()]?.id;
      this.config=config;this.items=config.artworks.filter(a=>!a.hidden);this.selected=selected;
      const old=this.root.scrollLeft;this.root.dataset.wall=config.wall;this.root.dataset.frame=config.frame;
      this.root.style.setProperty('--art-gap',`${config.gap}px`);this.root.style.setProperty('--spot-opacity',config.light/100);
      this.root.dataset.lighting=config.lighting||'spot';this.root.dataset.align=config.align||'center';
      this.root.classList.toggle('no-captions',!config.captions);
      const signature=this.items.map(item=>item.id+'|'+item.src).join('\n');
      if(this.signature===signature&&this.items.length){
        const slots=this.root.querySelectorAll('.art-slot');
        this.items.forEach((item,index)=>{const slot=slots[index];slot.style.setProperty('--art-ratio',Math.max(.08,Math.min(12,item.width/item.height)));slot.style.setProperty('--art-scale',item.scale/100);const button=slot.querySelector('.art-picture');button.classList.toggle('selected',selected===item.id&&!this.callbacks.viewer);button.setAttribute('aria-label',`查看作品：${item.title}`);button.querySelector('img').alt=item.title;slot.querySelector('.art-caption b').textContent=`${String(index+1).padStart(2,'0')}  ${item.title}`;slot.querySelector('.art-caption small').textContent=item.description||'作品展示';});
        this.decorate();this.layout();if(anchor)this.focus(anchor);this.callbacks.collection?.(this.items);return;
      }
      this.signature=signature;
      this.imageObserver.disconnect();
      const track=document.createElement('div');track.className='gallery-track';
      for(const [index,item] of this.items.entries()){
        const slot=document.createElement('article');slot.className='art-slot';slot.dataset.id=item.id;
        slot.style.setProperty('--art-ratio',Math.max(.08,Math.min(12,item.width/item.height)));
        slot.style.setProperty('--art-scale',item.scale/100);
        const light=document.createElement('i');light.className='wall-light';light.setAttribute('aria-hidden','true');
        const button=document.createElement('button');button.className='art-picture';button.dataset.art=item.id;button.type='button';button.setAttribute('aria-label',`查看作品：${item.title}`);button.classList.toggle('selected',selected===item.id&&!this.callbacks.viewer);
        const img=document.createElement('img');if(index<2)img.src=this.preview(item);else img.dataset.src=this.preview(item);img.alt=item.title;img.loading=index<2?'eager':'lazy';img.decoding='async';img.draggable=false;img.onerror=()=>{if(img.src!==new URL(item.src,location.href).href){img.src=item.src;return;}button.classList.add('image-error');button.title='图片无法读取，请在后台替换';};button.append(img);this.imageObserver.observe(img);
        const caption=document.createElement('div');caption.className='art-caption';const title=document.createElement('b');title.textContent=`${String(index+1).padStart(2,'0')}  ${item.title}`;const description=document.createElement('small');description.textContent=item.description||'作品展示';caption.append(title,description);slot.append(light,button,caption);track.append(slot);
      }
      if(!this.items.length){const empty=document.createElement('div');empty.className='wall-empty';empty.innerHTML='<span>YOUR EXHIBITION STARTS HERE</span><h2>让每一件作品，拥有自己的位置。</h2><p>添加作品后，展墙会自动向两侧延展。<br>完整保留原图比例，无需裁切。</p>';track.append(empty);}
      this.root.replaceChildren(track);this.decorate();this.layout();this.root.scrollLeft=old;if(anchor&&this.items.some(item=>item.id===anchor))this.focus(anchor);this.notify();this.callbacks.collection?.(this.items);
    }
    preview(item){return item.previewSrc||(item.src.startsWith('/gallery-media/')?item.src.replace('/gallery-media/','/gallery-preview/'):item.src);}
    description(item){return [item.section,[item.author,item.year,item.dimensions].filter(Boolean).join(' · '),item.description].filter(Boolean).join('\n');}
    decorate(){this.root.querySelectorAll('.art-slot').forEach((slot,index)=>{const item=this.items[index];slot.querySelector('.art-caption small').textContent=this.description(item);const button=slot.querySelector('.art-picture');button.dataset.frame=item.frame&&item.frame!=='inherit'?item.frame:this.config.frame;button.dataset.mat=this.config.mat||'none';});}
    layout(){if(!this.config)return;const height=Math.max(60,(this.root.clientHeight-145)*this.config.artHeight/100);this.root.style.setProperty('--art-base-height',`${height}px`);this.root.style.setProperty('--wall-inset',`${Math.max(24,this.root.clientWidth*.2)}px`);this.root.style.setProperty('--art-gap',`${this.config.gap*this.zoom}px`);
      const sizes=this.items.map(item=>{const ratio=Math.max(.08,Math.min(12,item.width/item.height));let h=height*item.scale/100,w=h*ratio;if(this.config.layout==='width'){w=height*.9*item.scale/100;h=w/ratio;}else if(this.config.layout==='original'){const factor=Math.max(.55,Math.min(1.25,Math.sqrt(item.width*item.height)/1800));w*=factor;h*=factor;}return {w,h};});
      const tallest=sizes.reduce((max,size)=>Math.max(max,size.h),1),widest=sizes.reduce((max,size)=>Math.max(max,size.w),1);const fit=Math.min(1,Math.max(45,this.root.clientHeight-170)/tallest,Math.max(80,this.root.clientWidth-70)/widest);
      this.root.querySelectorAll('.art-slot').forEach((slot,index)=>{slot.style.width=sizes[index].w*fit*this.zoom+'px';slot.style.height=sizes[index].h*fit*this.zoom+'px';});this.notify();}
    setZoom(value){const anchor=this.items[this.index()]?.id;this.zoom=Math.max(.25,Math.min(1.5,Number(value)||1));this.layout();if(anchor)this.focus(anchor);this.callbacks.zoom?.(this.zoom);}
    index(){if(!this.items.length)return -1;const center=this.root.scrollLeft+this.root.clientWidth/2;let best=0,distance=Infinity;this.root.querySelectorAll('.art-slot').forEach((el,i)=>{const d=Math.abs(el.offsetLeft+el.offsetWidth/2-center);if(d<distance){best=i;distance=d;}});return best;}
    notify(){const max=this.root.scrollWidth-this.root.clientWidth;this.callbacks.position?.({index:this.index(),count:this.items.length,progress:max>0?this.root.scrollLeft/max:0});}
    focusIndex(index){if(!this.items.length)return;index=Math.max(0,Math.min(this.items.length-1,index));const slot=this.root.querySelectorAll('.art-slot')[index];this.root.scrollLeft=slot.offsetLeft+slot.offsetWidth/2-this.root.clientWidth/2;this.notify();}
    focus(id){const index=this.items.findIndex(item=>item.id===id);if(index>=0)this.focusIndex(index);}
    open(id){this.openIndex(this.items.findIndex(item=>item.id===id));}
    openIndex(index){if(!this.items.length)return;this.callbacks.pause?.();this.detailIndex=Math.max(0,Math.min(this.items.length-1,index));const item=this.items[this.detailIndex];const img=this.dialog.querySelector('img');img.src=item.src;img.alt=item.title;this.dialog.querySelector('h2').textContent=item.title;this.dialog.querySelector('p').textContent=this.description(item);this.dialog.querySelector('nav span').textContent=`${this.detailIndex+1} / ${this.items.length}`;this.dialog.querySelector('[data-detail=prev]').disabled=this.detailIndex===0;this.dialog.querySelector('[data-detail=next]').disabled=this.detailIndex===this.items.length-1;if(!this.dialog.open)this.dialog.showModal();}
  }
  globalThis.GalleryWall=GalleryWall;
})();
