from __future__ import annotations

import base64
import copy
import json
import mimetypes
import math
import os
import re
import secrets
import sys
import threading
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, quote, unquote, urlparse

ROOT = Path(os.environ.get("BOOK_STUDIO_RESOURCE_ROOT", Path(__file__).resolve().parent)).resolve()
WEB = ROOT / "web"
STATE_ROOT = Path(os.environ.get("BOOK_STUDIO_HOME", ROOT)).resolve()
DATA = Path(os.environ.get("BOOK_STUDIO_DATA", STATE_ROOT / "data")).resolve()
PHOTOS = DATA / "photos"
ALBUMS = DATA / "albums"
PROJECTS = DATA / "projects.json"
LEGACY_CONFIG = DATA / "album.json"
MAX_UPLOAD_BYTES = 25 * 1024 * 1024
MAX_JSON_BYTES = 2 * 1024 * 1024
DATA_LOCK = threading.RLock()
EXPORT_LOCK = threading.BoundedSemaphore(2)
ALLOWED_RATIOS = {"16:9", "4:3", "16:10", "2:3", "1:1", "2:1", "1.618:1", "custom"}


DEFAULT_CONFIG = {
    "title": "未命名画册",
    "ratio": "4:3",
    "landscape": False,
    "fit": "contain",
    "margin": 0,
    "shadow": True,
    "material": "none",
    "materialScope": "all", "gloss": 45,
    "lightDirection": 0, "lightTemperature": 5500, "shadowSoftness": 50,
    "texture": 0,
    "thickness": 3,
    "edgeColor": "ivory",
    "cornerRadius": 3,
    "contactShadow": 42,
    "coverFinish": "none",
    "flipSpeed": 760,
    "shadowOpacity": 42,
    "turnStyle": "natural",
    "immersive": True,
    "introMotion": True,
    "scene": "charcoal",
    "lighting": "soft",
    "lightIntensity": 50,
    "customWidth": 3,
    "customHeight": 4,
    "backgroundImage": "",
    "pages": [
        {"id": "cover", "name": "封面", "color": "#171719", "cover": True},
        {"id": "p1", "name": "内页 01", "color": "#d2d0ca"},
        {"id": "p2", "name": "内页 02", "color": "#d2d0ca"},
        {"id": "back", "name": "封底", "color": "#171719", "cover": True},
    ],
}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def atomic_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    temporary.replace(path)


def slugify(value: str, fallback: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug[:48] or fallback


def album_path(album_id: str) -> Path:
    safe_id = re.sub(r"[^a-zA-Z0-9_-]", "", album_id)
    if safe_id != album_id or not safe_id:
        raise ValueError("画册编号无效")
    return ALBUMS / f"{safe_id}.json"


def sanitize_album(payload: dict, album_id: str) -> dict:
    ratio = str(payload.get("ratio", "4:3"))
    if ratio == "3:4":
        ratio = "4:3"
    elif ratio == "4:5":
        ratio = "custom"
        payload = {**payload, "customWidth": 4, "customHeight": 5}
    fit = payload.get("fit", "contain")
    material = payload.get("material", "none")
    cover_finish = payload.get("coverFinish", "none")
    scene = payload.get("scene", "charcoal")
    def effect_int(key,default,minimum,maximum):
        try:
            value=float(payload.get(key,default))
            return int(max(minimum,min(maximum,value))) if math.isfinite(value) else default
        except (TypeError,ValueError):
            return default
    pages = payload.get("pages", [])
    if not isinstance(pages, list) or len(pages) < 2:
        raise ValueError("画册至少需要封面和封底")
    allowed_pages = []
    for index, page in enumerate(pages):
        if not isinstance(page, dict):
            continue
        item = {
            "id": str(page.get("id") or secrets.token_hex(8))[:80],
            "name": str(page.get("name") or f"页面 {index + 1}")[:160],
            "color": str(page.get("color") or "#d2d0ca")[:32],
        }
        source = str(page.get("src") or "")
        if source.startswith("/media/"):
            item["src"] = f"/media/{Path(unquote(source.removeprefix('/media/'))).name}"
        if isinstance(page.get("crop"), dict):
            crop = page["crop"]
            mode = crop.get("fit", fit)
            mode = mode if mode in {"contain", "cover"} else "contain"
            def bounded_crop(key, default, minimum, maximum):
                try:
                    value = float(crop.get(key, default))
                    return max(minimum, min(maximum, value)) if math.isfinite(value) else default
                except (TypeError, ValueError):
                    return default
            item["crop"] = {"fit": mode, "zoom": bounded_crop("zoom", 1, 1 if mode == "cover" else .25, 4), "x": bounded_crop("x", 0, -1, 1), "y": bounded_crop("y", 0, -1, 1)}
        if index == 0 or index == len(pages) - 1:
            item["cover"] = True
        allowed_pages.append(item)
    return {
        "id": album_id,
        "title": str(payload.get("title", "未命名画册"))[:120],
        "ratio": ratio if ratio in ALLOWED_RATIOS else "4:3",
        "landscape": bool(payload.get("landscape", False)),
        "fit": fit if fit in {"cover", "contain"} else "contain",
        "margin": max(0, min(60, int(payload.get("margin", 0)))),
        "shadow": bool(payload.get("shadow", True)),
        "material": material if material in {"none", "matte", "fine", "linen", "pearl", "holographic", "kraft", "recycled", "cotton", "coated", "photo", "leather", "suede", "grid", "ribbed", "hammered"} else "none",
        "materialScope": str(payload.get("materialScope","all")) if payload.get("materialScope","all") in {"all","cover","pages"} else "all",
        "gloss": effect_int("gloss",45,0,100),
        "lightDirection": effect_int("lightDirection",0,-90,90),
        "lightTemperature": effect_int("lightTemperature",5500,2700,7500),
        "shadowSoftness": effect_int("shadowSoftness",50,0,100),
        "texture": max(0, min(24, int(payload.get("texture", 0)))),
        "thickness": max(1, min(5, int(payload.get("thickness", 3)))),
        "edgeColor": str(payload.get("edgeColor", "ivory")) if str(payload.get("edgeColor", "ivory")) in {"ivory", "white", "gray", "black", "kraft"} else "ivory",
        "cornerRadius": max(0, min(8, int(payload.get("cornerRadius", 3)))),
        "contactShadow": max(0, min(70, int(payload.get("contactShadow", 42)))),
        "coverFinish": cover_finish if cover_finish in {"none", "matte", "linen", "soft-touch"} else "none",
        "flipSpeed": max(450, min(1200, int(payload.get("flipSpeed", 760)))),
        "shadowOpacity": max(10, min(60, int(payload.get("shadowOpacity", 42)))),
        "turnStyle": str(payload.get("turnStyle", "natural")) if str(payload.get("turnStyle", "natural")) in {"natural", "soft", "crisp"} else "natural",
        "immersive": bool(payload.get("immersive", True)),
        "introMotion": bool(payload.get("introMotion", True)),
        "scene": scene if scene in {"charcoal", "gallery", "burgundy", "warm", "concrete", "custom", "midnight", "forest", "graphite", "ivory", "dark-wood", "light-wood", "marble", "dark-marble", "leather-desk", "studio"} else "charcoal",
        "lighting": str(payload.get("lighting", "soft")) if str(payload.get("lighting", "soft")) in {"none", "soft", "side", "gallery", "window-left", "window-right", "top", "warm", "cool", "spot", "rim"} else "soft",
        "lightIntensity": max(0, min(100, int(payload.get("lightIntensity", 50)))),
        "customWidth": max(0.1, min(100, float(payload.get("customWidth", 3)))),
        "customHeight": max(0.1, min(100, float(payload.get("customHeight", 4)))),
        "backgroundImage": str(payload.get("backgroundImage", "")) if str(payload.get("backgroundImage", "")).startswith("/media/") else "",
        "pages": allowed_pages,
    }


def ensure_data() -> None:
    PHOTOS.mkdir(parents=True, exist_ok=True)
    ALBUMS.mkdir(parents=True, exist_ok=True)
    if PROJECTS.exists():
        return
    if not LEGACY_CONFIG.exists():
        atomic_json(PROJECTS,{"currentAlbumId":None,"albums":[]})
        return
    legacy = json.loads(LEGACY_CONFIG.read_text(encoding="utf-8"))
    album_id = "cubid"
    album = sanitize_album(legacy, album_id)
    atomic_json(album_path(album_id), album)
    created = now_iso()
    atomic_json(PROJECTS, {
        "currentAlbumId": album_id,
        "albums": [{
            "id": album_id, "slug": "cubid", "title": album["title"],
            "pageCount": len(album["pages"]), "coverSrc": album["pages"][0].get("src", ""),
            "isRoot": True, "createdAt": created,
            "updatedAt": created,
        }],
    })


def read_projects() -> dict:
    ensure_data()
    return json.loads(PROJECTS.read_text(encoding="utf-8"))


def write_projects(payload: dict) -> None:
    atomic_json(PROJECTS, payload)


def read_album(album_id: str) -> dict:
    target = album_path(album_id)
    if not target.is_file():
        raise FileNotFoundError("画册不存在")
    album = json.loads(target.read_text(encoding="utf-8"))
    album["id"] = album_id
    return album


def project_for(album_id: str, projects: dict | None = None) -> dict:
    state = projects or read_projects()
    project = next((item for item in state["albums"] if item["id"] == album_id), None)
    if not project:
        raise FileNotFoundError("画册不存在")
    return project




def decorate_album(album: dict, project: dict) -> dict:
    result = copy.deepcopy(album)
    result.update({
        "id": project["id"], "slug": project["slug"],
        "updatedAt": project.get("updatedAt"),
    })
    return result


def update_project_from_album(album: dict) -> dict:
    with DATA_LOCK:
        state = read_projects()
        project = project_for(album["id"], state)
        project.update({
            "title": album["title"], "pageCount": len(album["pages"]),
            "coverSrc": album["pages"][0].get("src", ""), "updatedAt": now_iso(),
        })
        write_projects(state)
        return copy.deepcopy(project)


def list_album_summaries() -> dict:
    state = read_projects()
    albums = []
    for project in state["albums"]:
        item = copy.deepcopy(project)
        for key in ("status", "shareUrl", "publishedAt", "preparedAt"):
            item.pop(key, None)
        albums.append(item)
    return {"currentAlbumId": state.get("currentAlbumId"), "albums": albums}


def create_album(title: str = "未命名画册") -> dict:
    with DATA_LOCK:
        state = read_projects()
        album_id = secrets.token_hex(6)
        used_slugs = {item["slug"] for item in state["albums"]}
        base = slugify(title, f"album-{album_id[:6]}")
        slug = base
        suffix = 2
        while slug in used_slugs:
            slug = f"{base}-{suffix}"
            suffix += 1
        album = sanitize_album({**copy.deepcopy(DEFAULT_CONFIG), "title": title}, album_id)
        atomic_json(album_path(album_id), album)
        created = now_iso()
        project = {
            "id": album_id, "slug": slug, "title": album["title"], "pageCount": len(album["pages"]),
            "coverSrc": "", "isRoot": False, "createdAt": created,
            "updatedAt": created,
        }
        state["albums"].insert(0, project)
        state["currentAlbumId"] = album_id
        write_projects(state)
        return decorate_album(album, project)


def duplicate_album(source_id: str) -> dict:
    with DATA_LOCK:
        source = read_album(source_id)
        duplicate = create_album(f"{source['title']} 副本")
        copied = copy.deepcopy(source)
        copied["id"] = duplicate["id"]
        copied["title"] = f"{source['title']} 副本"
        clean = sanitize_album(copied, duplicate["id"])
        atomic_json(album_path(duplicate["id"]), clean)
        project = update_project_from_album(clean)
        return decorate_album(clean, project)


def referenced_photo(filename: str) -> bool:
    if any(f"/media/{filename}" in config.read_text(encoding="utf-8") for config in ALBUMS.glob("*.json")): return True
    from scripts.ai_studio import LOCK
    with LOCK:
        return any(f"/media/{filename}" in config.read_text(encoding="utf-8") for config in (DATA / "ai-jobs").glob("*.json"))


class AlbumHandler(SimpleHTTPRequestHandler):
    def parse_request(self):
        if not super().parse_request():
            return False
        token = os.environ.get("BOOK_STUDIO_SESSION_TOKEN", "")
        if token:
            from http.cookies import SimpleCookie
            cookie = SimpleCookie()
            try:
                cookie.load(self.headers.get("Cookie", ""))
                provided = cookie.get("book_studio_session")
                value = self.headers.get("X-Book-Studio-Token", "") or (provided.value if provided else "")
            except Exception:
                value = ""
            if not secrets.compare_digest(value, token):
                self.send_json({"error": "仅允许桌面客户端访问此会话"}, 403)
                return False
        return True

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB), **kwargs)

    def end_headers(self):
        path = urlparse(self.path).path
        if path in {"/", "/album/"} or (not path.startswith("/media/") and Path(path).suffix in {".html", ".js", ".css"}):
            self.send_header("Cache-Control", "no-cache, must-revalidate")
        super().end_headers()

    def send_json(self, payload: object, status: int = 200) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)

    def read_json(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        if length > MAX_JSON_BYTES:
            raise ValueError("请求内容过大")
        return json.loads(self.rfile.read(length).decode("utf-8")) if length else {}

    def route_parts(self) -> list[str]:
        return [unquote(part) for part in urlparse(self.path).path.strip("/").split("/") if part]

    def ai_access(self, write=False):
        # AI settings and paid requests belong only to the local desktop user.
        from urllib.parse import urlsplit
        allowed = {"127.0.0.1", "localhost", "::1"}
        hostname = urlsplit("http://" + self.headers.get("Host", "")).hostname
        origin = self.headers.get("Origin")
        if self.client_address[0] not in allowed or hostname not in allowed or (origin and origin != "http://" + self.headers.get("Host", "")):
            self.send_json({"ok":False,"error":"AI 设置与生成仅允许当前电脑后台访问"},403)
            return False
        if write and self.headers.get("Content-Type", "").split(";")[0] != "application/json":
            self.send_json({"ok":False,"error":"请求格式应为 JSON"},400)
            return False
        return True

    def local_tool_write(self, json_only=True):
        """New tool stores are local-only; reject cross-site write requests."""
        from urllib.parse import urlsplit
        host = self.headers.get("Host", "")
        origin = self.headers.get("Origin")
        if self.client_address[0] not in {"127.0.0.1","localhost","::1"} or urlsplit("http://"+host).hostname not in {"127.0.0.1","localhost","::1"} or (origin and origin != "http://"+host):
            self.send_json({"error":"展厅与图库仅允许当前电脑后台执行修改"},403); return False
        if json_only and self.headers.get("Content-Type", "").split(";")[0] != "application/json":
            self.send_json({"error":"请求格式应为 JSON"},400); return False
        return True

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path
        parts = self.route_parts()
        try:
            if path == "/api/studio/status":
                if not self.ai_access(): return
                from scripts import studio_store
                self.send_json(studio_store.status(sys.modules[__name__])); return
            if path == "/api/studio/settings":
                if not self.ai_access(): return
                from scripts import studio_store
                self.send_json(studio_store.settings(sys.modules[__name__])); return
            if parts[:2] == ["api", "ai"]:
                if not self.ai_access(): return
                from scripts import ai_studio as ai
                if parts == ["api","ai","settings"]: self.send_json(ai.read_settings()); return
                if parts == ["api","ai","jobs"]: self.send_json({"jobs":ai.list_jobs()}); return
                if len(parts) == 4 and parts[2] == "jobs": self.send_json({"job":ai.read_job(parts[3])}); return
                self.send_error(404); return
            if path == "/api/health":
                self.send_json({"ok": True, "galleryVersion": 1, "libraryVersion": 1, "desktopVersion": 1})
                return
            if parts == ["api","library"]:
                from scripts import asset_store
                self.send_json(asset_store.view(sys.modules[__name__])); return
            if parts[:2] == ["api", "galleries"]:
                from scripts import gallery_store as gallery
                if len(parts) == 2: self.send_json({"galleries": gallery.listing(sys.modules[__name__])}); return
                if len(parts) == 3: self.send_json(gallery.read(sys.modules[__name__], parts[2])); return
                if len(parts)==4 and parts[3]=="preflight":
                    from scripts import gallery_delivery
                    self.send_json(gallery_delivery.preflight(sys.modules[__name__],gallery.read(sys.modules[__name__],parts[2])));return
                if len(parts) == 4 and parts[3] == "export":
                    if not EXPORT_LOCK.acquire(blocking=False):
                        self.send_json({"error":"当前有展示包正在导出，请稍后再试"},503); return
                    target = None
                    try:
                        format=parse_qs(parsed.query).get("format",["offline"])[0]
                        if format=="offline":target = gallery.export(sys.modules[__name__], parts[2])
                        else:
                            from scripts import gallery_delivery
                            target=gallery_delivery.standalone(sys.modules[__name__],parts[2],format)
                        self.send_response(200)
                        self.send_header("Content-Type", "application/pdf" if target.suffix==".pdf" else "application/zip")
                        self.send_header("Content-Length",str(target.stat().st_size))
                        self.send_header("Content-Disposition", "attachment; filename=BOOK-STUDIO-gallery-" + parts[2] + target.suffix)
                        self.send_header("Cache-Control", "no-store")
                        self.end_headers()
                        with target.open("rb") as handle:
                            while chunk := handle.read(512 * 1024): self.wfile.write(chunk)
                    finally:
                        if target is not None: target.unlink(missing_ok=True)
                        EXPORT_LOCK.release()
                    return
                self.send_error(404); return
            if parts[:2] == ["api","local-projects"]:
                from scripts import project_tools as projects
                if parts==["api","local-projects","storage"]:self.send_json(projects.storage(sys.modules[__name__]));return
                if parts==["api","local-projects","looks"]:self.send_json(projects.looks(sys.modules[__name__]));return
                if len(parts)==5 and parts[4]=="history":
                    with DATA_LOCK:self.send_json({"versions":projects.versions(sys.modules[__name__],parts[2],parts[3]),"expected":projects.state_token(sys.modules[__name__],parts[2],parts[3])})
                    return
                if len(parts)==4 and parts[3]=="trash":self.send_json({"items":projects.trash_list(sys.modules[__name__],parts[2])});return
                self.send_error(404);return
            if path == "/api/albums":
                self.send_json(list_album_summaries())
                return
            if len(parts) == 4 and parts[:2] == ["api", "albums"] and parts[3] == "export":
                if not EXPORT_LOCK.acquire(blocking=False):
                    self.send_json({"ok": False, "error": "当前有画册正在导出，请稍后再试"}, 503)
                    return
                try:
                    project_for(parts[2])
                    with DATA_LOCK:
                        album = copy.deepcopy(read_album(parts[2]))
                    query = parse_qs(parsed.query)
                    from scripts.export_album import export_album
                    from scripts import studio_store
                    target = export_album(album, query.get("format", ["pdf"])[0], query.get("layout", ["single"])[0], query.get("quality", ["high"])[0], language=studio_store.settings(sys.modules[__name__])["language"])
                    body = target.read_bytes()
                    self.send_response(200)
                    self.send_header("Content-Type", "application/pdf" if target.suffix == ".pdf" else "application/zip")
                    self.send_header("Content-Length", str(len(body)))
                    self.send_header("Content-Disposition", f"attachment; filename*=UTF-8''{quote(target.name)}")
                    self.send_header("Cache-Control", "no-store")
                    self.end_headers()
                    self.wfile.write(body)
                finally:
                    EXPORT_LOCK.release()
                return
            if len(parts) == 3 and parts[:2] == ["api", "albums"]:
                with DATA_LOCK:
                    state = read_projects()
                    project = project_for(parts[2], state)
                    state["currentAlbumId"] = parts[2]
                    write_projects(state)
                self.send_json(decorate_album(read_album(parts[2]), project))
                return
            if path == "/api/album":
                album_id = parse_qs(parsed.query).get("id", [None])[0]
                state = read_projects()
                album_id = album_id or state.get("currentAlbumId") or next((p["id"] for p in state["albums"] if not p.get("archived")),None)
                if not album_id:raise FileNotFoundError("没有正常画册，请从项目中心新建或恢复画册")
                self.send_json(decorate_album(read_album(album_id), project_for(album_id, state)))
                return
            if path.startswith("/gallery-preview/"):
                from scripts import gallery_store
                target = gallery_store.thumbnail(sys.modules[__name__], unquote(path.split("/", 2)[2]))
                body = target.read_bytes()
                self.send_response(200)
                self.send_header("Content-Type", "image/jpeg")
                self.send_header("Content-Length", str(len(body)))
                self.send_header("Cache-Control", "private, max-age=3600")
                self.end_headers()
                self.wfile.write(body)
                return
            if path.startswith(("/media/", "/gallery-media/", "/library-media/")):
                gallery_media = path.startswith("/gallery-media/")
                filename = Path(unquote(path.split("/",2)[2])).name
                target = (DATA / "library-images" if path.startswith("/library-media/") else DATA / "gallery-photos" if gallery_media else PHOTOS) / filename
                if not target.is_file():
                    self.send_error(404)
                    return
                content = target.read_bytes()
                self.send_response(200)
                self.send_header("Content-Type", mimetypes.guess_type(target.name)[0] or "application/octet-stream")
                self.send_header("Content-Length", str(len(content)))
                self.send_header("Cache-Control", "public, max-age=31536000, immutable")
                self.send_header("X-Content-Type-Options", "nosniff")
                self.end_headers()
                self.wfile.write(content)
                return
            super().do_GET()
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            return  # The browser closed; do not attempt a second response.
        except FileNotFoundError as exc:
            self.send_json({"ok": False, "error": str(exc)}, 404)
        except ValueError as exc:
            self.send_json({"ok": False, "error": str(exc)}, 400)
        except (OSError, ImportError, RuntimeError) as exc:
            self.send_json({"ok": False, "error": str(exc) if parts[:2] == ["api","ai"] else f"操作未完成：{exc}"}, 500)

    def do_PUT(self) -> None:
        parts = self.route_parts()
        try:
            if parts == ["api", "studio", "settings"]:
                if not self.local_tool_write(): return
                from scripts import studio_store
                self.send_json(studio_store.save_settings(sys.modules[__name__], self.read_json())); return
            if len(parts) == 3 and parts[:2] == ["api", "galleries"]:
                if not self.local_tool_write(): return
                from scripts import gallery_store as gallery
                self.send_json(gallery.save(sys.modules[__name__], parts[2], self.read_json())); return
            if parts == ["api","ai","settings"]:
                if not self.ai_access(True): return
                from scripts import ai_studio as ai
                self.send_json(ai.save_settings(self.read_json())); return
            if len(parts) != 3 or parts[:2] != ["api", "albums"]:
                self.send_error(404)
                return
            album_id = parts[2]
            payload = self.read_json()
            with DATA_LOCK:
                project_for(album_id)
                album = sanitize_album(payload, album_id)
                from scripts import project_tools
                project_tools.capture(sys.modules[__name__],"book",album_id,read_album(album_id))
                atomic_json(album_path(album_id), album)
                if project_for(album_id).get("isRoot"):
                    atomic_json(LEGACY_CONFIG, {key: value for key, value in album.items() if key != "id"})
                project = update_project_from_album(album)
            self.send_json({"ok": True, "album": decorate_album(album, project)})
        except FileNotFoundError as exc:
            self.send_json({"ok": False, "error": str(exc)}, 404)
        except (ValueError, json.JSONDecodeError) as exc:
            self.send_json({"ok": False, "error": str(exc)}, 400)
        except (OSError, RuntimeError) as exc:
            self.send_json({"ok":False,"error":str(exc)},500)

    def do_POST(self) -> None:
        parts = self.route_parts()
        try:
            if parts[:2]==["api","local-projects"]:
                if not self.local_tool_write():return
                from scripts import project_tools as projects
                payload=self.read_json()
                if not isinstance(payload,dict):raise ValueError("项目操作数据无效")
                if parts==["api","local-projects","looks"]:self.send_json(projects.looks(sys.modules[__name__],payload));return
                if parts==["api","local-projects","media-lease"]:self.send_json(projects.lease(sys.modules[__name__],payload.get("token"),payload.get("refs")));return
                if parts==["api","local-projects","cleanup"]:self.send_json(projects.cleanup(sys.modules[__name__],payload.get("token")));return
                if parts==["api","local-projects","undo-cleanup"]:self.send_json(projects.undo_cleanup(sys.modules[__name__]));return
                if len(parts)==5:
                    kind,identifier,action=parts[2:]
                    if action=="snapshot":
                        value=json.loads(projects.source_path(sys.modules[__name__],kind,identifier).read_text(encoding="utf-8"))
                        self.send_json({"id":projects.capture(sys.modules[__name__],kind,identifier,value,payload.get("label","手动恢复点"),True)});return
                    if action=="restore-version":self.send_json(projects.restore(sys.modules[__name__],kind,identifier,payload.get("version"),payload.get("expected")));return
                    if action=="restore-trash":self.send_json(projects.restore_trash(sys.modules[__name__],kind,identifier));return
                    if kind=="gallery":self.send_json(projects.gallery_action(sys.modules[__name__],identifier,action,payload));return
                    if kind=="book":self.send_json(projects.book_action(sys.modules[__name__],identifier,action,payload));return
                self.send_error(404);return
            if parts == ["api", "studio", "backup"]:
                if not self.local_tool_write(): return
                from scripts import studio_store
                self.read_json()
                self.send_json(studio_store.backup(sys.modules[__name__])); return
            if len(parts)>1 and parts[0]=="api" and parts[1] in {"galleries","gallery-images","library","library-folders","library-images"}:
                if not self.local_tool_write(parts[1] not in {"gallery-images","library-images"}): return
            if parts == ["api","library","batch"]:
                from scripts import asset_store
                self.send_json(asset_store.mutate(sys.modules[__name__],self.read_json())); return
            if parts == ["api","library-folders"] or (len(parts)==4 and parts[:2]==["api","library-folders"] and parts[3] in {"rename","delete"}):
                from scripts import asset_store
                self.send_json(asset_store.folder(sys.modules[__name__],self.read_json(),parts[2] if len(parts)==4 else None,len(parts)==4 and parts[3]=="delete")); return
            if len(parts)==4 and parts[:2]==["api","galleries"] and parts[3]=="import-assets":
                from scripts import asset_store
                self.send_json(asset_store.import_gallery(sys.modules[__name__],parts[2],self.read_json())); return
            if parts == ["api", "galleries"]:
                from scripts import gallery_store as gallery
                payload = self.read_json()
                if not isinstance(payload,dict): raise ValueError("展厅数据必须为对象")
                self.send_json(gallery.create(sys.modules[__name__], str(payload.get("title") or "未命名展厅")),201); return
            if parts[:2] == ["api","ai"]:
                if not self.ai_access(True): return
                from scripts import ai_studio as ai
                payload = self.read_json()
                if not isinstance(payload,dict): raise ValueError("请求内容必须为对象")
                if parts == ["api","ai","prompt"]: self.send_json({"prompt":ai.build_prompt(payload.get("brief",{}))}); return
                if parts == ["api","ai","test"]: self.send_json(ai.test_connection()); return
                if parts == ["api","ai","jobs"]: self.send_json({"job":ai.start_job(payload)},201); return
                if len(parts) == 5 and parts[2] == "jobs":
                    result = ai.change_job(parts[3],parts[4],payload)
                    self.send_json(result if parts[4] == "import" else {"job":result}); return
                self.send_error(404); return
            if parts == ["api", "albums"]:
                payload = self.read_json()
                self.send_json({"ok": True, "album": create_album(str(payload.get("title") or "未命名画册"))}, 201)
                return
            if len(parts) == 4 and parts[:2] == ["api", "albums"] and parts[3] == "duplicate":
                self.send_json({"ok": True, "album": duplicate_album(parts[2])}, 201)
                return
            if parts in (["api", "images"], ["api", "gallery-images"], ["api","library-images"]):
                content_type = self.headers.get("Content-Type", "").split(";", 1)[0].strip().lower()
                if content_type == "application/json":
                    payload = self.read_json()
                    match = re.fullmatch(r"data:(image/(?:jpeg|png|webp|gif));base64,(.+)", payload.get("data", ""), re.S)
                    if not match:
                        raise ValueError("仅支持 JPG、PNG、WebP 或 GIF 图片")
                    content_type = match.group(1)
                    raw = base64.b64decode(match.group(2), validate=True)
                else:
                    length = int(self.headers.get("Content-Length", "0"))
                    if length <= 0 or length > MAX_UPLOAD_BYTES:
                        raise ValueError("图片为空或超过 25MB")
                    raw = self.rfile.read(length)
                if len(raw) > MAX_UPLOAD_BYTES:
                    raise ValueError("单张图片不能超过 25MB")
                signatures = {
                    "image/jpeg": raw.startswith(b"\xff\xd8\xff"),
                    "image/png": raw.startswith(b"\x89PNG\r\n\x1a\n"),
                    "image/webp": len(raw) >= 12 and raw[:4] == b"RIFF" and raw[8:12] == b"WEBP",
                    "image/gif": raw.startswith((b"GIF87a", b"GIF89a")),
                }
                if content_type not in signatures or not signatures[content_type]:
                    raise ValueError("图片内容与文件格式不一致")
                if parts == ["api","library-images"]:
                    from scripts import asset_store
                    self.send_json(asset_store.upload(sys.modules[__name__],raw,content_type,unquote(self.headers.get("X-File-Name","未命名图片"))),201); return
                extension = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif"}[content_type]
                filename = f"{secrets.token_hex(12)}{extension}"
                gallery_upload = parts == ["api", "gallery-images"]
                destination = DATA / "gallery-photos" if gallery_upload else PHOTOS
                destination.mkdir(parents=True, exist_ok=True)
                target = destination / filename
                temporary = target.with_suffix(target.suffix + ".tmp")
                temporary.write_bytes(raw)
                temporary.replace(target)
                self.send_json({"ok": True, "src": f"/{'gallery-media' if gallery_upload else 'media'}/{filename}"}, 201)
                return
            self.send_error(404)
        except FileNotFoundError as exc:
            self.send_json({"ok": False, "error": str(exc)}, 404)
        except (ValueError, KeyError, json.JSONDecodeError) as exc:
            self.send_json({"ok": False, "error": str(exc)}, 400)
        except (OSError, RuntimeError, ImportError) as exc:
            self.send_json({"ok":False,"error":str(exc)},500)

    def do_DELETE(self) -> None:
        parts = self.route_parts()
        try:
            if len(parts) == 3 and parts[:2] == ["api", "albums"]:
                if not self.local_tool_write():return
                from scripts import project_tools
                self.send_json(project_tools.book_action(sys.modules[__name__],parts[2],"trash",{}))
                return
            if len(parts) == 3 and parts[:2] == ["api", "images"]:
                filename = Path(parts[2]).name
                target = PHOTOS / filename
                retained = referenced_photo(filename)
                if target.is_file() and not retained:
                    target.unlink()
                self.send_json({"ok": True, "retained": retained})
                return
            self.send_error(404)
        except (FileNotFoundError, ValueError) as exc:
            self.send_json({"ok": False, "error": str(exc)}, 400)


if __name__ == "__main__":
    import sys
    sys.modules.setdefault("server", sys.modules[__name__])
    ensure_data()
    from scripts.ai_studio import recover_jobs
    recover_jobs()
    host = os.environ.get("CUBID_HOST", "127.0.0.1")
    print(f"画册后台已启动：http://127.0.0.1:4173（仅当前电脑可访问）")
    ThreadingHTTPServer((host, 4173), AlbumHandler).serve_forever()
