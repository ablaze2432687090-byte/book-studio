"""Recoverable local project versions and reference-aware media maintenance."""
import copy
import hashlib
import json
import re
import secrets
import time
from pathlib import Path


def identifier(value):
    if not isinstance(value,str) or not re.fullmatch(r"[A-Za-z0-9_-]{1,80}",value):raise ValueError("项目编号无效")
    return value


def looks(studio,payload=None):
    path=studio.DATA/"tool-settings"/"gallery-looks.json"
    with studio.DATA_LOCK:
        state=json.loads(path.read_text(encoding="utf-8")) if path.is_file() else {"version":0,"looks":[]}
        if payload is None:return state
        if payload.get("version")!=state["version"]:raise ValueError("外观预设已更新，请重新打开后保存")
        from scripts import gallery_store
        allowed={"wall","floor","frame","lighting","mat","light","gap","artHeight","floorShine","wallTexture","ambient","frameWidth","frameDepth","matWidth","glass","lightTemperature","lightDirection","lightSpread"}
        if not isinstance(payload.get("looks"),list) or len(payload["looks"])>20:raise ValueError("外观预设最多保存 20 组")
        result=[]
        for item in payload["looks"]:
            if not isinstance(item,dict) or not isinstance(item.get("value"),dict):raise ValueError("外观预设格式无效")
            clean=gallery_store.clean({k:v for k,v in item["value"].items() if k in allowed},"preset")
            result.append({"name":str(item.get("name","")).strip()[:60] or "我的展厅外观","value":{k:clean[k] for k in allowed}})
        state={"version":state["version"]+1,"looks":result};studio.atomic_json(path,state);return state


def kind_check(kind):
    if kind not in {"book","gallery"}:raise ValueError("项目类型无效")
    return kind


def source_path(studio,kind,project_id):
    kind_check(kind);identifier(project_id)
    return studio.DATA/("albums" if kind=="book" else "galleries")/(project_id+".json")


def state_token(studio,kind,project_id):
    value=json.loads(source_path(studio,kind,project_id).read_text(encoding="utf-8"))
    return value.get("revision") if kind=="gallery" else hashlib.sha256(json.dumps(value,sort_keys=True,ensure_ascii=False).encode()).hexdigest()


def image_refs(value):
    return set(re.findall(r'/(?:media|gallery-media|library-media)/[A-Za-z0-9_-]+\.(?:jpg|jpeg|png|webp|gif)',json.dumps(value,ensure_ascii=False),re.I))


def capture(studio,kind,project_id,value,label="自动恢复点",force=False):
    folder=studio.DATA/"project-history"/kind_check(kind)/identifier(project_id)
    clean={k:v for k,v in value.items() if k not in {"revision","updatedAt","status","publishedAt","preparedAt","shareUrl"}}
    fingerprint=hashlib.sha256(json.dumps(clean,sort_keys=True,ensure_ascii=False).encode()).hexdigest()
    with studio.DATA_LOCK:
        folder.mkdir(parents=True,exist_ok=True)
        previous=sorted(folder.glob("*.json"),reverse=True)
        if previous:
            last=json.loads(previous[0].read_text(encoding="utf-8"))
            if last.get("hash")==fingerprint:return last["id"]
            if not force and time.time()-previous[0].stat().st_mtime<300 and image_refs(last["content"])==image_refs(value):return last["id"]
        version=str(time.time_ns())+"-"+secrets.token_hex(4)
        studio.atomic_json(folder/(version+".json"),{"id":version,"createdAt":studio.now_iso(),"label":str(label)[:80],"hash":fingerprint,"content":copy.deepcopy(value)})
        # Only this project's generated recovery points; retain latest 30.
        for old in sorted(folder.glob("*.json"),reverse=True)[30:]:old.unlink()
        return version


def versions(studio,kind,project_id):
    source_path(studio,kind,project_id)
    result=[]
    for path in sorted((studio.DATA/"project-history"/kind/project_id).glob("*.json"),reverse=True):
        value=json.loads(path.read_text(encoding="utf-8"));content=value["content"]
        result.append({"id":value["id"],"createdAt":value["createdAt"],"label":value["label"],"title":content.get("title",""),"count":len(content.get("pages",content.get("artworks",[])))})
    return result


def restore(studio,kind,project_id,version,expected):
    identifier(version);path=source_path(studio,kind,project_id)
    with studio.DATA_LOCK:
        current=json.loads(path.read_text(encoding="utf-8"))
        if state_token(studio,kind,project_id)!=expected:raise ValueError("项目已发生变化，请重新打开版本列表后恢复")
        value=json.loads((studio.DATA/"project-history"/kind/project_id/(version+".json")).read_text(encoding="utf-8"))["content"]
        for ref in image_refs(value):
            folder="photos" if ref.startswith("/media/") else "gallery-photos" if ref.startswith("/gallery-media/") else "library-images"
            if not (studio.DATA/folder/Path(ref).name).is_file():raise ValueError("恢复点的图片已缺失，未覆盖当前内容")
        capture(studio,kind,project_id,current,"恢复前自动保留",True)
        if kind=="gallery":
            from scripts import gallery_store
            value["revision"]=current["revision"]
            return gallery_store.save(studio,project_id,value)
        album=studio.sanitize_album(value,project_id);studio.atomic_json(path,album)
        if studio.project_for(project_id).get("isRoot"):studio.atomic_json(studio.LEGACY_CONFIG,{k:v for k,v in album.items() if k!="id"})
        project=studio.update_project_from_album(album)
        return studio.decorate_album(album,project)


def gallery_action(studio,project_id,action,payload):
    from scripts import gallery_store
    path=source_path(studio,"gallery",project_id)
    with studio.DATA_LOCK:
        value=gallery_store.read(studio,project_id)
        if action=="duplicate":
            new=gallery_store.create(studio,value["title"]+" · 副本");copied=copy.deepcopy(value);copied.update(id=new["id"],title=new["title"],revision=new["revision"],archived=False)
            return gallery_store.save(studio,new["id"],copied)
        if action=="rename":value["title"]=str(payload.get("title","")).strip()[:120] or value["title"];return gallery_store.save(studio,project_id,value)
        if action=="archive":value["archived"]=bool(payload.get("archived",True));return gallery_store.save(studio,project_id,value)
        if action=="trash":
            target=studio.DATA/"project-trash"/"gallery"/(project_id+".json")
            if target.exists():raise ValueError("回收站已有同编号项目")
            capture(studio,"gallery",project_id,value,"移入回收站前",True);target.parent.mkdir(parents=True,exist_ok=True);path.replace(target)
            return {"ok":True}
        raise ValueError("项目操作无效")


def book_action(studio,project_id,action,payload):
    path=source_path(studio,"book",project_id)
    with studio.DATA_LOCK:
        state=studio.read_projects();project=studio.project_for(project_id,state)
        value=studio.read_album(project_id)
        if action=="duplicate":return studio.duplicate_album(project_id)
        if action=="rename":
            title=str(payload.get("title","")).strip()[:120]
            if not title:raise ValueError("请输入项目名称")
            capture(studio,"book",project_id,value,"重命名前",True)
            value["title"]=title;studio.atomic_json(path,value)
            if project.get("isRoot"):studio.atomic_json(studio.LEGACY_CONFIG,{k:v for k,v in value.items() if k!="id"})
            return studio.decorate_album(value,studio.update_project_from_album(value))
        if action=="archive":
            project["archived"]=bool(payload.get("archived",True));studio.write_projects(state);return {"ok":True}
        if action=="trash":
            target=studio.DATA/"project-trash"/"book"/(project_id+".json")
            if target.exists():raise ValueError("回收站已有同编号项目")
            capture(studio,"book",project_id,value,"移入回收站前",True)
            studio.atomic_json(target,{**value,"_catalog":copy.deepcopy(project)})
            state["albums"]=[p for p in state["albums"] if p["id"]!=project_id]
            if state.get("currentAlbumId")==project_id:state["currentAlbumId"]=next((p["id"] for p in state["albums"] if not p.get("archived")),None)
            studio.write_projects(state);path.unlink()
            return {"ok":True}
        raise ValueError("项目操作无效")


def trash_list(studio,kind):
    kind_check(kind);result=[]
    for path in (studio.DATA/"project-trash"/kind).glob("*.json"):
        value=json.loads(path.read_text(encoding="utf-8"));catalog=value.get("_catalog",{})
        result.append({"id":path.stem,"title":value.get("title","未命名项目"),"count":len(value.get("artworks",value.get("pages",[]))),"pageCount":len(value.get("pages",[])),"archived":bool(catalog.get("archived",value.get("archived",False))),"updatedAt":value.get("updatedAt",catalog.get("updatedAt"))})
    return result


def restore_trash(studio,kind,project_id):
    target=source_path(studio,kind,project_id);source=studio.DATA/"project-trash"/kind/(project_id+".json")
    with studio.DATA_LOCK:
        if target.exists():raise ValueError("存在同编号项目，未覆盖")
        value=json.loads(source.read_text(encoding="utf-8"))
        if kind=="book":
            state=studio.read_projects()
            if any(p["id"]==project_id for p in state["albums"]):raise ValueError("项目列表存在同编号项目，未覆盖")
            catalog=value.pop("_catalog");state["albums"].insert(0,catalog);studio.atomic_json(target,value);studio.write_projects(state);source.unlink()
            if catalog.get("isRoot"):studio.atomic_json(studio.LEGACY_CONFIG,{k:v for k,v in value.items() if k!="id"})
        else:target.parent.mkdir(parents=True,exist_ok=True);source.replace(target)
    return {"ok":True}


LEASES={}


def lease(studio,token,refs):
    identifier(token)
    if not isinstance(refs,list) or len(refs)>125000:raise ValueError("图片保护数据无效")
    with studio.DATA_LOCK:LEASES[token]=(time.time(),image_refs(refs))
    return {"ok":True}


def storage(studio):
    refs=set();blocked=[]
    with studio.DATA_LOCK:
        for path in studio.DATA.rglob("*.json"):
            if "media-trash" in path.parts:continue
            try:refs.update(image_refs(json.loads(path.read_text(encoding="utf-8"))))
            except (ValueError,OSError):blocked.append(str(path.relative_to(studio.DATA)))
        for token,(at,values) in list(LEASES.items()):
            if time.time()-at>3600:LEASES.pop(token,None)
            else:refs.update(values)
        candidates=[];total=0
        for folder,prefix in [("photos","/media/"),("gallery-photos","/gallery-media/")]:
            for path in (studio.DATA/folder).glob("*"):
                if not path.is_file() or path.is_symlink():continue
                total+=path.stat().st_size
                if prefix+path.name not in refs and time.time()-path.stat().st_mtime>7*86400:candidates.append({"path":folder+"/"+path.name,"bytes":path.stat().st_size})
        digest=hashlib.sha256(json.dumps(candidates,sort_keys=True).encode()).hexdigest()
        return {"totalBytes":total,"unusedBytes":sum(item["bytes"] for item in candidates),"count":len(candidates),"candidates":candidates,"token":digest,"blocked":blocked}


def cleanup(studio,token):
    with studio.DATA_LOCK:
        state=storage(studio)
        if state["blocked"]:raise ValueError("有项目数据暂时无法校验，未清理任何图片")
        if state["token"]!=token:raise ValueError("素材引用已变化，请重新检查")
        batch=str(time.time_ns())+"-"+secrets.token_hex(3);folder=studio.DATA/"media-trash"/batch;folder.mkdir(parents=True,exist_ok=True)
        studio.atomic_json(folder/"manifest.json",state)
        for item in state["candidates"]:
            relative=Path(item["path"]);source=(studio.DATA/relative).resolve()
            if relative.is_absolute() or ".." in relative.parts or relative.parts[0] not in {"photos","gallery-photos"} or studio.DATA.resolve() not in source.parents:raise ValueError("清理目标无效")
            target=folder/relative;target.parent.mkdir(parents=True,exist_ok=True);source.replace(target)
        return {"ok":True,"batch":batch,"count":state["count"],"bytes":state["unusedBytes"]}


def undo_cleanup(studio):
    with studio.DATA_LOCK:
        batches=sorted((studio.DATA/"media-trash").glob("*"),reverse=True)
        if not batches:return {"ok":True,"count":0}
        folder=next((folder for folder in batches if not json.loads((folder/"manifest.json").read_text(encoding="utf-8")).get("restored")),None)
        if folder is None:return {"ok":True,"count":0}
        state=json.loads((folder/"manifest.json").read_text(encoding="utf-8"));count=0
        for item in state["candidates"]:
            relative=Path(item["path"])
            if relative.is_absolute() or ".." in relative.parts or relative.parts[0] not in {"photos","gallery-photos"}:raise ValueError("清理记录无效")
            source=folder/relative;target=studio.DATA/relative
            if source.exists() and not target.exists():target.parent.mkdir(parents=True,exist_ok=True);source.replace(target);count+=1
        state["restored"]=True;studio.atomic_json(folder/"manifest.json",state)
        return {"ok":True,"count":count}
