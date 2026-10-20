"""Independent exhibition projects; existing book data is never converted."""
import copy
import json
import math
import re
import secrets
import tempfile
import zipfile
from pathlib import Path


def path_for(studio, identifier):
    if not re.fullmatch(r"[a-zA-Z0-9_-]{1,80}", identifier):
        raise ValueError("展厅编号无效")
    return studio.DATA / "galleries" / (identifier + ".json")


def read(studio, identifier):
    path = path_for(studio, identifier)
    if not path.is_file():
        raise FileNotFoundError("展厅不存在")
    return json.loads(path.read_text(encoding="utf-8"))


def clean(payload, identifier):
    if not isinstance(payload, dict):
        raise ValueError("展厅数据必须为对象")
    if payload.get("schemaVersion",1)!=1:
        raise ValueError("这个展厅由较新版本创建，请先更新工具，未覆盖原数据")
    def number(value, default, low, high):
        try:
            value = float(value)
            return max(low, min(high, value)) if math.isfinite(value) else default
        except (TypeError, ValueError):
            return default
    def choice(key, choices, default):
        value = payload.get(key)
        return value if isinstance(value, str) and value in choices else default
    items = payload.get("artworks", [])
    if not isinstance(items, list) or len(items) > 2000:
        raise ValueError("作品数据无效，单个展厅最多支持 2000 件作品")
    artworks, ids = [], set()
    for item in items:
        if not isinstance(item, dict):
            raise ValueError("作品数据无效")
        src = str(item.get("src", ""))
        if not re.fullmatch(r"/gallery-media/[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp|gif)", src, re.I):
            raise ValueError("作品图片地址无效")
        item_id = str(item.get("id", ""))
        if not re.fullmatch(r"[a-zA-Z0-9_-]{1,80}", item_id) or item_id in ids:
            raise ValueError("作品编号无效或重复")
        ids.add(item_id)
        artworks.append({"id": item_id, "src": src, "title": str(item.get("title", "未命名作品"))[:160],
                         "description": str(item.get("description", ""))[:2000],
                         **{key: str(item.get(key, ""))[:limit] for key, limit in {"author":120,"year":40,"dimensions":120,"section":120}.items()},
                         "frame": item.get("frame") if isinstance(item.get("frame"), str) and item.get("frame") in {"inherit","black","thin","brass","wood","oak","walnut","white","silver","bronze","shadowbox","canvas","acrylic","none"} else "inherit",
                         "frameWidth": number(item.get("frameWidth"), 0, 0, 40),
                         "matWidth": number(item.get("matWidth"), 0, 0, 70),
                         "offsetX": number(item.get("offsetX"), 0, -500, 500), "offsetY": number(item.get("offsetY"), 0, -200, 200),
                         "width": number(item.get("width"), 1000, 1, 50000), "height": number(item.get("height"), 1000, 1, 50000),
                         "scale": number(item.get("scale"), 100, 50, 125), "hidden": bool(item.get("hidden", False))})
        source_id=item.get("sourceAssetId")
        if isinstance(source_id,str) and re.fullmatch(r"[a-f0-9]{24}",source_id): artworks[-1]["sourceAssetId"]=source_id
    return {"schemaVersion":1,"id": identifier, "title": str(payload.get("title", "未命名展厅"))[:120] or "未命名展厅",
            "wall": choice("wall", {"charcoal", "white", "warm", "concrete", "navy","ivory","plaster","linen","oak","walnut","marble","slate","burgundy","forest"}, "charcoal"),
            "frame": choice("frame", {"black", "thin", "brass", "wood", "white","oak","walnut","silver","bronze","shadowbox","canvas","acrylic", "none"}, "black"),
            "layout": choice("layout", {"height","width","original"}, "height"),
            "align": choice("align", {"center","top","bottom"}, "center"),
            "mat": choice("mat", {"none","ivory","black"}, "none"),
            "lighting": choice("lighting", {"spot","soft","track","wash","window","museum","warm","cool","none"}, "spot"),
            "floor": choice("floor", {"legacy","dark","oak","walnut","concrete","stone","marble","terrazzo","none"}, "legacy"),
            "arrangement": choice("arrangement", {"single","double","salon"}, "single"),
            **{key:number(payload.get(key),default,low,high) for key,default,low,high in [
                ("floorShine",20,0,80),("wallTexture",30,0,100),("ambient",100,35,150),
                ("frameWidth",8,0,40),("frameDepth",6,0,25),("matWidth",18,0,70),("glass",0,0,65),
                ("lightTemperature",5500,2700,7500),("lightDirection",0,-60,60),("lightSpread",65,20,100),
                ("sectionGap",80,30,240),("snap",10,1,40)]},
            "intro":bool(payload.get("intro",False)),"subtitle":str(payload.get("subtitle",""))[:200],
            "introduction":str(payload.get("introduction",""))[:4000],"curator":str(payload.get("curator",""))[:160],
            "sectionDividers":bool(payload.get("sectionDividers",False)),
            "sections":[{"title":str(section.get("title",""))[:120],"description":str(section.get("description",""))[:1000]} for section in payload.get("sections",[])[:100] if isinstance(section,dict)] if isinstance(payload.get("sections",[]),list) else [],
            "archived":bool(payload.get("archived",False)),
            "gap": number(payload.get("gap"), 100, 30, 260), "artHeight": number(payload.get("artHeight"), 58, 35, 70),
            "light": number(payload.get("light"), 65, 0, 100), "captions": bool(payload.get("captions", True)), "artworks": artworks}


def thumbnail(studio, filename):
    """Derived previews only: originals and project data remain untouched."""
    if not re.fullmatch(r"[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp|gif)", filename, re.I):
        raise ValueError("预览图地址无效")
    source = studio.DATA / "gallery-photos" / filename
    if not source.is_file():
        raise FileNotFoundError("作品图片不存在")
    folder = getattr(studio, "STATE_ROOT", studio.ROOT) / "work" / "gallery-previews"
    folder.mkdir(parents=True, exist_ok=True)
    target = folder / (filename + ".jpg")
    with studio.DATA_LOCK:
        if not target.exists() or target.stat().st_mtime_ns < source.stat().st_mtime_ns:
            from PIL import Image, ImageOps
            with Image.open(source) as original:
                image = ImageOps.exif_transpose(original).convert("RGBA")
                image.thumbnail((960, 960), Image.Resampling.LANCZOS)
                canvas = Image.new("RGB", image.size, "#18181b")
                canvas.paste(image, mask=image.getchannel("A"))
                temporary = target.with_suffix(".tmp")
                canvas.save(temporary, "JPEG", quality=82, optimize=True)
                temporary.replace(target)
    return target


def create(studio, title):
    identifier = secrets.token_hex(6)
    gallery = clean({"title": title}, identifier)
    gallery.update(revision=1, updatedAt=studio.now_iso())
    with studio.DATA_LOCK:
        studio.atomic_json(path_for(studio, identifier), gallery)
    return gallery


def save(studio, identifier, payload):
    gallery = clean(payload, identifier)
    with studio.DATA_LOCK:
        previous = read(studio, identifier)
        if payload.get("revision") != previous["revision"]:
            raise ValueError("展厅已在其他窗口更新，请重新打开后编辑；当前窗口内容尚未覆盖保存")
        from scripts import project_tools
        project_tools.capture(studio,"gallery",identifier,previous)
        gallery.update(revision=previous["revision"] + 1, updatedAt=studio.now_iso())
        studio.atomic_json(path_for(studio, identifier), gallery)
    return gallery


def listing(studio):
    entries = []
    for path in (studio.DATA / "galleries").glob("*.json"):
        entry = json.loads(path.read_text(encoding="utf-8"))
        preview={key:entry[key] for key in ["wall","floor","frame","mat","light","lighting","ambient","frameWidth","frameDepth","matWidth","glass","wallTexture","floorShine","lightTemperature","lightDirection","lightSpread"] if key in entry}
        preview["artworks"]=[{key:a[key] for key in ["src","title","width","height","frame","frameWidth","matWidth","scale"] if key in a} for a in entry["artworks"] if not a.get("hidden")][:3]
        entries.append({"id": entry["id"], "title": entry["title"], "count": len(entry["artworks"]), "updatedAt": entry["updatedAt"],"archived":bool(entry.get("archived",False)),"preview":preview})
    return sorted(entries, key=lambda entry: entry["updatedAt"], reverse=True)


def export(studio, identifier):
    with studio.DATA_LOCK:
        gallery = copy.deepcopy(read(studio, identifier))
    gallery["artworks"] = [item for item in gallery["artworks"] if not item["hidden"]]
    visible_sections={item.get("section","") for item in gallery["artworks"]}
    gallery["sections"]=[section for section in gallery.get("sections",[]) if section.get("title") in visible_sections]
    for internal in ["revision","updatedAt","archived"]:gallery.pop(internal,None)
    if not gallery["artworks"]:
        raise ValueError("请至少添加一件显示中的作品")
    folder = getattr(studio, "STATE_ROOT", studio.ROOT) / "work" / "gallery-exports"
    folder.mkdir(parents=True, exist_ok=True)
    temporary = tempfile.NamedTemporaryFile(prefix="gallery-", suffix=".zip", dir=folder, delete=False)
    target = Path(temporary.name)
    temporary.close()
    try:
        _write_export(studio, gallery, target)
    except Exception:
        target.unlink(missing_ok=True)
        raise
    return target


def _write_export(studio, gallery, target):
    from scripts import gallery_delivery,studio_store
    language=studio_store.settings(studio)['language'];english=language=='en'
    guide_pdf,catalog_pdf=gallery_delivery.pdfs(studio,gallery)
    with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("User-Guide.pdf" if english else "使用指南.pdf",guide_pdf)
        archive.writestr("Artwork-Catalog.pdf" if english else "作品目录.pdf",catalog_pdf)
        archive.writestr("交付信息.json",json.dumps({"tool":"BOOK STUDIO","packageVersion":2,"exportedAt":studio.now_iso(),"title":gallery["title"],"count":len(gallery["artworks"]),"type":"gallery","offline":True},ensure_ascii=False,indent=2))
        images = set()
        for item in gallery["artworks"]:
            item.pop("sourceAssetId",None)
            filename = item["src"].split("/")[-1]
            if filename not in images:
                photo = studio.DATA / "gallery-photos" / filename
                if not photo.is_file():
                    raise FileNotFoundError("作品图片缺失，请替换后重新导出：" + item["title"])
                archive.write(photo, "assets/" + filename)
                images.add(filename)
            item["src"] = "assets/" + filename
            preview = thumbnail(studio, filename)
            preview_name = "assets/previews/" + filename + ".jpg"
            if preview_name not in archive.namelist():
                archive.write(preview, preview_name)
            item["previewSrc"] = preview_name
        for name in ["i18n-catalog.js","studio-i18n.js","viewer-locale.js","overlay-dismiss.js", "gallery.css", "gallery-enhancements.css", "gallery-scenery.css", "gallery-design.js", "gallery-layout.js", "gallery-core.js", "gallery-wall.js", "gallery-tools.js", "gallery-presentation.js", "gallery-view.js"]:
            archive.write(studio.WEB / name, "assets/" + name)
        for texture in (studio.WEB / "gallery-textures").iterdir():
            if texture.is_file():archive.write(texture,"assets/gallery-textures/"+texture.name)
        payload = json.dumps(gallery, ensure_ascii=False).replace("<", "\\u003c")
        html = (studio.WEB / "gallery-view.html").read_text(encoding="utf-8")
        html=html.replace('<head>','<head><script>window.__BOOK_STUDIO_LANGUAGE__='+json.dumps(language)+';</script>',1)
        for name in ['i18n-catalog.js','studio-i18n.js','viewer-locale.js']:
            html=html.replace('src="/'+name+'"','src="assets/'+name+'"')
        html = html.replace('src="/overlay-dismiss.js"', 'src="assets/overlay-dismiss.js"')
        for name in ["gallery-scenery.css","gallery-design.js","gallery-layout.js","gallery-wall.js","gallery-presentation.js"]:
            html=html.replace('"/'+name+'"','"assets/'+name+'"')
        html = html.replace('href="/gallery.css"', 'href="assets/gallery.css"').replace('href="/gallery-enhancements.css"', 'href="assets/gallery-enhancements.css"').replace('src="/gallery-core.js"', 'src="assets/gallery-core.js"').replace('src="/gallery-tools.js"', 'src="assets/gallery-tools.js"').replace('src="/gallery-view.js"', 'src="assets/gallery-view.js"')
        html = html.replace('<script id="galleryData" type="application/json"></script>', '<script id="galleryData" type="application/json">' + payload + '</script>')
        archive.writestr("Open-Gallery.html" if english else "打开展厅.html", html)
        archive.writestr("README.txt" if english else "使用说明.txt", "Extract the entire ZIP, then open Open-Gallery.html.\nDrag or scroll to pan; use View for fitting and Overview for artwork navigation.\nTour options control duration, looping and section scope. Click artwork for details; arrows navigate and Esc closes details.\nKeep assets beside the HTML. No network or local server required.\nSend the complete ZIP. This is a fixed snapshot, not a synchronized link. Hidden artwork is excluded.\n" if english else "请先完整解压文件夹，再双击「打开展厅.html」。\n拖动、触控板或滚轮平移；缩放条调整观看大小；「视图」可查看整墙或恢复 100%。\n作品总览可定位作品；「导览设置」可调整停留时间、循环和展区范围。\n点击作品查看原图与完整说明，左右方向键切换作品，Esc 关闭详情。\n手机建议横屏，也可点击单幅观看。\n保留 assets 文件夹与 HTML 的相对位置。无需联网，无需启动后台；转发时请发送完整 ZIP。\n本包为导出时的固定版本，修改后重新导出；隐藏作品不包含在导出包中。\n")
        import csv, io
        catalog = io.StringIO(newline="")
        writer = csv.writer(catalog)
        writer.writerow(["Number","Section","Title","Artist","Year","Dimensions","Description"] if english else ["编号","分区","作品名称","作者","年份","尺寸","作品说明"])
        for index, item in enumerate(gallery["artworks"],1):
            row = [str(index)] + [str(item.get(key,"")) for key in ["section","title","author","year","dimensions","description"]]
            writer.writerow(["'"+value if value.startswith(("=","+","-","@")) else value for value in row])
        archive.writestr("Artwork-Catalog.csv" if english else "作品目录.csv", "\ufeff"+catalog.getvalue())
