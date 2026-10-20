/* Shared by authoring and the offline viewer: labels, limits and scene defaults. */
(() => {
 const walls={charcoal:['炭黑展墙','#303033'],white:['纯白展墙','#e4e2dd'],warm:['暖灰展墙','#9a8d7e'],concrete:['清水混凝土','#77787a'],navy:['深蓝展墙','#202c3b'],ivory:['象牙白灰泥','#e7dfcd'],plaster:['手工灰泥','#c6bdb0'],linen:['亚麻布艺','#b2a58b'],oak:['浅橡木墙','#ac8c60'],walnut:['深胡桃木墙','#514033'],marble:['浅色大理石','#d5d2c9'],slate:['深色石板','#343c40'],burgundy:['酒红展墙','#4c202b'],forest:['森林绿展墙','#243a30']};
 const floors={legacy:'跟随原有展厅',dark:'哑光炭黑',oak:'浅橡木地板',walnut:'深胡桃木地板',concrete:'水泥地面',stone:'浅色石材',marble:'大理石地面',terrazzo:'水磨石',none:'隐藏地面'};
 const frames={black:'黑色厚框',thin:'极细黑框',white:'白色画框',wood:'自然木框',oak:'浅橡木框',walnut:'胡桃木框',brass:'黄铜金属框',silver:'拉丝银框',bronze:'古铜金属框',shadowbox:'悬浮盒式框',canvas:'画布包边',acrylic:'透明亚克力框',none:'无边框'};
 const lighting={spot:'独立作品射灯',soft:'柔和漫射',track:'轨道射灯',wash:'均匀洗墙',window:'侧窗自然光',museum:'博物馆聚光',warm:'暖色氛围',cool:'冷色影棚',none:'关闭照明'};
 const defaults={floor:'legacy',floorShine:20,wallTexture:30,ambient:100,frameWidth:8,frameDepth:6,matWidth:18,glass:0,lightTemperature:5500,lightDirection:0,lightSpread:65,arrangement:'single',sectionGap:80,intro:false,subtitle:'',introduction:'',curator:'',sections:[],snap:10};
 const numeric={floorShine:[0,80],wallTexture:[0,100],ambient:[35,150],frameWidth:[0,40],frameDepth:[0,25],matWidth:[0,70],glass:[0,65],lightTemperature:[2700,7500],lightDirection:[-60,60],lightSpread:[20,100],sectionGap:[30,240],snap:[1,40]};
 // Display-referred tint anchors: neutral gallery whites should not look blue.
 function temperature(value){const anchors=[[2700,255,190,125],[4000,255,224,190],[5500,255,245,232],[6500,244,248,255],[7500,225,237,255]],kelvin=Math.max(2700,Math.min(7500,Number(value)||5500));let i=1;while(i<anchors.length-1&&kelvin>anchors[i][0])i++;const a=anchors[i-1],b=anchors[i],t=(kelvin-a[0])/(b[0]-a[0]);return a.slice(1).map((v,j)=>Math.round(v+(b[j+1]-v)*t)).join(' ');}
 // Bounded, shared by the editor and offline renderer; no saved-schema changes.
 function lightProfile(config={}){const mode=lighting[config.lighting]?config.lighting:'spot',power=Math.max(0,Math.min(100,Number(config.light??65)))/100,spread=Math.max(20,Math.min(100,Number(config.lightSpread??65))),direction=Math.max(-60,Math.min(60,Number(config.lightDirection)||0)),gains={spot:1,track:.94,museum:1.12,soft:.42,wash:.62,window:.72,warm:.6,cool:.62,none:0},focused=['spot','track','museum'].includes(mode),gain=gains[mode],temperatureShift=mode==='warm'?-1800:mode==='cool'?1000:0;
  return {'--light-power':power,'--light-wall':power*gain,'--light-surface':power*gain*(focused?.075:.045),'--light-beam':focused?power*.09:0,'--light-rgb':temperature(Number(config.lightTemperature??5500)+temperatureShift),'--light-center':(50+direction*.32)+'%','--light-footprint':(mode==='museum'?32+spread*.23:39+spread*.35)+'%','--light-pool-width':(mode==='museum'?108+spread*.9:125+spread*1.15)+'%','--light-cast-x':((mode==='window'?8:0)-direction*.1)+'px','--light-aim':direction*.12+'deg','--light-fixture-x':(-direction*.32)+'%'};
 }
 // Sum irradiance in linear light before one exposure curve. Gaussian tails
 // have no per-artwork rectangle, so neighbouring pools meet without seams.
 function lightSources(positions,config,height){const mode=config.lighting||'spot',power=Math.max(0,Math.min(1,Number(config.light??65)/100)),spread=Math.max(.2,Math.min(1,Number(config.lightSpread??65)/100)),direction=(Number(config.lightDirection)||0)/60;
  if(mode==='none'||!power)return [];
  const focused=['spot','track','museum'].includes(mode),gain={spot:1,track:.94,museum:1.06,soft:.4,wash:.55,window:.65,warm:.5,cool:.5}[mode]??1;
  return positions.map(p=>{const broad=!focused,rx=Math.max(.4,p.w*(broad?.65+spread*.75:mode==='museum'?.2+spread*.22:.26+spread*.25)),ry=Math.max(.4,p.h*(broad?.95:mode==='museum'?.45:.5));return {x:p.x+p.w*(.5+direction*.22)+(mode==='window'?-p.w*.3:0),y:p.y+p.h*(focused?.12:.04),rx,ry,power:power*gain*(focused?.12:.08),bounce:focused?.045:.12,tilt:mode==='window'?-.32:direction*.13};});
 }
 function irradiance(x,y,sources){let energy=0;for(const s of sources){const dy=(y-s.y)/s.ry,dx=(x-s.x-(y-s.y)*s.tilt)/s.rx;energy+=s.power*(Math.exp(-.5*(dx*dx+dy*dy))+s.bounce*Math.exp(-.125*(dx*dx+dy*dy)));}return energy;}
 function expose(energy){const linear=1-Math.exp(-Math.max(0,energy));return linear<=.0031308?linear*12.92:1.055*Math.pow(linear,1/2.4)-.055;}
 globalThis.GalleryDesign={walls,floors,frames,lighting,defaults,numeric,temperature,lightProfile,lightSources,irradiance,expose};
})();
