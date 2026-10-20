import {spawnSync} from 'node:child_process';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const python=process.env.BOOK_STUDIO_PYTHON||'python';
const buildOnly=['fontTools','pip_audit'].flatMap(name=>['--exclude-module',name]);
const result=spawnSync(python,['-m','PyInstaller','--noconfirm','--onedir','--name','BookStudioService','--distpath','work/desktop-backend','--workpath','work/desktop-pyinstaller','--specpath','work','--paths','.','--collect-submodules','reportlab','--hidden-import','PIL.Image','--hidden-import','PIL.ImageOps','--hidden-import','charset_normalizer','--exclude-module','numpy','--exclude-module','tkinter','--exclude-module','scipy','--exclude-module','matplotlib','--exclude-module','qrcode',...buildOnly,'desktop/service_entry.py'],{cwd:root,stdio:'inherit',windowsHide:true});
if(result.error)throw result.error;process.exitCode=result.status??1;
