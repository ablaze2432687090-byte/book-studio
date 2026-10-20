from __future__ import annotations

import json
import copy
import hashlib
import re
import os
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(os.environ.get("BOOK_STUDIO_RESOURCE_ROOT", Path(__file__).resolve().parents[1])).resolve()

SOURCE = ROOT / "web" / "album"








def local_photo_name(value: str) -> str | None:
    if not value.startswith("/media/"):
        return None
    return Path(unquote(value.removeprefix("/media/"))).name


def rewrite_media(value: str, required: set[str]) -> str:
    name = local_photo_name(value)
    if not name:
        return value
    required.add(name)
    return f"/assets/photos/{name}"


def asset_name(source: Path) -> str:
    digest = hashlib.sha256(source.read_bytes()).hexdigest()[:12]
    return f"{source.stem}.{digest}{source.suffix}"


def render_album(album: dict, template: str, required: set[str], assets: dict[str, str]) -> str:
    public_album = copy.deepcopy({key: value for key, value in album.items() if key not in {"_project","aging","agingStyle"}})
    for page in public_album.get("pages", []):
        if page.get("src"):
            page["src"] = rewrite_media(page["src"], required)
    if public_album.get("backgroundImage"):
        public_album["backgroundImage"] = rewrite_media(public_album["backgroundImage"], required)
    payload = json.dumps(public_album, ensure_ascii=False, separators=(",", ":"))
    payload = payload.replace("</", "<\\/").replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")
    html = template.replace(
        "<!-- PUBLIC_ALBUM_DATA -->",
        f"<script>window.__PUBLIC_ALBUM__={payload};</script>",
        1,
    )
    html = html.replace('    <a class="viewer-nav" href="/">← 返回编辑</a>\n', "", 1)
    html = re.sub(r'href="styles\.css[^"]*"', f'href="/assets/runtime/{assets["styles.css"]}"', html, count=1)
    html = re.sub(r'src="composition\.js[^"]*"', f'src="/assets/runtime/{assets["composition.js"]}"', html, count=1)
    for name,attr in (("presentation.css","href"),("presentation.js","src")):
        html = re.sub(rf'{attr}="{re.escape(name)}[^"]*"', f'{attr}="/assets/runtime/{assets.get(name,name)}"', html, count=1)
    html = re.sub(
        r"runtime\.src\s*=\s*['\"][^'\"]*page-flip\.browser\.js[^'\"]*['\"]",
        f"runtime.src = '/assets/runtime/{assets['page-flip.browser.js']}'",
        html,
        count=1,
    )
    html = re.sub(
        r"controller\.src\s*=\s*['\"][^'\"]*flipbook\.js[^'\"]*['\"]",
        f"controller.src = '/assets/runtime/{assets['flipbook.js']}'",
        html,
        count=1,
    )
    for name in ['i18n-catalog.js','studio-i18n.js','viewer-locale.js']:
        html=html.replace('src="/'+name+'"','src="/assets/runtime/'+name+'"')
    return html
