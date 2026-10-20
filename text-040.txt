import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const origin='http://127.0.0.1:4187',directory='work/release-interactions';await mkdir(directory,{recursive:true});
const browser=await chromium.launch({channel:process.env.BOOK_STUDIO_BROWSER||'msedge',headless:true});
const results=[],errors=[];
try{
 const page=await browser.newPage({viewport:{width:860,height:640}});page.on('pageerror',error=>errors.push(error.message));
 await page.goto(origin+'/projects.html');await page.waitForFunction(()=>globalThis.StudioApp);
 for(const language of ['zh-CN','en']){
  await page.evaluate(()=>StudioApp.open());await page.locator('[data-setting=language]').selectOption(language);await page.waitForFunction(v=>document.documentElement.lang===v,language);
  for(const tab of ['general','data','ai','help','about']){
   await page.locator(`[data-tab=${tab}]`).click();await page.waitForTimeout(80);
   assert(await page.locator('#studioSettings').evaluate(n=>n.scrollWidth<=n.clientWidth));
   assert(await page.locator('.studio-settings-close').isVisible());
   if(['data','about'].includes(tab))await page.screenshot({path:directory+'/'+tab+'-'+language+'.png'});
   if(language==='en')assert.deepEqual(await page.evaluate(()=>StudioI18n.missing()),[]);
  }
  // Browser mode must never enable desktop-only operations after an async action.
  for(const id of ['studioDataLocation','studioBackupLocation','studioCheckUpdates','studioDiagnostics'])assert(await page.locator('#'+id).isDisabled());
  await page.keyboard.press('Escape');assert.equal(await page.locator('#studioSettings').evaluate(n=>n.open),false);
  await page.evaluate(()=>StudioApp.open());const bounds=await page.locator('#studioSettings').boundingBox();await page.mouse.click(Math.max(2,bounds.x-10),Math.max(2,bounds.y-10));assert.equal(await page.locator('#studioSettings').evaluate(n=>n.open),false);
  await page.locator('#createAlbum').click();await page.locator('#projectTypeDialog[open]').waitFor();await page.keyboard.press('Escape');assert.equal(await page.locator('#projectTypeDialog').evaluate(n=>n.open),false);
  results.push({language,settings:'passed',escape:'passed',backdrop:'passed',responsive:'passed'});
 }
 await page.goto(origin+'/?id=sample-book');await page.waitForFunction(()=>typeof entrySnapshot!=='undefined'&&entrySnapshot.length>0);
 assert.equal(await page.evaluate(()=>StudioApp.prepareClose()),true);
 await page.locator('#openExport').click();await page.locator('#exportDialog[open]').waitFor();await page.keyboard.press('Escape');assert.equal(await page.locator('#exportDialog').evaluate(n=>n.open),false);
 await page.screenshot({path:directory+'/book-en.png'});
 const galleries=await(await page.request.get(origin+'/api/galleries')).json();const gallery=(Array.isArray(galleries)?galleries:galleries.galleries).find(item=>item.id);
 await page.goto(origin+'/gallery.html?id='+gallery.id);await page.locator('#exportGallery').click();await page.locator('#galleryDelivery [data-export]:enabled').waitFor();
 for(const value of ['offline','pdf','image']){await page.locator('#galleryDelivery [data-category]').selectOption(value);await page.waitForTimeout(80);assert.deepEqual(await page.evaluate(()=>StudioI18n.missing()),[]);assert(await page.locator('#galleryDelivery').evaluate(n=>n.scrollWidth<=n.clientWidth));}
 await page.screenshot({path:directory+'/gallery-export-en.png'});await page.keyboard.press('Escape');assert.equal(await page.locator('#galleryDelivery').evaluate(n=>n.open),false);
 assert.deepEqual(errors,[]);await writeFile(directory+'/report.json',JSON.stringify({ok:true,results,errors},null,2));console.log('Release interaction checks passed');
}finally{await browser.close();}
