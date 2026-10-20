import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const origin=process.env.BOOK_STUDIO_TEST_ORIGIN||'http://127.0.0.1:4187';
if(!/^http:\/\/127\.0\.0\.1:4187$/.test(origin))throw Error('UI writes are restricted to the isolated test server on 4187');
const directory='work/bilingual-qa';await mkdir(directory,{recursive:true});
const browser=await chromium.launch({channel:process.env.BOOK_STUDIO_BROWSER||'msedge',headless:true});
const findings=[],missing=new Set(),errors=[];
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}});page.on('pageerror',error=>errors.push(error.message));
 await page.goto(origin+'/projects.html');await page.waitForFunction(()=>window.StudioApp&&window.StudioI18n);
 await page.evaluate(()=>StudioApp.open());await page.locator('[data-setting=language]').selectOption('en');await page.waitForFunction(()=>document.documentElement.lang==='en');
 assert.equal(await page.locator('#studioSettingsTitle').textContent(),'Settings');
 await page.locator('#studioSettingsBack').click();
 // A user title exactly matching a UI label must never be translated.
 await page.evaluate(()=>{const title=document.querySelector('.album-title-row h2');if(title)title.textContent='设置';});
 await page.waitForTimeout(50);assert.equal(await page.locator('.album-title-row h2').first().textContent(),'设置');
 const gallery=await page.request.post(origin+'/api/galleries',{data:{title:'设置'}});assert(gallery.ok());let g=await gallery.json();
 const image=await page.request.get(origin+'/media/synthetic-1.png'),upload=await page.request.post(origin+'/api/gallery-images',{data:await image.body(),headers:{'Content-Type':'image/png'}});assert(upload.ok());const photo=await upload.json();
 g=await(await page.request.put(origin+'/api/galleries/'+g.id,{data:{...g,artworks:Array.from({length:3},(_,i)=>({id:'visual-'+i,title:i===0?'设置':'Visual study '+i,src:photo.src,width:900,height:1200}))}})).json();
 for(const [name,url]of [['projects','/projects.html'],['book','/?id=sample-book'],['gallery','/gallery.html?id='+g.id],['library','/library.html']]){
  await page.goto(origin+url);await page.waitForFunction(()=>document.documentElement.lang==='en');await page.waitForTimeout(600);
  for(const width of [860,1024,1280,1440,1920]){await page.setViewportSize({width,height:960});await page.waitForTimeout(150);const state=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+2,missing:StudioI18n.missing()}));state.missing.forEach(s=>missing.add(s));findings.push({name,width,overflow:state.overflow});if(width===1440)await page.screenshot({path:`${directory}/${name}-en.png`});}
  if(name==='book'){
   for(const tab of await page.locator('[data-settings-tab]').evaluateAll(nodes=>nodes.map(n=>n.dataset.settingsTab))){await page.locator(`[data-settings-tab=${tab}]`).click();await page.waitForTimeout(60);(await page.evaluate(()=>StudioI18n.missing())).forEach(s=>missing.add(s));}
   await page.evaluate(()=>DevicePreview.open('sample-book'));await page.locator('#devicePreviewDialog[open]').waitFor();await page.waitForTimeout(200);(await page.evaluate(()=>StudioI18n.missing())).forEach(s=>missing.add(s));for(const device of ['phone','tablet']){await page.locator(`button[data-device=${device}]`).click();await page.locator('[data-orientation=landscape]').click();await page.waitForTimeout(60);(await page.evaluate(()=>StudioI18n.missing())).forEach(s=>missing.add(s));}await page.keyboard.press('Escape');
   await page.locator('#projectRecovery').click();await page.waitForTimeout(120);(await page.evaluate(()=>StudioI18n.missing())).forEach(s=>missing.add(s));await page.keyboard.press('Escape');
  }
  if(name==='gallery'){await page.locator('.gallery-scene-details').evaluateAll(nodes=>nodes.forEach(n=>n.open=true));await page.waitForTimeout(60);(await page.evaluate(()=>StudioI18n.missing())).forEach(s=>missing.add(s));await page.locator('#gallerySelectAll').check();await page.waitForTimeout(100);const clipped=await page.locator('.gallery-batch button').evaluateAll(nodes=>nodes.filter(n=>n.getClientRects().length&&n.scrollWidth>n.clientWidth+2).map(n=>n.textContent));assert.deepEqual(clipped,[],'Batch button labels must fit');await page.screenshot({path:`${directory}/gallery-selected-en.png`});await page.locator('#gallerySelectAll').uncheck();}
  await page.evaluate(()=>StudioApp.open());await page.waitForSelector('#studioSettings[open]');
  for(const tab of ['general','data','ai','help','about']){await page.locator(`[data-tab=${tab}]`).click();await page.waitForTimeout(120);(await page.evaluate(()=>StudioI18n.missing())).forEach(s=>missing.add(s));}
  await page.locator('[data-tab=general]').click();await page.locator('[data-setting=language]').selectOption('zh-CN');await page.waitForFunction(()=>document.documentElement.lang==='zh-CN');assert.equal(await page.locator('#studioSettingsTitle').textContent(),'设置');await page.locator('[data-setting=language]').selectOption('en');await page.waitForFunction(()=>document.documentElement.lang==='en');await page.locator('#studioSettingsBack').click();
 }
 await page.goto(origin+'/projects.html');await page.locator('#createAlbum').click();await page.locator('[data-new-project=book]').click();await page.locator('[data-mode=prompt]').click();await page.waitForTimeout(300);(await page.evaluate(()=>StudioI18n.missing())).forEach(s=>missing.add(s));await page.screenshot({path:`directory/create-en.png`.replace('directory',directory)});
 await page.locator('.create-more').evaluate(node=>node.open=true);
 for(const id of ['briefTheme','briefStyle','briefPalette','briefBackground','briefType','briefLanguage','briefCopy','briefNotes','briefOutput']){if(!await page.locator('#'+id).count())continue;for(const value of await page.locator('#'+id+' option').evaluateAll(nodes=>nodes.map(n=>n.value))){await page.locator('#'+id).selectOption(value);await page.waitForTimeout(15);(await page.evaluate(()=>StudioI18n.missing())).forEach(s=>missing.add(s));}}
 await page.evaluate(()=>{const node=document.createElement('div');node.innerHTML='<select id="localeValueTest"><option>恢复默认</option></select><p data-user-content>设置</p>';document.body.append(node);});await page.waitForTimeout(100);assert.equal(await page.locator('#localeValueTest').inputValue(),'恢复默认');assert.equal(await page.locator('[data-user-content]').last().textContent(),'设置');
 const report={ok:errors.length===0&&!findings.some(f=>f.overflow)&&missing.size===0,errors,findings,missing:[...missing].sort()};await writeFile(`${directory}/report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 if(!report.ok)process.exitCode=1;
}finally{await browser.close();}
