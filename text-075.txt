const bookElement = document.querySelector("#book");
const pages = bookElement.querySelectorAll(".book-page");
const previousButton = document.querySelector("#previous");
const nextButton = document.querySelector("#next");
const pageStatus = document.querySelector("#page-status");
const orientationStatus = document.querySelector("#orientation");
const viewerStage = document.querySelector(".stage");
const bookRig = document.querySelector(".book-rig");
const zoomToolbar = document.querySelector(".viewer-zoom-toolbar");
const zoomRange = document.querySelector("#viewerZoom");
const zoomValue = document.querySelector("#viewerZoomValue");
const zoomInButton = document.querySelector("#viewerZoomIn");
const zoomOutButton = document.querySelector("#viewerZoomOut");
const zoomFitButton = document.querySelector("#viewerZoomFit");
const closeBookButton = document.querySelector("#viewerCloseBook");
const fullscreenButton = document.querySelector("#viewerFullscreen");
const pageWidth = Number(bookElement.dataset.pageWidth) || 471;
const pageHeight = Number(bookElement.dataset.pageHeight) || 640;
const turnStyle = bookElement.dataset.turnStyle || "natural";
const turnTimeScale = { soft: 1.16, crisp: 0.82, natural: 1 }[turnStyle] || 1;
const turnDuration = Math.round((Number(bookElement.dataset.flipSpeed) || 760) * turnTimeScale);
const viewerReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

const pageFlip = new St.PageFlip(bookElement, {
  width: pageWidth,
  height: pageHeight,
  size: "stretch",
  minWidth: innerWidth <= 700 && innerHeight > innerWidth ? Math.max(1, Math.round(pageWidth * 0.56)) : 1,
  maxWidth: Math.max(1, Math.round(pageWidth * 1.04)),
  minHeight: 1,
  maxHeight: Math.max(1, Math.round(pageHeight * 1.04)),
  drawShadow: bookElement.dataset.drawShadow !== "false",
  flippingTime: turnDuration,
  usePortrait: true,
  startZIndex: 10,
  autoSize: true,
  maxShadowOpacity: Number(bookElement.dataset.shadowOpacity) || 0.42,
  showCover: true,
  mobileScrollSupport: false,
  clickEventForward: true,
  useMouseEvents: true,
  swipeDistance: 24,
  showPageCorners: true,
  disableFlipByClick: false,
});

let currentPage = 0;
let isTurning = false;
let viewerClosing = false;
let viewerZoom = 1;
let viewerPanX = 0;
let viewerPanY = 0;
let cameraFrame = 0;
let dragStart = null;
let pinchStart = null;
const activePointers = new Map();
// autoSize uses the book width to derive its height. Bound that width by the
// actual stage height so short landscape screens cannot overflow the controls.
function fitBookToStage() {
  const style = getComputedStyle(viewerStage);
  const height = Math.max(1, viewerStage.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom) - 12);
  const single = innerWidth <= 700 && innerHeight > innerWidth;
  bookRig.style.width = Math.min(viewerStage.clientWidth, height * pageWidth / pageHeight * (single ? 1 : 2)) + 'px';
  bookRig.style.height = height + 'px';
  pageFlip.update();
}
new ResizeObserver(fitBookToStage).observe(viewerStage);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
let chromeTimer = 0;

function fullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement;
}

function syncFullscreenControl() {
  const active = Boolean(fullscreenElement());
  fullscreenButton.textContent = active ? "×" : "⛶";
  fullscreenButton.setAttribute("aria-label", active ? "退出全屏" : "进入全屏");
  fullscreenButton.title = active ? "退出全屏" : "全屏";
  fullscreenButton.setAttribute("aria-pressed", String(active));
}

async function toggleFullscreen() {
  try {
    if (fullscreenElement()) {
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (exit) await exit.call(document);
    } else {
      const enter = document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen;
      if (enter) await enter.call(document.documentElement);
    }
  } catch {
    document.body.classList.remove("chrome-hidden");
  }
  syncFullscreenControl();
}

function showChrome(keepVisible = false) {
  clearTimeout(chromeTimer);
  document.body.classList.remove("chrome-hidden");
  if (document.body.dataset.immersive !== "true" || keepVisible || document.activeElement?.matches("button,input")) return;
  chromeTimer = window.setTimeout(() => {
    if (!isTurning && !viewerClosing && !document.querySelector(".viewer-chrome:focus-within")) document.body.classList.add("chrome-hidden");
  }, 2600);
}

function syncViewerCamera(animate = false) {
  bookRig.style.setProperty("--viewer-zoom", viewerZoom.toFixed(2));
  bookRig.style.setProperty("--viewer-pan-x", `${viewerPanX.toFixed(1)}px`);
  bookRig.style.setProperty("--viewer-pan-y", `${viewerPanY.toFixed(1)}px`);
  bookRig.classList.toggle("camera-transition", animate);
  bookRig.classList.toggle("camera-draggable", viewerZoom > 1.001);
  zoomRange.value = String(Math.round(viewerZoom * 100));
  zoomValue.textContent = `${Math.round(viewerZoom * 100)}%`;
  zoomOutButton.disabled = viewerZoom <= .5 || viewerClosing;
  zoomInButton.disabled = viewerZoom >= 2 || viewerClosing;
  closeBookButton.disabled = currentPage === 0 || viewerClosing;
}

function scheduleViewerCamera() {
  if (cameraFrame) return;
  cameraFrame = requestAnimationFrame(() => {
    cameraFrame = 0;
    syncViewerCamera();
  });
}

function setViewerZoom(percent, animate = true) {
  const next = clamp(Math.round(Number(percent) / 5) * 5, 50, 200) / 100;
  viewerZoom = next;
  if (viewerZoom <= 1) {
    viewerPanX = 0;
    viewerPanY = 0;
  } else {
    const limitX = viewerStage.clientWidth * (viewerZoom - 1) * .42;
    const limitY = viewerStage.clientHeight * (viewerZoom - 1) * .42;
    viewerPanX = clamp(viewerPanX, -limitX, limitX);
    viewerPanY = clamp(viewerPanY, -limitY, limitY);
  }
  syncViewerCamera(animate);
}

function fitViewerCamera() {
  viewerZoom = 1;
  viewerPanX = 0;
  viewerPanY = 0;
  syncViewerCamera(true);
}

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function closeViewerBook() {
  if (viewerClosing || isTurning || currentPage === 0) return;
  viewerClosing = true;
  zoomToolbar.classList.add("is-locked");
  updateControls();
  bookRig.classList.remove("viewer-fade-in");
  bookRig.classList.add("viewer-fade-out");
  await wait(viewerReducedMotion ? 0 : 220);
  pageFlip.turnToPage(0);
  currentPage = 0;
  fitViewerCamera();
  bookRig.classList.remove("viewer-fade-out");
  bookRig.classList.add("viewer-fade-in");
  updateControls();
  await wait(viewerReducedMotion ? 0 : 280);
  bookRig.classList.remove("viewer-fade-in");
  zoomToolbar.classList.remove("is-locked");
  viewerClosing = false;
  updateControls();
}

function updateControls() {
  const pageCount = pageFlip.getPageCount();
  const lastPage = pageCount - 1;

  previousButton.disabled = currentPage === 0 || isTurning || viewerClosing;
  nextButton.disabled = currentPage === lastPage || isTurning || viewerClosing;

  if (currentPage === 0) {
    pageStatus.textContent = "Cover";
  } else if (currentPage === lastPage) {
    pageStatus.textContent = "Back cover";
  } else {
    pageStatus.textContent = `${String(currentPage + 1).padStart(2, "0")} / ${String(pageCount).padStart(2, "0")}`;
  }
  syncViewerCamera();
}

pageFlip.on("flip", (event) => {
  currentPage = Number(event.data);
  updateControls();
});

pageFlip.on("changeState", (event) => {
  isTurning = event.data !== "read";
  updateControls();
});

function updateOrientation(orientation) {
  orientationStatus.textContent = orientation === "portrait" ? "单页展示" : "打开的跨页";
}

pageFlip.on("init", (event) => updateOrientation(event.data.mode));
pageFlip.on("changeOrientation", (event) => {
  updateOrientation(event.data);
  window.setTimeout(fitViewerCamera, 80);
});

pageFlip.loadFromHTML(pages);
updateControls();
if (document.body.dataset.introMotion === "true") {
  bookRig.classList.add("viewer-opening");
  bookRig.addEventListener("animationend", () => bookRig.classList.remove("viewer-opening"), { once: true });
}
showChrome();

previousButton.addEventListener("click", () => {
  if (!isTurning && !viewerClosing) pageFlip.flipPrev("bottom");
});

nextButton.addEventListener("click", () => {
  if (!isTurning && !viewerClosing) pageFlip.flipNext("bottom");
});

zoomRange.addEventListener("input", () => setViewerZoom(zoomRange.value, false));
zoomInButton.addEventListener("click", () => setViewerZoom(viewerZoom * 100 + 10));
zoomOutButton.addEventListener("click", () => setViewerZoom(viewerZoom * 100 - 10));
zoomFitButton.addEventListener("click", fitViewerCamera);
closeBookButton.addEventListener("click", closeViewerBook);
fullscreenButton.addEventListener("click", toggleFullscreen);
if (!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen)) fullscreenButton.hidden = true;
const handleFullscreenChange = () => { syncFullscreenControl(); window.setTimeout(fitViewerCamera, 80); showChrome(); };
document.addEventListener("fullscreenchange", handleFullscreenChange);
document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

viewerStage.addEventListener("wheel", (event) => {
  if (!event.ctrlKey || viewerClosing) return;
  event.preventDefault();
  setViewerZoom(viewerZoom * 100 + (event.deltaY < 0 ? 10 : -10), false);
}, { passive: false });

viewerStage.addEventListener("dblclick", (event) => {
  if (viewerClosing) return;
  event.preventDefault();
  setViewerZoom(viewerZoom > 1.01 ? 100 : 150);
});

function pointerDistance([first, second]) {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

viewerStage.addEventListener("pointerdown", (event) => {
  if (viewerClosing) return;
  activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

  if (activePointers.size === 2) {
    const points = [...activePointers.values()];
    pinchStart = { distance: pointerDistance(points), zoom: viewerZoom };
    dragStart = null;
    event.preventDefault();
    viewerStage.setPointerCapture(event.pointerId);
  } else if (viewerZoom > 1.001) {
    dragStart = { x: event.clientX, y: event.clientY, panX: viewerPanX, panY: viewerPanY };
    bookRig.classList.add("camera-dragging");
    event.preventDefault();
    viewerStage.setPointerCapture(event.pointerId);
  }
}, { capture: true });

viewerStage.addEventListener("pointermove", (event) => {
  if (!activePointers.has(event.pointerId)) return;
  activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

  if (pinchStart && activePointers.size >= 2) {
    const distance = pointerDistance([...activePointers.values()].slice(0, 2));
    setViewerZoom(pinchStart.zoom * 100 * distance / Math.max(1, pinchStart.distance), false);
    event.preventDefault();
    return;
  }

  if (dragStart && viewerZoom > 1.001) {
    const limitX = viewerStage.clientWidth * (viewerZoom - 1) * .42;
    const limitY = viewerStage.clientHeight * (viewerZoom - 1) * .42;
    viewerPanX = clamp(dragStart.panX + event.clientX - dragStart.x, -limitX, limitX);
    viewerPanY = clamp(dragStart.panY + event.clientY - dragStart.y, -limitY, limitY);
    scheduleViewerCamera();
    event.preventDefault();
  }
}, { capture: true });

function releasePointer(event) {
  activePointers.delete(event.pointerId);
  if (activePointers.size < 2) pinchStart = null;
  if (activePointers.size === 0) {
    dragStart = null;
    bookRig.classList.remove("camera-dragging");
  }
}

viewerStage.addEventListener("pointerup", releasePointer, { capture: true });
viewerStage.addEventListener("pointercancel", releasePointer, { capture: true });

window.addEventListener("keydown", (event) => {
  showChrome();
  if (event.altKey || event.ctrlKey || event.metaKey || isTurning || viewerClosing) return;

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    pageFlip.flipPrev("bottom");
  }

  if (event.key === "ArrowRight" || event.key === " ") {
    event.preventDefault();
    pageFlip.flipNext("bottom");
  }

  if (event.key === "Home") closeViewerBook();
  if (event.key === "End") pageFlip.turnToPage(pageFlip.getPageCount() - 1);
});

["pointermove", "touchstart"].forEach((name) => document.addEventListener(name, () => showChrome(), { passive: true }));
document.addEventListener("pointerdown", (event) => {
  showChrome();
}, { capture: true });
document.addEventListener("focusin", () => showChrome(true));
document.addEventListener("focusout", () => showChrome());
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    activePointers.clear();
    pinchStart = null;
    dragStart = null;
    bookRig.classList.remove("camera-dragging");
  } else {
    showChrome();
    fitViewerCamera();
  }
});
window.addEventListener("orientationchange", () => window.setTimeout(() => { fitViewerCamera(); showChrome(); }, 180));
window.addEventListener("pageshow", () => { syncFullscreenControl(); showChrome(); });
const rotateHint = document.querySelector("#rotateHint");
const syncRotateHint = () => {
  if (!rotateHint) return;
  rotateHint.classList.toggle("visible", matchMedia("(max-width: 700px) and (orientation: portrait)").matches);
};
syncRotateHint();
window.addEventListener("resize", syncRotateHint, { passive: true });
rotateHint?.addEventListener("click", () => rotateHint.classList.remove("visible"));
window.__FLIPBOOK_READY__ = true;
