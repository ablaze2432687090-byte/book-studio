/* Shared by authoring and the offline viewer: labels, limits and scene defaults. */
(() => {
 const walls={charcoal:['炭黑展墙','#303033'],white:['纯白展墙','#e4e2dd'],warm:['暖灰展墙','#9a8d7e'],concrete:['清水混凝土','#77787a'],navy:['深蓝展墙','#202c3b'],ivory:['象牙白灰泥','#e7dfcd'],plaster:['手工灰泥','#c6bdb0'],linen:['亚麻布艺','#b2a58b'],oak:['浅橡木墙','#ac8c60'],walnut:['深胡桃木墙','#514033'],marble:['浅色大理石','#d5d2c9'],slate:['深色石板','#343c40'],burgundy:['酒红展墙','#4c202b'],forest:['森林绿展墙','#243a30']};
 const floors={legacy:'跟随原有展厅',dark:'哑光炭黑',oak:'浅橡木地板',walnut:'深胡桃木地板',concrete:'水泥地面',stone:'浅色石材',marble:'大理石地面',terrazzo:'水磨石',none:'隐藏地面'};
 const frames={black:'黑色厚框',thin:'极细黑框',white:'白色画框',wood:'自然木框',oak:'浅橡木框',walnut:'胡桃木框',brass:'黄铜金属框',silver:'拉丝银框',bronze:'古铜金属框',shadowbox:'悬浮盒式框',canvas:'画布包边',acrylic:'透明亚克力框',none:'无边框'};
 const lighting={spot:'独立作品射灯',soft:'柔和漫射',track:'轨道射灯',wash:'均匀洗墙',window:'侧窗自然光',museum:'博物馆聚光',warm:'暖色氛围',cool:'冷色影棚',none:'关闭照明'};
 const defaults={floor:'legacy',floorShine:20,wallTexture:30,ambient:100,frameWidth:8,frameDepth:6,matWidth:18,glass:0,lightTemperature:5500,lightDirection:0,lightSpread:65,arrangement:'single',sectionGap:80,intro:false,subtitle:'',introduction:'',curator:'',sections:[],snap:10};
 const numeric={floorShine:[0,80],wallTexture:[0,100],ambient:[35,150],frameWidth:[0,40],frameDepth:[0,25],matWidth:[0,70],glass:[0,65],lightTemperature:[2700,7500],lightDirection:[-60,60],lightSpread:[20,100],sectionGap:[30,240],snap:[1,40]};
 function temperature(value){const amount=Math.max(0,Math.min(1,(value-2700)/4800));return [255-amount*44,190+amount*42,125+amount*130].map(Math.round).join(' ');}
 globalThis.GalleryDesign={walls,floors,frames,lighting,defaults,numeric,temperature};
})();
