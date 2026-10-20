"""Desktop preferences and verified snapshots. No credentials in backups."""
from __future__ import annotations
import hashlib
import json
import os
import secrets
import shutil
import stat
import tempfile
import zipfile
from datetime import datetime
from pathlib import Path, PurePosixPath

DEFAULTS = {"language":"zh-CN", "density":"comfortable", "reduceMotion":False, "startup":"book", "autoBackup":True, "backupKeep":7, "confirmExit":False}
DATA_NAMES = {"albums", "photos", "projects.json", "album.json", "galleries", "gallery-photos", "library", "library-images", "ai-jobs", "project-history", "project-trash", "media-trash", "tool-settings"}
def home(studio): return getattr(studio, "STATE_ROOT", studio.ROOT)
def settings(studio):
    path = home(studio)/"studio-settings.json"
    saved = json.loads(path.read_text(encoding="utf-8")) if path.is_file() else {}
    return {**DEFAULTS, **{k:v for k,v in saved.items() if k in DEFAULTS}}
def save_settings(studio, payload):
    with studio.DATA_LOCK:
        result = settings(studio)
        for name in ["autoBackup", "confirmExit", "reduceMotion"]:
            if name in payload:
                if not isinstance(payload[name], bool): raise ValueError("设置值格式不正确")
                result[name] = payload[name]
        for name, options in {"language":{"zh-CN","en"}, "density":{"comfortable","compact"}, "startup":{"book","gallery"}}.items():
            if name in payload:
                if payload[name] not in options: raise ValueError("设置选项无效")
                result[name] = payload[name]
        if "backupKeep" in payload:
            if payload["backupKeep"] not in {3,7,14,30}: raise ValueError("备份保留份数无效")
            result["backupKeep"] = payload["backupKeep"]
        studio.atomic_json(home(studio)/"studio-settings.json", result)
        return result

def backup_directory(studio):
    return Path(os.environ.get("BOOK_STUDIO_BACKUPS",home(studio)/"backups")).resolve()

def backups(studio):
    return sorted(backup_directory(studio).glob("BOOK-STUDIO-*.zip"), key=lambda p:p.stat().st_mtime, reverse=True)

def status(studio):
    files = [p for p in studio.DATA.rglob("*") if p.is_file() and not p.is_symlink() and not p.name.endswith(".tmp")]
    snapshots = backups(studio)
    from scripts import gallery_store, asset_store
    return {"version":os.environ.get("BOOK_STUDIO_VERSION","0.3.0"), "desktop":bool(os.environ.get("BOOK_STUDIO_SESSION_TOKEN")),
        "books":len(studio.read_projects()["albums"]), "galleries":len(gallery_store.listing(studio)),
        "assets":len(asset_store.view(studio)["assets"]), "bytes":sum(p.stat().st_size for p in files),
        "backupCount":len(snapshots), "lastBackup":datetime.fromtimestamp(snapshots[0].stat().st_mtime).isoformat(timespec="seconds") if snapshots else None,
        "schemaVersion":1, "settings":settings(studio)}

def backup(studio):
    directory = backup_directory(studio); directory.mkdir(parents=True,exist_ok=True)
    if directory == studio.DATA.resolve() or studio.DATA.resolve() in directory.parents:
        raise ValueError("备份位置不能在作品数据目录内")
    name = f"BOOK-STUDIO-{datetime.now():%Y%m%d-%H%M%S}-{secrets.token_hex(3)}.zip"
    target = directory/name; temporary = target.with_suffix(".zip.tmp")
    manifest = {"schemaVersion":1,"createdAt":studio.now_iso(),"files":{}}
    try:
        with studio.DATA_LOCK, zipfile.ZipFile(temporary,"w",zipfile.ZIP_DEFLATED) as archive:
            validate_data(studio.DATA)
            for path in sorted(studio.DATA.rglob("*")):
                if path.is_symlink(): raise ValueError("仓库包含链接文件，无法安全备份")
                if not path.is_file() or path.name.endswith(".tmp"): continue
                relative = path.relative_to(studio.DATA)
                if relative.parts[0] not in DATA_NAMES: continue
                name_in_zip = "data/"+relative.as_posix(); raw = path.read_bytes()
                archive.writestr(name_in_zip, raw)
                manifest["files"][name_in_zip] = {"bytes":len(raw),"sha256":hashlib.sha256(raw).hexdigest()}
            archive.writestr("manifest.json", json.dumps(manifest,ensure_ascii=False,indent=2))
        temporary.replace(target)
        # Never delete archives from a different workspace or a previous backup path.
        registry=home(studio)/"backup-retention.json"
        try: owned=json.loads(registry.read_text(encoding="utf-8"))
        except (OSError,ValueError): owned=[]
        owned=[p for p in owned if isinstance(p,str) and Path(p).parent==directory and Path(p).is_file()]
        owned.insert(0,str(target))
        for old in owned[settings(studio)["backupKeep"]:]:
            candidate=Path(old)
            if candidate.name.startswith("BOOK-STUDIO-") and not candidate.is_symlink(): candidate.unlink(missing_ok=True)
        studio.atomic_json(registry,owned[:settings(studio)["backupKeep"]])
        return {"ok":True,"name":target.name,"bytes":target.stat().st_size,"message":"备份已完成；不包含 API 密钥或客户端日志"}
    finally:
        temporary.unlink(missing_ok=True)

def validate_data(root):
    if not (root/"projects.json").is_file(): raise ValueError("找不到 projects.json，请选择 BOOK STUDIO 仓库或有效备份")
    state = json.loads((root/"projects.json").read_text(encoding="utf-8"))
    if not isinstance(state.get("albums"),list): raise ValueError("项目索引格式不正确")
    for entry in state["albums"]:
        identifier = entry.get("id","")
        if not identifier or not all(c.isascii() and (c.isalnum() or c in "_-") for c in identifier): raise ValueError("画册编号无效")
        album = json.loads((root/"albums"/(identifier+".json")).read_text(encoding="utf-8"))
        if not isinstance(album.get("pages"),list): raise ValueError("画册页面格式不正确")
        for item in album["pages"]:
            if item.get("src"): validate_image(root,item["src"],"/media/","photos")
    for path in (root/"galleries").glob("*.json"):
        gallery = json.loads(path.read_text(encoding="utf-8"))
        for item in gallery.get("artworks",[]): validate_image(root,item["src"],"/gallery-media/","gallery-photos")
    index = root/"library"/"index.json"
    if index.is_file():
        for item in json.loads(index.read_text(encoding="utf-8")).get("assets",[]): validate_image(root,item["src"],"/library-media/","library-images")

def validate_image(root, src, prefix, folder):
    from urllib.parse import unquote
    if not isinstance(src,str) or not src.startswith(prefix): raise ValueError("图片引用不属于这个仓库")
    filename=unquote(src[len(prefix):])
    if Path(filename).name!=filename or "/" in filename or "\\" in filename or not (root/folder/filename).is_file(): raise ValueError("仓库图片缺失："+filename[:100])

def replace_data(studio, source):
    """Call only while the desktop-owned server is stopped. Keep the previous data."""
    validate_data(source)
    studio.DATA.parent.mkdir(parents=True,exist_ok=True)
    staged = studio.DATA.parent/("data-import-"+secrets.token_hex(6))
    staged.mkdir()
    try:
        for name in DATA_NAMES:
            path=source/name
            if not path.exists(): continue
            if path.is_symlink() or (path.is_dir() and any(p.is_symlink() for p in path.rglob("*"))): raise ValueError("无法导入链接目录")
            if path.is_dir(): shutil.copytree(path,staged/name,ignore=shutil.ignore_patterns("*.tmp"))
            else: shutil.copy2(path,staged/name)
        validate_data(staged)
        recovery=studio.DATA.parent/("data-before-import-"+datetime.now().strftime("%Y%m%d-%H%M%S")+"-"+secrets.token_hex(3))
        had_old=studio.DATA.exists()
        if had_old: studio.DATA.rename(recovery)
        try: staged.rename(studio.DATA)
        except Exception:
            if had_old: recovery.rename(studio.DATA)
            raise
        return {"ok":True,"recovery":recovery.name if had_old else None}
    finally:
        if staged.exists(): shutil.rmtree(staged) # only this freshly created, exact staging folder

def import_folder(studio, folder):
    source=Path(folder).resolve()
    if (source/"data"/"projects.json").is_file(): source=source/"data"
    if source==studio.DATA.resolve() or studio.DATA.resolve() in source.parents: raise ValueError("不能导入当前客户端的数据目录")
    return replace_data(studio,source)

def migrate(studio, folder):
    """Copy while service is stopped, hash-verify, retain the complete old data."""
    target=Path(folder).resolve(); source=studio.DATA.resolve()
    if target==source or source in target.parents or target in source.parents:
        raise ValueError("新位置不能与当前仓库重叠")
    target.parent.mkdir(parents=True,exist_ok=True)
    if target.exists(): raise ValueError("目标已存在，请选择另一个空位置")
    validate_data(source)
    def inventory(root):
        result={}
        for item in root.rglob("*"):
            if item.is_symlink(): raise ValueError("不能迁移链接文件")
            if item.is_file():
                digest=hashlib.sha256()
                with item.open('rb') as stream:
                    for block in iter(lambda:stream.read(1024*1024),b''): digest.update(block)
                result[item.relative_to(root).as_posix()]=[item.stat().st_size,digest.hexdigest()]
        return result
    before=inventory(source)
    total=sum(item[0] for item in before.values())
    if shutil.disk_usage(target.parent).free<total+64*1024*1024: raise ValueError("目标磁盘空间不足")
    staged=target.parent/(".book-studio-migration-"+secrets.token_hex(8))
    try:
        shutil.copytree(source,staged)
        validate_data(staged)
        if inventory(staged)!=before or inventory(source)!=before: raise ValueError("迁移校验失败，原仓库未修改")
        staged.rename(target)
        return {"ok":True,"files":len(before),"bytes":total}
    finally:
        if staged.exists(): shutil.rmtree(staged)

def restore(studio, filename):
    with tempfile.TemporaryDirectory(prefix="book-studio-restore-") as scratch:
        destination=Path(scratch)
        with zipfile.ZipFile(filename) as archive:
            entries=archive.infolist()
            if len(entries)>50000 or sum(e.file_size for e in entries)>10*1024**3: raise ValueError("备份大小超出安全限制")
            if any(e.file_size>128*1024**2 for e in entries) or archive.getinfo("manifest.json").file_size>8*1024**2: raise ValueError("备份中单个文件超出安全限制")
            manifest=json.loads(archive.read("manifest.json"))
            if manifest.get("schemaVersion")!=1: raise ValueError("备份版本不受支持")
            names=[e.filename for e in entries]
            if len(names)!=len(set(names)) or set(names)!=set(manifest["files"])|{"manifest.json"}: raise ValueError("备份文件清单不匹配")
            for name,info in manifest["files"].items():
                relative=PurePosixPath(name)
                if relative.is_absolute() or ".." in relative.parts or "\\" in name or len(relative.parts)<2 or relative.parts[0]!="data" or relative.parts[1] not in DATA_NAMES: raise ValueError("备份包含不安全路径")
                entry=archive.getinfo(name)
                if stat.S_ISLNK(entry.external_attr>>16) or entry.file_size>1024**3: raise ValueError("备份文件类型或大小无效")
                raw=archive.read(name)
                if len(raw)!=info["bytes"] or hashlib.sha256(raw).hexdigest()!=info["sha256"]: raise ValueError("备份校验失败："+name)
                path=destination.joinpath(*relative.parts);path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(raw)
        return replace_data(studio,destination/"data")
