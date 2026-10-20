/* Shared, non-destructive surfaces. No renderer dependency, timers or canvas loops. */
(() => {
  const materials = {
    none:'无质感 · 原图呈现', matte:'哑光艺术纸', fine:'细纹美术纸', linen:'亚麻纹纸',
    pearl:'珠光纸 · 银白微闪', holographic:'镭射纸 · 彩虹反光', kraft:'牛皮纸 · 暖棕纤维',
    recycled:'再生纸 · 纤维杂点', cotton:'棉质艺术纸 · 柔软细纤维', coated:'铜版纸 · 柔亮光泽',
    photo:'高光相纸 · 镜面反光', leather:'皮革 · 不规则皮纹', suede:'绒面 · 低光泽',
    grid:'压纹纸 · 细格', ribbed:'压纹纸 · 竖纹', hammered:'压纹纸 · 锤纹'
  };
  const scenes = {
    charcoal:['炭黑影棚','radial-gradient(ellipse at 50% 32%,#303034,#101012 75%)'],
    gallery:['白色展厅','radial-gradient(ellipse at 50% 28%,#fff,#dededa 80%)'],
    burgundy:['深红展台','radial-gradient(ellipse at 50% 28%,#6a2933,#351016 80%)'],
    warm:['暖灰桌面','radial-gradient(ellipse at 50% 28%,#b5aea3,#777066 80%)'],
    concrete:['深灰墙面','radial-gradient(ellipse at 50% 28%,#ffffff18,transparent 70%),repeating-linear-gradient(115deg,#303133 0 2px,#28292b 2px 6px)'],
    midnight:['午夜蓝','radial-gradient(ellipse at 50% 30%,#263c56,#0d1829 80%)'],
    forest:['森林绿','radial-gradient(ellipse at 50% 30%,#385345,#14231d 80%)'],
    graphite:['石墨灰','radial-gradient(ellipse at 50% 30%,#505157,#232429 80%)'],
    ivory:['暖白影棚','radial-gradient(ellipse at 50% 30%,#fff9ed,#d7cabb 80%)'],
    'dark-wood':['深色木桌','radial-gradient(ellipse at 50% 25%,#ffffff12,transparent 75%),repeating-linear-gradient(2deg,#fff1 0 1px,transparent 1px 8px,#0002 8px 10px,transparent 10px 32px),repeating-linear-gradient(0deg,#30231e 0 90px,#171210 91px 93px,#49342a 94px 185px)'],
    'light-wood':['浅色木桌','radial-gradient(ellipse at 50% 25%,#ffffff35,transparent 75%),repeating-linear-gradient(2deg,#6a44261c 0 1px,transparent 1px 10px,#fff2 10px 12px,transparent 12px 29px),repeating-linear-gradient(0deg,#ccb48d 0 110px,#aa8c6625 111px 113px,#d9c3a1 114px 220px)'],
    marble:['浅色石材','radial-gradient(ellipse at 36% 40%,#fff7,transparent 60%),repeating-linear-gradient(128deg,transparent 0 90px,#9b9ba02b 92px,transparent 95px 110px,#fff9 114px,transparent 119px 240px),linear-gradient(120deg,#e6e5e2,#c8c8c6)'],
    'dark-marble':['深色石材','repeating-linear-gradient(126deg,transparent 0 140px,#b1aea329 142px,transparent 147px 155px,#88847c18 159px,transparent 163px 320px),linear-gradient(130deg,#303033,#151518)'],
    'leather-desk':['皮革桌垫','radial-gradient(circle,#fff1 .5px,transparent 1px) 0 0/4px 5px,linear-gradient(135deg,#503b32,#251d19)'],
    studio:['暖色工作室','radial-gradient(ellipse at 30% 15%,#f3d5a752,transparent 60%),linear-gradient(145deg,#6c5a4b,#2c2826)'],
    custom:['自定义背景图','']
  };
  const lights = {none:'关闭',soft:'柔光',side:'侧光',gallery:'展厅', 'window-left':'左窗光','window-right':'右窗光',top:'顶部柔光',warm:'暖色台灯',cool:'冷色展厅',spot:'聚光灯',rim:'轮廓光'};
  const textureRoot=new URL('textures/',document.currentScript.src);
  const texture=(name,role='color')=>`url("${new URL(name+'-'+role+'.webp',textureRoot).href}")`;
  const sceneTextures={'dark-wood':'dark-wood','light-wood':'light-wood',marble:'marble','dark-marble':'dark-marble','leather-desk':'leather'};
  for(const [scene,name] of Object.entries(sceneTextures)){
    const shade=scene==='dark-marble'?'#08080be0':scene==='leather-desk'?'#160d0740':scene==='dark-wood'?'#10090238':'#ffffff10';
    scenes[scene][1]=`radial-gradient(ellipse at 38% 28%,#ffffff12,transparent 75%),linear-gradient(${shade},${shade}),${texture(name)}`;
  }
  const defaults = {materialScope:'all',gloss:45,lightDirection:0,lightTemperature:5500,shadowSoftness:50};
  const clamp=(v,d,min,max)=>Math.max(min,Math.min(max,Number.isFinite(Number(v))?Number(v):d));
  const states=new WeakMap();
  const lightMaps=new Map();
  function lightTint(value,mode){const points=[[2700,255,190,125],[4000,255,224,190],[5500,255,245,232],[6500,244,248,255],[7500,225,237,255]],kelvin=clamp(value+(mode==='warm'?-1500:mode==='cool'?900:0),5500,2700,7500);let i=1;while(i<points.length-1&&kelvin>points[i][0])i++;const a=points[i-1],b=points[i],t=(kelvin-a[0])/(b[0]-a[0]);return a.slice(1).map((v,j)=>Math.round(v+(b[j+1]-v)*t));}
  function lightSources(mode,direction=0){const shift=direction/260,source=(x,y,rx,ry,power)=>({x:x+shift,y,rx,ry,power});
    if(mode==='none')return [];
    if(mode==='rim')return [source(.04,.42,.3,.65,.11),source(.96,.2,.3,.6,.1)];
    if(mode==='gallery'||mode==='cool')return [source(.28,.04,.4,.65,.10),source(.72,.04,.4,.65,.10)];
    if(mode==='spot')return [source(.5,.18,.31,.53,.19)];
    if(mode==='side'||mode==='window-left')return [source(-.05,.1,.57,.84,.16)];
    if(mode==='window-right')return [source(1.05,.1,.57,.84,.16)];
    if(mode==='top')return [source(.5,-.12,.85,.67,.16)];
    if(mode==='warm')return [source(.22,.08,.58,.73,.15)];
    return [source(.5,.18,.8,.8,.12)];
  }
  function lightEnergy(x,y,sources){return sources.reduce((sum,s)=>sum+s.power*Math.exp(-.5*(((x-s.x)/s.rx)**2+((y-s.y)/s.ry)**2)),0);}
  function lightMap(mode,direction,rgb,intensity){const key=[mode,direction,...rgb,intensity].join(':');if(lightMaps.has(key))return lightMaps.get(key);
    const canvas=document.createElement('canvas');canvas.width=96;canvas.height=64;const context=canvas.getContext('2d');if(!context)return '';
    const pixels=context.createImageData(96,64),sources=lightSources(mode,direction),linear=rgb.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});
    for(let y=0;y<64;y++)for(let x=0;x<96;x++){const e=lightEnergy((x+.5)/96,(y+.5)/64,sources)*intensity*.3,i=(y*96+x)*4;for(let c=0;c<3;c++){const v=1-Math.exp(-e*linear[c]);pixels.data[i+c]=Math.round(255*(v<=.0031308?v*12.92:1.055*v**(1/2.4)-.055));}pixels.data[i+3]=255;}
    context.putImageData(pixels,0,0);const url='url("'+canvas.toDataURL()+'")';if(lightMaps.size>=24)lightMaps.delete(lightMaps.keys().next().value);lightMaps.set(key,url);return url;
  }
  const grain='url("data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".46 .62" numOctaves="3" seed="8" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" filter="url(#n)" opacity=".65"/></svg>')+'")';
  const leather='url("data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".12 .18" numOctaves="3" seed="17" stitchTiles="stitch"/><feDiffuseLighting surfaceScale="2.2" diffuseConstant="1" lighting-color="white"><feDistantLight azimuth="225" elevation="38"/></feDiffuseLighting></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>')+'")';
  function surface(leaf,cover=false) {
    leaf.classList.add('bs-surface');leaf.dataset.bsCover=String(cover);
    for(const kind of ['material','relief','gloss','light']){
      if(!leaf.querySelector(':scope > .bs-'+kind)){
        const layer=document.createElement('i');layer.className='bs-layer bs-'+kind;layer.setAttribute('aria-hidden','true');leaf.appendChild(layer);
      }
    }
  }
  function apply(host,book,album,thumbnail=false){
    const a={...defaults,...album};
    const material=Object.hasOwn(materials,a.material)?a.material:'none';
    const direction=clamp(a.lightDirection,0,-90,90);
    const light=Object.hasOwn(lights,a.lighting)?a.lighting:'soft';
    const temperature=clamp(a.lightTemperature,5500,2700,7500);
    const rgb=lightTint(temperature,light);
    host.classList.add('bs-environment');host.classList.toggle('bs-thumbnail',thumbnail);
    book.classList.add('bs-effects');
    book.dataset.bsMaterial=material;
    host.dataset.bsLight=light;
    host.style.setProperty('--bs-light-rgb',rgb.join(' '));
    host.style.setProperty('--bs-light',light==='none'?'0':String(clamp(a.lightIntensity,50,0,100)/100));
    const map=lightMap(light,direction,rgb,light==='none'?0:clamp(a.lightIntensity,50,0,100)/100);
    if(map){host.style.setProperty('--bs-env-field',map);host.classList.add('bs-continuous-light');}
    host.style.setProperty('--bs-light-angle',`${118+direction}deg`);
    host.style.setProperty('--bs-light-x',`${50+direction*.35}%`);
    host.style.setProperty('--bs-shadow-blur',`${10+clamp(a.shadowSoftness,50,0,100)*.4}px`);
    host.style.setProperty('--bs-shadow-x',`${light==='none'?0:-direction*.12}px`);
    book.style.setProperty('--bs-texture',String(clamp(a.texture,0,0,24)/24));
    book.style.setProperty('--bs-grain',grain);book.style.setProperty('--bs-leather',leather);
    book.style.setProperty('--bs-paper-map',texture('paper','detail'));
    book.style.setProperty('--bs-leather-map',texture('leather','detail'));
    book.style.setProperty('--bs-fabric-map',texture('fabric','detail'));
    book.style.setProperty('--bs-gloss',String(clamp(a.gloss,45,0,100)/100));
    book.style.setProperty('--bs-mx','50%');book.style.setProperty('--bs-my','35%');
    book.style.setProperty('--bs-tilt','118deg');
    book.querySelectorAll('.bs-surface').forEach(leaf=>{
      const cover=leaf.dataset.bsCover==='true';
      leaf.dataset.bsMaterial=(!cover&&a.materialScope==='cover')||(cover&&a.materialScope==='pages')?'none':material;
    });
    const scene=scenes[a.scene]||scenes.charcoal;
    if(thumbnail){
      if(a.scene!=='custom')host.style.setProperty('--book-scene',scene[1]);
      book.style.setProperty('--book-shadow-blur',`${6+clamp(a.shadowSoftness,50,0,100)*.16}px`);
    }else if(a.scene!=='custom'){
      host.style.backgroundImage=scene[1];
      host.style.backgroundSize=sceneTextures[a.scene]?'cover':'auto';
      host.style.backgroundPosition='center';
      host.style.backgroundColor=['gallery','ivory','light-wood','marble'].includes(a.scene)?'#dededa':'#101012';
      host.classList.toggle('bs-light-scene',['gallery','ivory','light-wood','marble'].includes(a.scene));
    }else{
      host.classList.remove('bs-light-scene');
    }
    const prior=states.get(host);
    states.set(host,{book,reflective:['pearl','holographic','coated','photo'].includes(material),thumbnail});
    if(!prior&&!thumbnail){
      let frame=0,point=null;
      host.addEventListener('pointermove',event=>{
        const s=states.get(host);
        if(!s?.reflective||!matchMedia('(hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)').matches||document.body.classList.contains('low-performance')||event.buttons)return;
        point={x:event.clientX,y:event.clientY};
        if(!frame)frame=requestAnimationFrame(()=>{
          frame=0;const current=states.get(host),r=host.getBoundingClientRect();
          if(!current?.book.isConnected||!point)return;
          const x=clamp((point.x-r.left)/r.width, .5,0,1),y=clamp((point.y-r.top)/r.height,.35,0,1);
          current.book.style.setProperty('--bs-mx',`${x*100}%`);current.book.style.setProperty('--bs-my',`${y*100}%`);
          current.book.style.setProperty('--bs-tilt',`${85+x*60}deg`);
        });
      },{passive:true});
      host.addEventListener('pointerleave',()=>{point=null;if(frame){cancelAnimationFrame(frame);frame=0;}const s=states.get(host);if(s){s.book.style.setProperty('--bs-mx','50%');s.book.style.setProperty('--bs-my','35%');s.book.style.setProperty('--bs-tilt','118deg');}},{passive:true});
    }
  }
  function setupControls(root=document){
    for(const input of root.querySelectorAll('.settings input[type="range"]')){
      const button=document.createElement('button');button.type='button';button.className='range-reset';button.dataset.resetRange=input.id;
      button.textContent='恢复默认';button.setAttribute('aria-label',`恢复${root.querySelector(`label[for="${input.id}"]`)?.textContent||input.id}默认值`);input.after(button);
    }
    const material=root.querySelector('#material');
    for(const [value,label] of Object.entries(materials))if(!material.querySelector(`option[value="${value}"]`))material.add(new Option(label,value));
    const scene=root.querySelector('#scene'),presets=root.querySelector('.scene-presets');
    for(const [value,[label,bg]] of Object.entries(scenes)){
      if(!scene.querySelector(`option[value="${value}"]`))scene.add(new Option(label,value));
      if(value!=='custom'&&!presets.querySelector(`[data-scene-select="${value}"]`)){
        const button=document.createElement('button');button.type='button';button.dataset.sceneSelect=value;
        const chip=document.createElement('i');chip.className='scene-chip';chip.style.background=bg;chip.style.backgroundSize='cover';chip.style.backgroundPosition='center';
        const text=document.createElement('span');text.textContent=label;button.append(chip,text);presets.appendChild(button);
      }
    }
    for(const [scene] of Object.entries(sceneTextures)){
      const chip=presets.querySelector(`[data-scene-select="${scene}"] .scene-chip`);
      if(chip){chip.style.background=scenes[scene][1];chip.style.backgroundSize='cover';chip.style.backgroundPosition='center';}
    }
    const light=root.querySelector('.light-presets');
    for(const [value,label] of Object.entries(lights))if(!light.querySelector(`[data-lighting="${value}"]`)){
      const button=document.createElement('button');button.type='button';button.dataset.lighting=value;button.textContent=label;light.appendChild(button);
    }
  }
  globalThis.BookPresentation={materials,scenes,lights,defaults,surface,apply,setupControls,lightSources,lightEnergy};
})();
