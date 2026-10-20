import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("./", import.meta.url);
const index = await readFile(new URL("index.html", root), "utf8");
const script = await readFile(new URL("flipbook.js", root), "utf8");
const styles = await readFile(new URL("styles.css", root), "utf8");
const pages = [...index.matchAll(/<article\b[^>]*class="[^"]*\bbook-page\b[^"]*"[^>]*>/g)].map(
  ([tag]) => tag,
);

test("template is vanilla HTML", () => {
  assert.doesNotMatch(`${index}\n${script}\n${styles}`, /react|jsx|vite/i);
  assert.match(index, /id="book"/);
  assert.match(index, /data-page-width="\d+"/);
  assert.match(index, /data-page-height="\d+"/);
  assert.match(index, /vendor\/page-flip\.browser\.js/);
  assert.match(script, /new St\.PageFlip/);
  assert.match(script, /loadFromHTML\(pages\)/);
  assert.match(script, /usePortrait:\s*true/);
  assert.match(script, /bookElement\.dataset\.pageWidth/);
  assert.match(script, /bookElement\.dataset\.pageHeight/);
  assert.match(styles, /\.book-page\.\--left::before/);
  assert.match(styles, /\.book-page\.\--right::before/);
  assert.match(styles, /z-index:\s*3/);
  assert.match(styles, /linear-gradient\(to (?:left|right)/);
  assert.doesNotMatch(styles, /box-shadow:\s*inset/);
  assert.doesNotMatch(styles, /book-gutter|data-orientation="landscape"/);
});

test("cover and page density contract is valid", () => {
  assert.ok(pages.length >= 2);
  assert.match(pages[0], /data-density="hard"/);
  assert.match(pages.at(-1), /data-density="hard"/);
  for (const page of pages.slice(1, -1)) assert.doesNotMatch(page, /data-density="hard"/);
});

test("default page size stays inside the UI envelope", () => {
  const width = Number(index.match(/data-page-width="(\d+)"/)?.[1]);
  const height = Number(index.match(/data-page-height="(\d+)"/)?.[1]);
  assert.ok(Math.max(width, height) <= 640);
});

test("vendored runtime and photo directory exist", async () => {
  assert.equal((await stat(new URL("vendor/page-flip.browser.js", root))).isFile(), true);
  assert.equal((await stat(new URL("assets/photos/", root))).isDirectory(), true);
});

test("viewer exposes smooth zoom and close-book controls", () => {
  assert.match(index, /id="viewerZoom"/);
  assert.match(index, /id="viewerZoomFit"/);
  assert.match(index, /id="viewerCloseBook"/);
  assert.match(script, /requestAnimationFrame/);
  assert.match(script, /pageFlip\.turnToPage\(0\)/);
  assert.match(script, /viewer-fade-out/);
  assert.match(script, /viewer-fade-in/);
  assert.match(script, /pointerDistance/);
  assert.match(styles, /--viewer-zoom/);
  assert.match(styles, /viewer-book-fade-out/);
  assert.match(styles, /viewer-book-fade-in/);
  assert.match(styles, /\.viewer-zoom-toolbar/);
});

test("viewer prioritizes the cover and preloads later pages without obscuring them", () => {
  assert.match(index, /id="loadingProgress"/);
  assert.match(index, /id="preloadStrip"/);
  assert.match(index, /优先加载封面与首屏/);
  assert.match(index, /preloadImage/);
  assert.match(styles, /\.preload-strip/);
  assert.match(index, /id="loadingRetry"/);
  assert.match(index, /Math\.min\(lowPower \? 1 : 2, total\)/);
  assert.match(index, /runtime\.onerror/);
  assert.match(index, /controller\.onerror/);
  assert.match(index, /__FLIPBOOK_READY__/);
  assert.match(script, /__FLIPBOOK_READY__\s*=\s*true/);
  assert.match(index, /flipbook\.js\?v=/);
  assert.match(index, /const fetchAlbum = async/);
  assert.match(index, /fetch\('\/api\/album', \{ cache: 'no-store' \}\)/);
  assert.match(index, /history\.replaceState/);
});

test("viewer provides lightweight premium presentation with closed control loops", () => {
  assert.match(index, /id="viewerFullscreen"/);
  assert.match(script, /toggleFullscreen/);
  assert.match(script, /exitFullscreen/);
  assert.match(script, /fullscreenchange/);
  assert.match(script, /visibilitychange/);
  assert.match(script, /orientationchange/);
  assert.match(script, /showChrome/);
  assert.match(styles, /lighting-soft/);
  assert.match(styles, /viewer-book-open/);
  assert.match(styles, /low-performance/);
  assert.match(index, /id="rotateHint"/);
});
