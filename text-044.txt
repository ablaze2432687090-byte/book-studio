"""Extract only generated QA exports into a fresh QA-only directory."""
import json,sys,zipfile,tempfile
from pathlib import Path,PurePosixPath
root=Path(__file__).resolve().parents[1]
area=Path(sys.argv[1]).resolve()
if not area.is_relative_to(root/'work/desktop-qa'):raise ValueError('Only isolated QA exports are accepted')
destination=Path(tempfile.mkdtemp(prefix='offline-',dir=area));entries=[];seen=set()
for archive in sorted((area/'profile').rglob('*.zip'),key=lambda path:path.stat().st_mtime,reverse=True):
    with zipfile.ZipFile(archive) as bundle:
        names=bundle.namelist()
        htmls=[name for name in names if name.endswith('/index.html') or name=='Open-Gallery.html']
        if not htmls:continue
        kind='gallery' if htmls[0]=='Open-Gallery.html' else 'book'
        if kind in seen:continue
        seen.add(kind)
        target=destination/str(len(entries));target.mkdir()
        for name in names:
            parts=PurePosixPath(name)
            if parts.is_absolute() or '..' in parts.parts or '\\' in name or ':' in name:raise ValueError('Unsafe export entry')
        assert not any(name.endswith(('studio-shell.js','gallery-editor.js','gallery-studio.js','editor-chrome.js')) for name in names)
        bundle.extractall(target)
        entries.append({'html':str(target/htmls[0]),'kind':kind})
(area/'offline-entries.json').write_text(json.dumps(entries,indent=2),encoding='utf8')
assert len(entries)>=2,'Expected both book and gallery exports'
print('Extracted generated book and gallery exports')
