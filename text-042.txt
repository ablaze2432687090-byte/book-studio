"""Non-destructive PDF and offline HTML exports from the saved album snapshot."""
from __future__ import annotations

import copy
import hashlib
import io
import json
import math
import re
import secrets
import zipfile
import os
from datetime import datetime
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(os.environ.get("BOOK_STUDIO_RESOURCE_ROOT", Path(__file__).resolve().parents[1])).resolve()
STATE_ROOT = Path(os.environ.get("BOOK_STUDIO_HOME", ROOT)).resolve()
PHOTOS = STATE_ROOT / "data" / "photos"
OUTPUT = STATE_ROOT / "output" / "exports"
PAIRS = {"16:9": (16,9), "4:3": (4,3), "16:10": (16,10), "2:3": (2,3), "1:1": (1,1), "2:1": (2,1), "1.618:1": (1.618,1)}

def page_size(album):
    w,h = (float(album.get("customWidth",3)),float(album.get("customHeight",4))) if album.get("ratio") == "custom" else PAIRS.get(album.get("ratio"), (4,3))
    return (max(w,h),min(w,h)) if album.get("landscape") else (min(w,h),max(w,h))

def number(value, default, minimum, maximum):
    try:
        value = float(value)
        return max(minimum,min(maximum,value)) if math.isfinite(value) else default
    except (ValueError,TypeError):
        return default

def composition(iw,ih,w,h,page,album):
    crop = page.get("crop") or {}
    mode = crop.get("fit",album.get("fit","contain"))
    zoom = number(crop.get("zoom",1),1,1 if mode == "cover" else .25,4)
    x,y = number(crop.get("x",0),0,-1,1),number(crop.get("y",0),0,-1,1)
    scale = (max(w/iw,h/ih) if mode == "cover" else min(w/iw,h/ih))*zoom
    width,height = iw*scale,ih*scale
    return width,height,(w-width)/2+x*abs(w-width)/2,(h-height)/2+y*abs(h-height)/2

def photo_path(src):
    if not src.startswith("/media/"):
        raise ValueError("图片路径不属于本地画册")
    path = PHOTOS / Path(unquote(src[7:])).name
    if not path.is_file():
        raise FileNotFoundError(f"图片缺失：{path.name}")
    return path

def pdf_groups(pages, layout):
    if layout == "single":
        return [[p] for p in pages]
    inside = pages[1:-1]
    return [[pages[0]]] + [inside[i:i+2] + ([None] if len(inside[i:i+2]) == 1 else []) for i in range(0,len(inside),2)] + [[pages[-1]]]

def create_pdf(album, target, layout, quality):
    from PIL import Image, ImageOps
    from reportlab.pdfgen import canvas
    from reportlab.lib.utils import ImageReader
    from reportlab.lib.colors import HexColor
    from reportlab.pdfbase import pdfmetrics
    from scripts.pdf_fonts import register
    font = register()
    rw,rh = page_size(album)
    unit = (180/25.4*72)/max(rw,rh)
    w,h = rw*unit,rh*unit
    ref = 640/max(rw,rh)
    margin = min(float(album.get("margin",0)),min(rw*ref,rh*ref)*.45)*unit/ref
    doc = canvas.Canvas(target if hasattr(target,"write") else str(target),pagesize=(w,h),pageCompression=1)
    doc.setTitle(album.get("title","画册")); doc.setAuthor("BOOK STUDIO")
    for group in pdf_groups(album["pages"],layout):
        doc.setPageSize((w*len(group),h))
        for index,page in enumerate(group):
            doc.saveState(); doc.translate(index*w,0)
            try:
                surface = HexColor((page or {}).get("color","#d2d0ca"))
            except ValueError:
                surface = HexColor("#d2d0ca")
            doc.setFillColor(surface); doc.rect(0,0,w,h,fill=1,stroke=0)
            if page and page.get("src"):
                with Image.open(photo_path(page["src"])) as original:
                    image = ImageOps.exif_transpose(original).convert("RGBA")
                    base = Image.new("RGB",image.size,(int(surface.red*255),int(surface.green*255),int(surface.blue*255)))
                    base.paste(image,mask=image.getchannel("A"))
                    iw,ih = base.size
                    dw,dh,left,top = composition(iw,ih,w-2*margin,h-2*margin,page,album)
                    if quality == "compact":
                        # Keep enough pixels for zoomed crops without loading all pages together.
                        factor = min(1,1600/max(iw,ih))
                        if factor < 1: base = base.resize((max(1,round(iw*factor)),max(1,round(ih*factor))),Image.Resampling.LANCZOS)
                    stream = io.BytesIO(); base.save(stream,"JPEG",quality=95 if quality == "high" else 84)
                    clip = doc.beginPath(); clip.rect(margin,margin,w-2*margin,h-2*margin)
                    doc.clipPath(clip,stroke=0,fill=0)
                    doc.drawImage(ImageReader(stream),margin+left,h-margin-top-dh,width=dw,height=dh)
            elif page:
                doc.setFillColor(HexColor("#ffffff") if page.get("cover") else HexColor("#333333"))
                doc.setFont(font,9); doc.drawString(w*.12,h*.88,"PHOTO JOURNAL" if page.get("cover") else page.get("name",""))
                if page.get("cover"):
                    title = album.get("title","画册")
                    doc.setFont(font,min(40,w*.12))
                    lines,line = [],""
                    for char in title:
                        if pdfmetrics.stringWidth(line+char,font,min(40,w*.12)) > w*.76 and line:
                            lines.append(line); line = ""
                        line += char
                    lines.append(line)
                    for n,line in enumerate(lines[:6]): doc.drawString(w*.12,h*.55-n*min(44,w*.14),line)
                    doc.setFont(font,9); doc.drawString(w*.12,h*.12,"THE END" if page is album["pages"][-1] else "2026")
            doc.restoreState()
        doc.showPage()
    doc.save()

def create_offline(album,target,language="zh-CN"):
    from scripts.render_album import render_album
    source = ROOT / "web" / "album"
    required = set()
    names = {name:name for name in ("styles.css","flipbook.js","composition.js","presentation.js","presentation.css","page-flip.browser.js")}
    html = render_album(copy.deepcopy(album),(source/"index.html").read_text(encoding="utf-8"),required,names)
    html = html.replace("/assets/","assets/")
    english=language=='en'
    html=html.replace('<meta charset="UTF-8" />','<meta charset="UTF-8" /><script>window.__BOOK_STUDIO_LANGUAGE__='+json.dumps(language)+';</script>',1)
    title = re.sub(r'[\\/:*?"<>|\x00-\x1f]',"_",album.get("title","画册"))[:60].strip(". ") or "画册"
    folder = title + ("_Presentation" if english else "_展示交付包")
    documents = {"01_User-Guide.pdf" if english else "01_使用指南.pdf": ROOT/("assets/delivery/User-Guide.pdf" if english else "assets/delivery/使用指南.pdf")}
    for label,path in documents.items():
        if not path.is_file(): raise FileNotFoundError(f"固定交付文档缺失：{label}，请修复模板后重新导出")
    reading = io.BytesIO()
    create_pdf(album,reading,"single","compact")
    exported_at = datetime.now().astimezone().isoformat(timespec="seconds")
    manifest = {"packageVersion":"1.1", "language":language, "title":album.get("title","画册"), "exportedAt":exported_at, "pageCount":len(album["pages"]), "files":{}}
    with zipfile.ZipFile(target,"w",compression=zipfile.ZIP_DEFLATED,compresslevel=6) as archive:
        def add(name,content):
            content = content.encode("utf-8") if isinstance(content,str) else content
            archive.writestr(folder+"/"+name,content)
            manifest["files"][name] = {"bytes":len(content),"sha256":hashlib.sha256(content).hexdigest()}
        add("index.html",html)
        add("02_Open-Book.html" if english else "02_打开画册.html",html)
        for label,path in documents.items(): add(label,path.read_bytes())
        add("03_Reading-Edition.pdf" if english else "03_画册阅读版.pdf",reading.getvalue())
        for name in ['i18n-catalog.js','studio-i18n.js','viewer-locale.js']:
            add('assets/runtime/'+name,(ROOT/'web'/name).read_bytes())
        for name in names:
            add(f"assets/runtime/{name}",(source/("vendor" if name == "page-flip.browser.js" else "")/name).read_bytes())
        add("assets/runtime/PAGE-FLIP-LICENSE",(source/"vendor/PAGE-FLIP-LICENSE").read_bytes())
        for texture in sorted((source/'textures').iterdir()):
            if texture.is_file(): add('assets/runtime/textures/'+texture.name,texture.read_bytes())
        for name in sorted(required):
            path = PHOTOS/name
            if not path.is_file(): raise FileNotFoundError(f"图片缺失：{name}")
            add(f"assets/photos/{name}",path.read_bytes())
        if english:
            add('00_README.txt',f'''BOOK STUDIO | Book presentation
Title: {album.get('title','Book')}
Package: 1.1 / Exported: {exported_at}
Pages: {len(album['pages'])}

Extract this entire ZIP, then open 02_Open-Book.html in Edge or Chrome.
index.html is an identical compatibility entry. No internet or local server is needed.
01_User-Guide.pdf explains reading controls. 03_Reading-Edition.pdf is a static copy.
Keep the assets folder alongside the HTML. Send the complete ZIP, not just an HTML file.
Local HTML support varies on phones and messaging apps; use the reading PDF if needed.
This is a fixed snapshot. Later edits do not change this package; export again after editing.
''')
        else: add("00_交付说明.txt",f"""BOOK STUDIO | 数字画册展示交付包
画册：{album.get('title','画册')}
版本：1.1 / 导出时间：{exported_at}
页数：{len(album['pages'])}

开始阅读
先完整解压本 ZIP，再打开「02_打开画册.html」。
推荐使用电脑上的 Edge 或 Chrome；无需联网、GPT 或后台服务。
「index.html」是相同的兼容入口，供网站上传时作为默认首页。

包内文件
01_使用指南.pdf：固定通用阅读指南。
02_打开画册.html：互动展示入口。
03_画册阅读版.pdf：本画册静态单页阅读版，适合存档与备用阅读，不包含翻页动效。
assets：运行与图片资源，请保持整个文件夹结构，不要删除或单独移动。

交付注意
这是导出时的独立快照。后台后续修改不会自动更新本包，需要重新导出。
给客户转发请发送完整 ZIP；不要在压缩包内直接打开 HTML。
手机、平板和微信的本地 HTML 支持因应用而异，建议发送阅读版 PDF。
每次导出都是独立成品，后续修改不会影响已经交付的文件。
如需上传网站空间，请上传本文件夹内的全部内容并保留 assets 路径。
如互动入口显示异常，请换用常用浏览器，或先阅读 03_画册阅读版.pdf。
""")
        archive.writestr(folder+"/assets/package-manifest.json",json.dumps(manifest,ensure_ascii=False,indent=2))

def export_album(album, format="pdf", layout="single", quality="high", language="zh-CN"):
    if format not in {"pdf","offline"} or layout not in {"single","spread"} or quality not in {"high","compact"}:
        raise ValueError("导出选项无效")
    if not album.get("pages") or len(album["pages"]) < 2:
        raise ValueError("画册至少需要封面和封底")
    OUTPUT.mkdir(parents=True,exist_ok=True)
    title = re.sub(r'[\\/:*?"<>|\x00-\x1f]',"_",album.get("title","画册"))[:60].strip(". ") or "画册"
    target = OUTPUT/f"{title}-{datetime.now():%Y%m%d-%H%M%S}-{secrets.token_hex(3)}{'.pdf' if format == 'pdf' else '.zip'}"
    temp = target.with_suffix(target.suffix+".partial")
    try:
        if format == "pdf": create_pdf(album,temp,layout,quality)
        else: create_offline(album,temp,language)
        temp.replace(target)
    finally:
        if temp.exists(): temp.unlink()
    return target
