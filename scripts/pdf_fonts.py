"""Bundled OFL font: PDF text must not depend on Windows language packs."""
import os
import threading
from pathlib import Path
LOCK=threading.RLock()

def register(name="BookStudioUnicode"):
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    with LOCK:
        if name not in pdfmetrics.getRegisteredFontNames():
            root=Path(os.environ.get("BOOK_STUDIO_RESOURCE_ROOT",Path(__file__).resolve().parents[1]))
            filename=root/'assets'/'fonts'/'StudioSansSC-Regular.ttf'
            if not filename.is_file(): raise ValueError('PDF 字体资源缺失，请重新安装完整客户端')
            pdfmetrics.registerFont(TTFont(name,str(filename)))
    return name
