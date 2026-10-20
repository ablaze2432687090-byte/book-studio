/* Pure layout shared by the wall, minimap and image export. No project writes. */
(() => {
 function calculate(items,config,width,height,zoom=1){
  const arrangement=config.arrangement||'single',rows=arrangement==='double'?2:arrangement==='salon'?3:1;
  const compact=height<360,floorReserve=compact?50:110,available=Math.max(40,height-(compact?95:170)),base=Math.max(30,(height-(compact?80:145))*(config.artHeight||58)/100/rows),inset=Math.max(24,width*.2);
  const sizes=items.map(item=>{const ratio=Math.max(.08,Math.min(12,item.width/item.height));let h=base*(item.scale||100)/100,w=h*ratio;if(config.layout==='width'){w=base*.9*(item.scale||100)/100;h=w/ratio;}else if(config.layout==='original'){const factor=Math.max(.55,Math.min(1.25,Math.sqrt(item.width*item.height)/1800));w*=factor;h*=factor;}return{w,h};});
  const rowGap=compact&&rows>1?14:config.captions?74:22,tallest=sizes.reduce((max,s)=>Math.max(max,s.h),1),widest=sizes.reduce((max,s)=>Math.max(max,s.w),1),fit=Math.max(.05,Math.min(1,(available-Math.max(0,rows-1)*rowGap)/(tallest*rows),Math.max(80,width-70)/widest));
  const positions=[],sections=[];let x=inset,previousSection='',lastColumn=-1;
  for(let i=0;i<items.length;){const section=items[i].section||'';if(config.sectionDividers&&section!==previousSection){if(i)x+=(config.sectionGap||80)*zoom;const info=(config.sections||[]).find(s=>s.title===section);if(section)sections.push({x,title:section,description:info?.description||''});previousSection=section;}
   const group=[];for(let r=0;r<rows&&i+r<items.length;r++){if(r&&config.sectionDividers&&(items[i+r].section||'')!==section)break;group.push(i+r);}
   const columnW=Math.max(...group.map(index=>sizes[index].w*fit*zoom));
   const heights=group.map(index=>sizes[index].h*fit*zoom),blockHeight=heights.reduce((sum,h)=>sum+h,0)+Math.max(0,group.length-1)*rowGap*zoom;
   let y=config.align==='top'?(compact?30:70):config.align==='bottom'?height-floorReserve-25-blockHeight:(height-floorReserve-blockHeight)/2;
   for(let r=0;r<group.length;r++){const index=group[r],item=items[index],w=sizes[index].w*fit*zoom,h=heights[r];const px=x+(columnW-w)/2+(Number(item.offsetX)||0)*zoom,py=y+(Number(item.offsetY)||0)*zoom;positions[index]={x:Math.max(8,px),y:Math.max(10,Math.min(height-h-floorReserve,py)),w,h,index,id:item.id};y+=h+rowGap*zoom;}
   x+=columnW+(config.gap||100)*zoom;lastColumn=columnW;i+=group.length;
  }
  const right=positions.reduce((max,p)=>Math.max(max,p.x+p.w),0);
  const naturalRight=positions.reduce((max,p)=>Math.max(max,p.x+p.w-(Number(items[p.index].offsetX)||0)*zoom),0),shift=positions.length?Math.max(0,(width-naturalRight-inset)/2):0;
  if(shift){positions.forEach(p=>p.x+=shift);sections.forEach(s=>s.x+=shift);}
  return {positions,sections,width:Math.max(width,right+shift+inset),height,rows,inset};
 }
 globalThis.GalleryLayout={calculate};
})();
