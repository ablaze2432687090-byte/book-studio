/* Content comparison only: editor camera/selection never enter album data. */
(() => {
  const metadata = new Set(['id','slug','status','updatedAt','publishedAt','createdAt','preparedAt','shareUrl','isRoot','aging','agingStyle']);
  function sorted(value) {
    if(Array.isArray(value))return value.map(sorted);
    if(value && typeof value==='object')return Object.fromEntries(Object.keys(value).sort().filter(key=>value[key]!==undefined).map(key=>[key,sorted(value[key])]));
    return value;
  }
  function snapshot(album, effective=false) {
    const content=Object.fromEntries(Object.entries(album||{}).filter(([key])=>!metadata.has(key)));
    if(effective){
      if(content.material==='none'){delete content.texture;delete content.materialScope;delete content.gloss;}
      if(!['pearl','holographic','coated','photo'].includes(content.material))delete content.gloss;
      if(content.ratio!=='custom'){delete content.customWidth;delete content.customHeight;}
      if(content.ratio==='1:1')delete content.landscape;
      if(content.lighting==='none'){delete content.lightIntensity;delete content.lightDirection;delete content.lightTemperature;}
      if(content.shadow===false)delete content.shadowOpacity;
    }
    return JSON.stringify(sorted(content));
  }
  globalThis.AlbumChangeState={snapshot};
})();
