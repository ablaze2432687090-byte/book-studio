"""Versioned, independent tool asset library. Consumers receive owned copies."""
import hashlib
import io
import json
import re
import secrets
import shutil
from PIL import Image


def state_path(studio):
    return studio.DATA / "library" / "index.json"


def read(studio):
    path = state_path(studio)
    state=json.loads(path.read_text(encoding="utf-8")) if path.is_file() else {"schemaVersion":1,"version":0,"folders":[],"assets":[]}
    if state.get("schemaVersion")!=1: raise ValueError("图库版本较新，请更新工具后再管理，未覆盖原数据")
    return state


def write(studio, state):
    state["version"] += 1
    studio.atomic_json(state_path(studio), state)
    return state


def view(studio):
    state=read(studio)
    usage={}
    for path in (studio.DATA/"galleries").glob("*.json"):
        project=json.loads(path.read_text(encoding="utf-8"))
        for identifier in {item.get("sourceAssetId") for item in project.get("artworks",[]) if item.get("sourceAssetId")}:
            usage.setdefault(identifier,[]).append({"id":project["id"],"title":project["title"]})
    for asset in state["assets"]: asset["uses"]=usage.get(asset["id"],[])
    return state


def check_version(state, payload):
    if payload.get("version") != state["version"]:
        raise ValueError("图库已在其他窗口更新，请刷新列表后重试")


def upload(studio, raw, mime, name):
    try:
        with Image.open(io.BytesIO(raw)) as probe:
            probe.verify()
        with Image.open(io.BytesIO(raw)) as image:
            width, height = image.size
            if image.getexif().get(274) in {5,6,7,8}: width,height=height,width
    except Exception as exc:
        raise ValueError("图片无法解析，请选择有效的图片文件") from exc
    digest=hashlib.sha256(raw).hexdigest()
    extension={"image/jpeg":".jpg","image/png":".png","image/webp":".webp","image/gif":".gif"}[mime]
    with studio.DATA_LOCK:
        state=read(studio)
        duplicate=next((item for item in state["assets"] if item["sha256"]==digest),None)
        if duplicate:
            if duplicate["trashed"]:
                duplicate["trashed"]=False;write(studio,state)
            return {"asset":duplicate,"duplicate":True,"version":state["version"]}
        identifier=secrets.token_hex(12);filename=identifier+extension
        directory=studio.DATA/"library-images";directory.mkdir(parents=True,exist_ok=True)
        target=directory/filename;temporary=target.with_suffix(extension+".tmp");temporary.write_bytes(raw);temporary.replace(target)
        asset={"id":identifier,"name":str(name or "未命名图片")[:160],"src":"/library-media/"+filename,"width":width,"height":height,"bytes":len(raw),"mime":mime,"sha256":digest,"folder":"","tags":[],"trashed":False,"createdAt":studio.now_iso()}
        state["assets"].append(asset);write(studio,state)
        return {"asset":asset,"duplicate":False,"version":state["version"]}


def mutate(studio,payload):
    if not isinstance(payload,dict): raise ValueError("图库数据必须为对象")
    with studio.DATA_LOCK:
        state=read(studio);check_version(state,payload)
        identifiers=payload.get("ids")
        if not isinstance(identifiers,list) or not identifiers or any(not isinstance(i,str) for i in identifiers): raise ValueError("请选择图片")
        identifiers=set(identifiers);assets=[a for a in state["assets"] if a["id"] in identifiers]
        if len(assets)!=len(identifiers): raise ValueError("部分图片不存在，请刷新")
        changes=payload.get("changes",{})
        if not isinstance(changes,dict): raise ValueError("修改内容无效")
        if "folder" in changes and changes["folder"] not in ["",*[f["id"] for f in state["folders"]]]: raise ValueError("分类不存在")
        tags=changes.get("tags",[])
        if not isinstance(tags,list) or any(not isinstance(t,str) for t in tags): raise ValueError("标签格式无效")
        for asset in assets:
            if "name" in changes:
                if len(assets)!=1: raise ValueError("重命名只允许选择一张图片")
                asset["name"]=str(changes["name"]).strip()[:160] or "未命名图片"
            if "folder" in changes: asset["folder"]=changes["folder"]
            if "tags" in changes: asset["tags"]=list(dict.fromkeys(t.strip()[:40] for t in tags if t.strip()))[:30]
            if "archived" in changes: asset["archived"]=bool(changes["archived"])
            if "trashed" in changes: asset["trashed"]=bool(changes["trashed"])
        write(studio,state)
        return view(studio)


def folder(studio,payload,identifier=None,delete=False):
    if not isinstance(payload,dict): raise ValueError("分类数据无效")
    with studio.DATA_LOCK:
        state=read(studio);check_version(state,payload)
        name=str(payload.get("name","")).strip()[:80]
        if not delete and not name: raise ValueError("请输入分类名称")
        if not delete and any(f["name"]==name and f["id"]!=identifier for f in state["folders"]): raise ValueError("分类名称已存在")
        if identifier:
            entry=next((f for f in state["folders"] if f["id"]==identifier),None)
            if entry is None: raise ValueError("分类不存在")
            if delete:
                state["folders"].remove(entry)
                for asset in state["assets"]:
                    if asset["folder"]==identifier: asset["folder"]=""
            else: entry["name"]=name
        else: state["folders"].append({"id":secrets.token_hex(8),"name":name})
        write(studio,state)
        return view(studio)


def import_gallery(studio,identifier,payload):
    from scripts import gallery_store
    if not isinstance(payload,dict) or not isinstance(payload.get("ids"),list) or not payload["ids"]: raise ValueError("请选择图库图片")
    if len(payload["ids"])>200: raise ValueError("每次最多导入 200 张图片")
    with studio.DATA_LOCK:
        gallery=gallery_store.read(studio,identifier)
        if gallery["revision"]!=payload.get("revision"): raise ValueError("展厅有更新，请重新打开后再导入")
        state=read(studio);available={a["id"]:a for a in state["assets"] if not a["trashed"]}
        if any(not isinstance(i,str) or i not in available for i in payload["ids"]): raise ValueError("部分素材已移入回收站或不存在，请刷新图库")
        directory=studio.DATA/"gallery-photos";directory.mkdir(parents=True,exist_ok=True)
        copied=[]
        try:
            for source_id in payload["ids"]:
                source=available[source_id];filename=source["src"].split("/")[-1]
                if not re.fullmatch(r"[a-zA-Z0-9_-]+\.(jpg|png|webp|gif)",filename): raise ValueError("图片文件名无效")
                extension="."+filename.split(".")[-1];new_filename=secrets.token_hex(12)+extension;target=directory/new_filename
                shutil.copyfile(studio.DATA/"library-images"/filename,target);copied.append(target)
                gallery["artworks"].append({"id":secrets.token_hex(12),"src":"/gallery-media/"+new_filename,"title":source["name"],"description":"","width":source["width"],"height":source["height"],"scale":100,"hidden":False,"sourceAssetId":source_id})
            return gallery_store.save(studio,identifier,gallery)
        except Exception:
            for target in copied: target.unlink(missing_ok=True)
            raise
