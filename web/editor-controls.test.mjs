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

test("editor exposes zoom rail and close-book action", () => {
  assert.match(index, /id="previewZoom"/);
  assert.match(index, /id="previewZoomFit"/);
  assert.match(index, /id="previewCloseBook"/);
  assert.match(script, /requestAnimationFrame/);
  assert.match(script, /closePreviewBook/);
  assert.match(styles, /--preview-zoom/);
  assert.match(styles, /editor-fade-out/);
  assert.match(styles, /editor-fade-in/);
  assert.match(styles, /\.preview-zoom-rail/);
  assert.match(styles, /editor-book-fade-out/);
  assert.match(styles, /writing-mode:\s*horizontal-tb/);
  assert.match(styles, /\.preview-zoom-rail\s*\{[^}]*bottom:/s);
  assert.match(styles, /@media \(max-width:\s*980px\)/);
  assert.match(styles, /\.toggle input\s*\{[^}]*flex:\s*0 0 36px/s);
  assert.match(styles, /\.settings::\-webkit-scrollbar\s*\{[^}]*width:\s*5px/s);
  assert.match(styles, /scrollbar-color:\s*var\(--red-bright\)/);
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
