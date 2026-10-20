import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("./", import.meta.url);
const index = await readFile(new URL("index.html", root), "utf8");
const script = await readFile(new URL("app.js", root), "utf8");
const styles = await readFile(new URL("styles.css", root), "utf8");
const projects = await readFile(new URL("projects.html", root), "utf8");
const projectScript = await readFile(new URL("projects.js", root), "utf8");
const projectStyles = await readFile(new URL("projects.css", root), "utf8");

test("gallery lighting is bounded, neutral and shared without rewriting artwork", async () => {
  const {runInNewContext}=await import('node:vm');
  const context={};runInNewContext(await readFile(new URL('gallery-design.js',root),'utf8'),context);
  const design=context.GalleryDesign,config={light:65,lightTemperature:5500,lightDirection:0,lightSpread:65};
  const before=JSON.stringify(config);
  for(const lighting of Object.keys(design.lighting)){
    const profile=design.lightProfile({...config,lighting});
    assert(Number(profile['--light-surface'])<=.085);
    assert(Number(profile['--light-beam'])<=.115);
    const off=design.lightProfile({...config,lighting,light:0});
    for(const key of ['--light-wall','--light-surface','--light-beam'])assert.equal(off[key],0);
  }
  assert.equal(design.lightProfile({...config,lighting:'none'})['--light-wall'],0);
  assert.equal(JSON.stringify(config),before);
  assert.equal(design.temperature(5500),'255 245 232');
  for(const kelvin of [0,2700,4000,5500,6500,7500,99999])assert(design.temperature(kelvin).split(' ').every(v=>Number(v)>=0&&Number(v)<=255));
  assert.notEqual(design.lightProfile({...config,lightSpread:20})['--light-footprint'],design.lightProfile({...config,lightSpread:100})['--light-footprint']);
  assert.notEqual(design.lightProfile({...config,lightDirection:-60})['--light-cast-x'],design.lightProfile({...config,lightDirection:60})['--light-cast-x']);
  const css=await readFile(new URL('gallery-scenery.css',root),'utf8');
  assert.match(css,/data-lighting=none[^}]*art-picture:before\{display:none\}/);
  assert.match(css,/pointer-events:none;background:radial-gradient/);
});

test('continuous gallery light sums linear energy before exposure, with no artwork-sized cutoffs',async()=>{
  const {runInNewContext}=await import('node:vm'),context={};runInNewContext(await readFile(new URL('gallery-design.js',root),'utf8'),context);
  const d=context.GalleryDesign,positions=[{x:200,y:230,w:260,h:350},{x:560,y:230,w:260,h:350}],sources=d.lightSources(positions,{lighting:'spot',light:65},900),x=510,y=250;
  const a=d.irradiance(x,y,[sources[0]]),b=d.irradiance(x,y,[sources[1]]),sum=d.irradiance(x,y,sources);
  assert(Math.abs(sum-a-b)<1e-12);assert.equal(sum,d.irradiance(x,y,[...sources].reverse()));
  assert(d.expose(sum)>d.expose(Math.max(a,b)));assert(d.expose(sum)<d.expose(a)+d.expose(b));
  assert(d.irradiance(x,20,sources)>0,'light must extend above the old rectangle boundary');
  assert(Math.abs(d.irradiance(x,130.01,sources)-d.irradiance(x,129.99,sources))<.0001);
  assert.equal(d.lightSources(positions,{lighting:'none'},900).length,0);
  const script=await readFile(new URL('gallery-wall.js',root),'utf8'),css=await readFile(new URL('gallery-scenery.css',root),'utf8');
  assert.match(script,/energyField\[y\*width\+x\]\+=/);assert.match(css,/has-light-field[^}]*art-slot:after\{display:none\}/);
});

test('book lights have continuous shared fields, bounded caching and no fixtures',async()=>{
  const {runInNewContext}=await import('node:vm'),context={URL,document:{currentScript:{src:'https://example.test/album/presentation.js'}}};
  const source=await readFile(new URL('album/presentation.js',root),'utf8');runInNewContext(source,context);const d=context.BookPresentation;
  for(const mode of Object.keys(d.lights)){const sources=d.lightSources(mode);assert.equal(d.lightEnergy(.5,.3,sources)===0,mode==='none');assert(Math.abs(d.lightEnergy(.5,.30001,sources)-d.lightEnergy(.5,.29999,sources))<.0001);}
  assert.match(source,/lightMaps.size>=24/);assert(!source.includes('wall-light'));
  const css=await readFile(new URL('album/presentation.css',root),'utf8');assert.match(css,/background-size:200% 100%/);assert.match(css,/bs-light-position|background-position:right top/);
});

test("editor exposes zoom rail and close-book action", () => {
  assert.match(index, /id="previewZoom"/);
  assert.match(index, /id="previewZoomFit"/);
  assert.match(index, /id="previewCloseBook"/);
  assert.match(script, /requestAnimationFrame/);
  assert.match(script, /closePreviewBook/);
  assert.match(styles, /--preview-zoom/);
  assert.match(styles, /\.preview-zoom-rail/);
  assert.match(styles, /writing-mode:\s*horizontal-tb/);
  assert.match(styles, /\.preview-zoom-rail\s*\{[^}]*bottom:/s);
  assert.match(styles, /@media \(max-width:\s*980px\)/);
  assert.match(styles, /\.toggle input\s*\{[^}]*flex:\s*0 0 36px/s);
  assert.match(styles, /\.settings::\-webkit-scrollbar\s*\{[^}]*width:\s*5px/s);
  assert.match(styles, /scrollbar-color:\s*var\(--red-bright\)/);
});

test("cover navigation cannot tween layout dimensions or fade the controls", () => {
  const bookRule = styles.match(/\.book\s*\{([^}]+)\}/)[1];
  assert.match(bookRule, /transition:\s*transform\s/);
  assert.doesNotMatch(bookRule, /transition:\s*(?:all|width|height|\.\d)/);
  assert.doesNotMatch(styles, /editor-fade-(?:out|in)|editor-book-fade/);
  const close = script.slice(script.indexOf('function closePreviewBook'), script.indexOf('function previewGroups'));
  assert.doesNotMatch(close, /setTimeout|is-locked|classList/);
  assert.match(close, /finally/);
  assert.match(close, /render\(\{ navigation: true \}\)/);
  assert.match(script, /if \(navigation\)\s*\{/);
  assert.match(script, /querySelectorAll\('\.page-item'\)/);
  for (const id of ['prev', 'next']) assert.match(script, new RegExp(`\\$\\('#${id}'\\)\\.onclick[^\\n]+render\\(\\{ navigation: true \\}\\)`));
});

test("editor can leave fullscreen and return safely to the album library", () => {
  assert.match(index, /id="backToProjects"/);
  assert.match(index, /id="leaveDialog"/);
  assert.match(index, /id="leaveSave"/);
  assert.match(script, /document\.exitFullscreen/);
  assert.match(script, /webkitExitFullscreen/);
  assert.match(script, /webkitRequestFullscreen/);
  assert.match(script, /fullscreenchange/);
  assert.match(script, /webkitfullscreenchange/);
  assert.match(script, /allowNavigation/);
  assert.match(index, /class="stage-back" id="backToProjects"/);
  assert.doesNotMatch(index, /class="editor-back"/);
});

test("editor recovers from a stale album link instead of leaving dead controls", () => {
  assert.match(script, /recoveredMissingAlbum/);
  assert.match(script, /album\s*=\s*await api\('\/api\/album'\)/);
  assert.match(script, /history\.replaceState/);
  assert.match(index, /app\.js\?v=20261009-effects-1/);
});

test("album cards keep horizontal labels and wrap controls when narrow", () => {
  assert.match(projectStyles, /writing-mode:\s*horizontal-tb/);
  assert.match(projectStyles, /\.album-actions\s*\{[^}]*flex-wrap:\s*wrap/);
  assert.match(projectStyles, /white-space:\s*nowrap/);
  assert.match(projectStyles, /grid-template-columns:\s*repeat\(auto-fill,\s*286px\)/);
  assert.match(projectStyles, /\.album-grid\.list\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
});

test("studio exposes local editing and exports without publication controls", () => {
  assert.match(projects, /id="albumGrid"/);
  assert.match(projects, /id="createAlbum"/);
  assert.match(projectScript, /\/api\/albums/);
  assert.match(projectScript, /data-action="duplicate"/);
  assert.doesNotMatch(index, /id="(?:publishDrawer|shareDialog|shareQr|publish|share)"/);
  assert.match(index, /id="openExport"/);
  assert.match(script, /autoSaveTimer/);
  assert.match(script, /等待自动保存/);
  assert.doesNotMatch(script, /\/publish|shareUrl/);
  assert.doesNotMatch(styles, /\.publish-drawer|\.share-dialog/);
});

test("editor supports the requested ratios and a single landscape switch", () => {
  for (const ratio of ["16:9", "4:3", "16:10", "2:3", "1:1", "2:1", "1.618:1"]) {
    assert.match(index, new RegExp(`<option>${ratio.replace(".", "\\.")}</option>`));
  }
  assert.match(index, /id="landscape"/);
  assert.match(script, /pageRatioPair/);
  assert.match(script, /album\.landscape/);
});

test("media changes preserve original files for session undo", () => {
  const replaceBlock = script.slice(script.indexOf("async function uploadFiles"), script.indexOf("async function uploadBackground"));
  assert.match(replaceBlock, /flushSave/);
  assert.doesNotMatch(replaceBlock, /oldSource\.split/);
  assert.match(script, /editHistory\.reconcile/);
  assert.match(script, /body:\s*file/);
  assert.match(index, /id="deletePageDialog"/);
  assert.doesNotMatch(script, /confirm\(/);
});

test("editor exposes lightweight lighting and physical book controls", () => {
  for (const id of ["edgeColor", "cornerRadius", "contactShadow", "turnStyle", "introMotion", "immersive", "lightIntensity"]) {
    assert.match(index, new RegExp(`id="${id}"`));
  }
  assert.match(index, /data-lighting="none"/);
  assert.equal((index.match(/data-reset-settings=/g) || []).length, 3);
  assert.match(script, /edgeColors/);
  assert.match(script, /settingsDefaults/);
  assert.match(styles, /--contact-shadow/);
  assert.match(styles, /lighting-side/);
});

test("gallery editor docks original tools without breaking shared viewer callbacks", async () => {
  const gallery = await readFile(new URL('gallery-editor.js', root), 'utf8');
  const tools = await readFile(new URL('gallery-tools.js', root), 'utf8');
  const presentation = await readFile(new URL('gallery-presentation.js', root), 'utf8');
  const chrome = await readFile(new URL('editor-chrome.js', root), 'utf8');
  const workflow = await readFile(new URL('workflow-simplify.css', root), 'utf8');
  assert.match(gallery, /headerView\.append\(viewTools\.querySelector\('\.gallery-zoom'\)/);
  assert.match(gallery, /previewHead\.after\(viewTools\)/);
  assert.match(gallery, /gallery-assets > \.section-heading/);
  assert.match(gallery, /addEventListener\('fullscreenchange',dockViewTools\)/);
  assert.match(chrome, /stage\.contains\(bar\)\?bar\.offsetHeight:0/);
  assert.match(tools, /zoomOut\.disabled/);
  assert.match(presentation, /zoomOutput\.value/);
  assert.match(presentation, /bar\.append\(dialog\)/);
  assert.match(workflow, /gallery-side-tools\[data-editor-glass\][^{]*\{[^}]*align-items:stretch/);
});
