"""Inspect our own frozen Python code, including compressed PYZ modules."""
import json,marshal,re,sys,types
from pathlib import Path
from PyInstaller.archive.readers import CArchiveReader
root=Path(__file__).resolve().parents[1];target=Path(sys.argv[1]).resolve()
if not (target.is_relative_to(root/'work/desktop-backend') or target.is_relative_to(root/'release')):raise ValueError('Unexpected backend audit target')
archive=CArchiveReader(str(target));pyz=archive.open_embedded_archive('PYZ.pyz');violations=[];count=0
private=re.compile(r'(?:[A-Z]:[\\/]Users[\\/][^\\/\s\'"<>]+|'+ '/' + 'Users/' + r'[^/\s\'"<>]+)',re.I)
def inspect(code,module):
    global count
    if not isinstance(code,types.CodeType):return
    count+=1
    if private.search(code.co_filename):violations.append({'module':module,'rule':'absolute-user-source-path'})
    for value in code.co_consts:
        if isinstance(value,types.CodeType):inspect(value,module)
        elif isinstance(value,str) and private.search(value):violations.append({'module':module,'rule':'embedded-user-path'})
for name,entry in pyz.toc.items():
    code=pyz.extract(name)
    inspect(code,name)
for name,entry in archive.toc.items():
    if entry[-1]=='s':inspect(marshal.loads(archive.extract(name)),name)
report={'ok':not violations,'moduleCount':len(pyz.toc),'codeObjects':count,'violations':violations}
print(json.dumps(report));sys.exit(0 if report['ok'] else 1)
