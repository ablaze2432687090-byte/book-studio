/* Shared page composition for the editor, public viewer and offline viewer. */
(function (root) {
  const clamp = (v, a, b) => Math.min(b, Math.max(a, Number(v) || 0));
  const pairs = { '16:9':[16,9], '4:3':[4,3], '16:10':[16,10], '2:3':[2,3], '1:1':[1,1], '2:1':[2,1], '1.618:1':[1.618,1] };
  function ratio(album) {
    let [w, h] = album.ratio === 'custom' ? [Number(album.customWidth) || 3, Number(album.customHeight) || 4] : (pairs[album.ratio] || pairs['4:3']);
    return album.landscape ? [Math.max(w,h), Math.min(w,h)] : [Math.min(w,h), Math.max(w,h)];
  }
  function normalize(crop, fit = 'contain') {
    const mode = ['contain','cover'].includes(crop?.fit) ? crop.fit : fit;
    return { fit: mode, zoom: clamp(crop?.zoom ?? 1, mode === 'cover' ? 1 : .25, 4), x: clamp(crop?.x ?? 0,-1,1), y: clamp(crop?.y ?? 0,-1,1) };
  }
  function geometry(iw, ih, w, h, crop, fit) {
    const c = normalize(crop, fit);
    const scale = (c.fit === 'cover' ? Math.max(w/iw,h/ih) : Math.min(w/iw,h/ih)) * c.zoom;
    const width = iw * scale, height = ih * scale;
    return { width, height, left: (w-width)/2 + c.x * Math.abs(w-width)/2, top: (h-height)/2 + c.y * Math.abs(h-height)/2 };
  }
  function mount(frame, image, album, page, override) {
    const [rw,rh] = ratio(album), unit = 640/Math.max(rw,rh), w = rw*unit, h = rh*unit;
    const margin = Math.min(Number(album.margin) || 0, Math.min(w,h)*.45);
    frame.style.cssText = `position:absolute;overflow:hidden;left:${margin/w*100}%;right:${margin/w*100}%;top:${margin/h*100}%;bottom:${margin/h*100}%;background:${page.color || '#d2d0ca'};`;
    const update = () => {
      if (!image.naturalWidth) return;
      const g = geometry(image.naturalWidth,image.naturalHeight,w-2*margin,h-2*margin,override ?? page.crop,album.fit);
      image.style.cssText = `position:absolute;max-width:none;max-height:none;object-fit:fill;width:${g.width/(w-2*margin)*100}%;height:${g.height/(h-2*margin)*100}%;left:${g.left/(w-2*margin)*100}%;top:${g.top/(h-2*margin)*100}%;background:transparent;`;
    };
    image.draggable = false;
    if (!image.naturalWidth) image.addEventListener('load',update,{once:true});
    update();
  }
  root.PageComposition = { ratio, normalize, geometry, mount };
})(typeof window === 'undefined' ? globalThis : window);
