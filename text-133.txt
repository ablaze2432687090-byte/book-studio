/* Viewing-only locale bridge. No management UI, writes, or remote translation. */
document.addEventListener('DOMContentLoaded',()=>{
 if(globalThis.__BOOK_STUDIO_LANGUAGE__)StudioI18n.setLanguage(__BOOK_STUDIO_LANGUAGE__);
 else if(location.protocol!=='file:')void fetch('/api/studio/settings').then(r=>r.ok?r.json():{}).then(p=>{if(p.language)StudioI18n.setLanguage(p.language);}).catch(()=>{});
},{once:true});
