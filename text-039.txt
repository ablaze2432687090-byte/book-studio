import {chromium} from 'playwright';
import {spawnSync} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..'),area=path.resolve(process.env.BOOK_STUDIO_TEST_PROFILE||'');
if(!area.startsWith(path.join(root,'work/desktop-qa')+path.sep))throw Error('Provide an isolated desktop QA profile');
const result=spawnSync(process.env.BOOK_STUDIO_PYTHON||'python',['scripts/extract_test_exports.py',area],{stdio:'inherit',windowsHide:true});if(result.status!==0)throw Error('Could not extract QA exports');
const entries=JSON.parse(await readFile(path.join(area,'offline-entries.json'),'utf8'));
const browser=await chromium.launch({channel:process.env.BOOK_STUDIO_BROWSER||'msedge',headless:true});const report=[];
try{for(const entry of entries){
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],network=[];
 page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:\/\//,route=>{network.push(route.request().url());return route.abort();});
 await page.goto(pathToFileURL(entry.html).href);await page.waitForFunction(()=>globalThis.StudioI18n?.language==='en');
 if(entry.kind==='book')await page.waitForFunction(()=>window.__FLIPBOOK_READY__===true);else await page.locator('[data-art]').first().waitFor();
 await page.waitForTimeout(350);const missing=await page.evaluate(()=>StudioI18n.missing());assert.deepEqual(missing,[],entry.kind+' untranslated viewing UI');assert.deepEqual(network,[]);assert.deepEqual(errors,[]);
 if(entry.kind==='gallery'){assert.equal(await page.locator('#viewerTitle').textContent(),'设置');await page.locator('[data-art]').first().click();await page.locator('.art-dialog[open]').waitFor();assert.equal(await page.locator('.art-detail h2').textContent(),'设置');await page.keyboard.press('Escape');await page.locator('.art-dialog[open]').waitFor({state:'detached'});}
 await page.screenshot({path:path.join(area,'offline-'+entry.kind+'-en.png')});report.push({kind:entry.kind,ok:true,networkRequests:0,errors,missing});await page.close();
}}finally{await browser.close();}
await writeFile(path.join(area,'offline-report.json'),JSON.stringify({ok:true,entries:report},null,2));console.log('Offline bilingual packages passed:',report.map(r=>r.kind).join(', '));
