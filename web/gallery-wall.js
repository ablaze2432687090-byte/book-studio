/* Extends the proven wall interactions with layouts and bounded DOM rendering. */
(() => {
 const Base=GalleryWall;
 class Wall extends Base {
  constructor(root,callbacks={}){super(root,callbacks);this.nodes=new Map();
   for(const type of ['pointerdown','wheel'])root.addEventListener(type,()=>{this.focusedIndex=undefined;this.focusedScroll=undefined;},{capture:true,passive:true});
   root.addEventListener('scroll',()=>{if(this.items.length>120)this.renderVisible();this.scheduleLight();},{passive:true});
   let dragging;
   root.addEventListener('pointerdown',event=>{const id=event.target.closest('[data-art]')?.dataset.art;if(!root.classList.contains('layout-editing')||!id||event.button!==0)return;event.preventDefault();event.stopImmediatePropagation();dragging={id,pointer:event.pointerId,x:event.clientX,y:event.clientY};root.setPointerCapture(event.pointerId);},true);
   root.addEventListener('pointermove',event=>{if(!dragging||event.pointerId!==dragging.pointer)return;const slot=this.nodes.get(dragging.id);if(slot)slot.style.transform=`translate(${event.clientX-dragging.x}px,${event.clientY-dragging.y}px)`;},true);
   const end=event=>{if(!dragging||event.pointerId!==dragging.pointer)return;const current=dragging;dragging=null;const dx=(event.clientX-current.x)/this.zoom,dy=(event.clientY-current.y)/this.zoom;this.moved=Math.abs(dx)+Math.abs(dy)>4;if(event.type==='pointerup'&&this.moved)this.callbacks.move?.(current.id,dx,dy);else this.renderVisible();if(root.hasPointerCapture(event.pointerId))root.releasePointerCapture(event.pointerId);};
   root.addEventListener('pointerup',end,true);root.addEventListener('pointercancel',end,true);
   root.addEventListener('lostpointercapture',()=>{if(dragging){dragging=null;this.renderVisible();}});
  }
  set(config,selected){const anchor=this.items[this.index()]?.id;this.config=config;this.items=config.artworks.filter(a=>!a.hidden);this.selected=selected;
   for(const [key,value]of Object.entries({wall:config.wall,frame:config.frame,floor:config.floor||'legacy',lighting:config.lighting||'spot',align:config.align||'center'}))this.root.dataset[key]=value;
   this.root.classList.toggle('no-captions',!config.captions);
   const values={'--spot-opacity':config.light/100,'--floor-shine':(config.floorShine??20)/100,'--wall-grain':(config.wallTexture??30)/100,'--ambient':(config.ambient??100)/100,'--ambient-dim':Math.max(0,1-(config.ambient??100)/100)*.8,'--ambient-glow':Math.max(0,(config.ambient??100)/100-1)*.4,'--light-rgb':GalleryDesign.temperature(config.lightTemperature??5500),'--light-angle':((config.lightDirection||0)*.4)+'%','--light-degree':config.lightDirection||0,'--light-spread':(config.lightSpread??65)+'%'};
   Object.assign(values,GalleryDesign.lightProfile(config));
   for(const [key,value]of Object.entries(values))this.root.style.setProperty(key,value);
   if(!this.track){this.track=document.createElement('div');this.track.className='gallery-track';this.root.replaceChildren(this.track);}
   this.layout();if(anchor&&this.items.some(item=>item.id===anchor))this.focus(anchor);this.callbacks.collection?.(this.items);
  }
  createSlot(item,index){const slot=document.createElement('article');slot.className='art-slot';slot.dataset.id=item.id;slot._src=item.src;
   const light=document.createElement('i');light.className='wall-light';light.setAttribute('aria-hidden','true');const button=document.createElement('button');button.className='art-picture';button.dataset.art=item.id;button.type='button';
   const img=document.createElement('img');if(index<2)img.src=this.preview(item);else img.dataset.src=this.preview(item);img.loading=index<2?'eager':'lazy';img.decoding='async';img.draggable=false;
   img.onerror=()=>{if(img.src!==new URL(item.src,location.href).href){img.src=item.src;return;}button.classList.add('image-error');button.title='图片无法读取，请在后台替换';};button.append(img);this.imageObserver.observe(img);
   const caption=document.createElement('div');caption.className='art-caption';caption.append(document.createElement('b'),document.createElement('small'));slot.append(light,button,caption);return slot;
  }
  renderVisible(){if(!this.track||!this.positions||!this.nodes)return;const left=this.root.scrollLeft-this.root.clientWidth,right=this.root.scrollLeft+this.root.clientWidth*2;
   const visible=this.items.length>120?this.positions.filter(p=>p.x+p.w>=left&&p.x<=right):this.positions,keep=new Set(visible.map(p=>p.id)),children=[];
   for(const [id,node]of this.nodes)if(!keep.has(id)){this.imageObserver.unobserve(node.querySelector('img'));this.nodes.delete(id);}
   for(const p of visible){const item=this.items[p.index];let node=this.nodes.get(item.id);if(!node||node._src!==item.src){if(node)this.imageObserver.unobserve(node.querySelector('img'));node=this.createSlot(item,p.index);this.nodes.set(item.id,node);}
    node.style.cssText=`position:absolute;left:${p.x}px;top:${p.y}px;width:${p.w}px;height:${p.h}px`;
    const button=node.querySelector('.art-picture');button.classList.toggle('selected',this.selected===item.id&&!this.callbacks.viewer);button.dataset.frame=item.frame&&item.frame!=='inherit'?item.frame:this.config.frame;button.dataset.mat=this.config.mat||'none';
    node.style.setProperty('--frame-w',(item.frameWidth||(this.config.frameWidth??8))*this.zoom+'px');node.style.setProperty('--frame-d',(this.config.frameDepth??6)*this.zoom+'px');node.style.setProperty('--mat-w',(item.matWidth||(this.config.matWidth??18))*this.zoom+'px');node.style.setProperty('--glass',(this.config.glass||0)/100);
    button.setAttribute('aria-label','查看作品：'+item.title);button.querySelector('img').alt=item.title;node.querySelector('.art-caption b').textContent=String(p.index+1).padStart(2,'0')+'  '+item.title;node.querySelector('.art-caption b').title=item.title;node.querySelector('.art-caption small').textContent=this.description(item);children.push(node);
   }
   for(const section of this.layoutData.sections){if(section.x<left-300||section.x>right)continue;const marker=document.createElement('aside');marker.className='gallery-section-marker';marker.style.left=section.x+'px';const title=document.createElement('b'),description=document.createElement('p');title.textContent=section.title;description.textContent=section.description;marker.append(title,description);children.push(marker);}
   if(!this.items.length){const empty=document.createElement('div');empty.className='wall-empty';empty.innerHTML='<span>YOUR EXHIBITION STARTS HERE</span><h2>让每一件作品，拥有自己的位置。</h2><p>添加作品后，展墙会自动延长。<br>保留原图比例，支持多种排布。</p>';children.push(empty);}
   this.track.replaceChildren(...children);this.scheduleLight();
  }
  scheduleLight(){if(this.lightFrame)return;this.lightFrame=requestAnimationFrame(()=>{this.lightFrame=0;if(this.root.isConnected)this.paintLight();});}
  paintLight(){if(!this.config||!this.positions)return;const root=this.root,w=root.clientWidth,h=root.clientHeight;if(!w||!h)return;
   if(!this.lightCanvas){this.lightCanvas=document.createElement('canvas');this.lightCanvas.className='gallery-light-field';this.lightCanvas.setAttribute('aria-hidden','true');root.prepend(this.lightCanvas);root.classList.add('has-light-field');}
   const canvas=this.lightCanvas,scale=Math.min(.25,480/w,270/h),width=Math.max(1,Math.ceil(w*scale)),height=Math.max(1,Math.ceil(h*scale));canvas.width=width;canvas.height=height;canvas.style.height=h+'px';canvas.style.marginBottom=-h+'px';
   const context=canvas.getContext('2d',{alpha:false});if(!context)return;
   const all=GalleryDesign.lightSources(this.positions,this.config,h),left=root.scrollLeft,sources=all.filter(s=>s.x+s.rx*8>=left&&s.x-s.rx*8<=left+w),rgb=GalleryDesign.lightProfile(this.config)['--light-rgb'].split(' ').map(Number),linear=rgb.map(v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);}),pixels=context.createImageData(width,height),data=pixels.data;
   const energyField=new Float32Array(width*height);
   for(const s of sources){for(let y=Math.max(0,Math.floor((s.y-s.ry*8)*scale));y<Math.min(height,Math.ceil((s.y+s.ry*8)*scale));y++){const py=(y+.5)/scale,dy=(py-s.y)/s.ry,cx=s.x+(py-s.y)*s.tilt,core=Math.exp(-.5*dy*dy),bounce=s.bounce*Math.exp(-.125*dy*dy),start=Math.max(0,Math.floor((cx-s.rx*8-left)*scale)),end=Math.min(width,Math.ceil((cx+s.rx*8-left)*scale));for(let x=start;x<end;x++){const dx=(left+(x+.5)/scale-cx)/s.rx;energyField[y*width+x]+=s.power*(core*Math.exp(-.5*dx*dx)+bounce*Math.exp(-.125*dx*dx));}}}
   if(this.lightLutKey!==rgb.join(' ')){this.lightLutKey=rgb.join(' ');this.lightLut=linear.map(channel=>Uint8Array.from({length:8193},(_,i)=>Math.round(GalleryDesign.expose(i/2048*channel)*255)));}
   for(let p=0;p<energyField.length;p++){const exposure=Math.min(8192,Math.round(energyField[p]*2048)),i=p*4;for(let c=0;c<3;c++)data[i+c]=this.lightLut[c][exposure];data[i+3]=255;}
   context.putImageData(pixels,0,0);
   for(const p of this.positions){const node=this.nodes.get(p.id);if(!node)continue;const x=Math.max(0,Math.min(width-1,(p.x+p.w/2-left)*scale)),y=Math.max(0,Math.min(height-1,(p.y+p.h*.2)*scale)),x0=Math.floor(x),y0=Math.floor(y),x1=Math.min(width-1,x0+1),y1=Math.min(height-1,y0+1),fx=x-x0,fy=y-y0,energy=(energyField[y0*width+x0]*(1-fx)+energyField[y0*width+x1]*fx)*(1-fy)+(energyField[y1*width+x0]*(1-fx)+energyField[y1*width+x1]*fx)*fy;node.style.setProperty('--light-surface',Math.min(.075,(1-Math.exp(-energy*2))*.13));}
  }
  viewBounds(){const inset=this.viewInsets||{left:0,right:0,top:0,bottom:0};return {...inset,width:Math.max(80,this.root.clientWidth-inset.left-inset.right),height:Math.max(80,this.root.clientHeight-inset.top-inset.bottom)};}
  layout(){if(!this.config||!this.track)return;const v=this.viewBounds();this.root.classList.toggle('is-compact',v.height<360);this.root.dataset.arrangement=this.config.arrangement||'single';this.root.style.setProperty('--viewport-height',this.root.clientHeight+'px');this.layoutData=GalleryLayout.calculate(this.items,this.config,v.width,v.height,this.zoom);this.layoutData.positions.forEach(p=>{p.x+=v.left;p.y+=v.top;});this.layoutData.sections.forEach(s=>s.x+=v.left);this.layoutData.width+=v.left+v.right;this.positions=this.layoutData.positions;this.track.style.cssText=`display:block;position:relative;padding:0;width:${this.layoutData.width}px;height:100%;min-width:100%`;this.renderVisible();this.notify();}
  setZoom(value){const anchor=this.items[this.index()]?.id;this.zoom=Math.max(this.callbacks.viewer ? .0001 : 1,Math.min(1.5,Number(value)||1));this.root.classList.toggle('is-fit-all',this.zoom<.25);this.layout();if(anchor)this.focus(anchor);this.callbacks.zoom?.(this.zoom);}
  fitAll(){if(!this.config||!this.items.length)return;const data=GalleryLayout.calculate(this.items,this.config,this.root.clientWidth,this.root.clientHeight,1),content=Math.max(1,data.width-data.inset*2);this.setZoom(Math.min(1,(this.root.clientWidth-data.inset*2-8)/content));this.root.scrollLeft=0;this.notify();}
  index(){if(!this.positions?.length)return -1;if(this.focusedIndex!==undefined&&this.focusedIndex<this.items.length&&Math.abs(this.root.scrollLeft-this.focusedScroll)<2)return this.focusedIndex;const v=this.viewBounds(),center=this.root.scrollLeft+v.left+v.width/2;let best=0,distance=Infinity;for(const p of this.positions){const d=Math.abs(p.x+p.w/2-center);if(d<distance){best=p.index;distance=d;}}return best;}
  focusIndex(index,smooth=false){if(!this.items.length||!this.positions?.length)return;index=Math.max(0,Math.min(this.items.length-1,index));const p=this.positions[index],v=this.viewBounds();this.focusedIndex=index;this.focusedScroll=Math.max(0,Math.min(this.root.scrollWidth-this.root.clientWidth,p.x+p.w/2-v.left-v.width/2));this.root.scrollTo({left:this.focusedScroll,behavior:smooth&&!matchMedia('(prefers-reduced-motion: reduce)').matches?'smooth':'instant'});this.renderVisible();this.notify();}
 }
 globalThis.GalleryWall=Wall;
})();
