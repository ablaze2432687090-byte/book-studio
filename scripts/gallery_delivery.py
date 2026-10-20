"""Self-contained gallery handoff assets. No network, credentials or editor data."""
import copy
import io
import json
import math
import tempfile
import zipfile
from pathlib import Path


def preflight(studio,gallery):
    shown=[a for a in gallery["artworks"] if not a.get("hidden")];missing=[];size=0;seen=set();warnings=[]
    for item in shown:
        path=studio.DATA/"gallery-photos"/Path(item["src"]).name
        if not path.is_file():missing.append(item["title"])
        elif path.name not in seen:size+=path.stat().st_size;seen.add(path.name)
        if len(item.get("title",""))>60 or len(item.get("description",""))>600:warnings.append("长文字请在作品详情中查看："+item["title"][:60])
    return {"count":len(shown),"hidden":len(gallery["artworks"])-len(shown),"bytes":size,"missing":missing,"warnings":warnings[:20],"ok":bool(shown) and not missing}


def font():
    from scripts.pdf_fonts import register
    return register('GalleryCN')


def pdfs(studio,gallery):
    from scripts import studio_store
    english=studio_store.settings(studio)['language']=='en'
    from reportlab.pdfgen import canvas
    from reportlab.lib.colors import HexColor
    from reportlab.lib.utils import ImageReader
    from reportlab.pdfbase import pdfmetrics
    font();W,H=595.28,841.89
    def text(c,x,y,value,size=10,color="#efede7",limit=515):
        c.setFillColor(HexColor(color));c.setFont("GalleryCN",size);lines=[];line=""
        for char in str(value):
            if char=='\n' or pdfmetrics.stringWidth(line+char,"GalleryCN",size)>limit:lines.append(line);line="" if char=='\n' else char
            else:line+=char
        lines.append(line)
        for n,line in enumerate(lines):c.drawString(x,H-y-n*size*1.65-size,line)
        return len(lines)*size*1.65
    def base(c,page,label):
        c.setFillColor(HexColor('#111114'));c.rect(0,0,W,H,fill=1,stroke=0)
        c.setFont('Helvetica-Bold',13);c.setFillColor(HexColor('#eeece7'));c.drawString(40,H-48,'BOOK STUDIO')
        c.setStrokeColor(HexColor('#38383f'));c.line(40,H-72,W-40,H-72);c.line(40,54,W-40,54)
        text(c,40,H-40,label,8,'#9999a6');text(c,W-90,H-40,str(page).zfill(2),8,'#9999a6')
    guide=io.BytesIO();c=canvas.Canvas(guide,pagesize=(W,H));c.setTitle('Gallery viewing guide' if english else '展厅使用指南');base(c,1,'EXHIBITION / VIEWING GUIDE')
    text(c,40,100,'Give your work room to breathe.' if english else '让作品，自由展开。',25 if english else 28);text(c,40,151,'Pan / explore details / take a fullscreen tour' if english else '平移浏览 / 作品细节 / 全屏导览',11,'#a7a5af')
    c.setFillColor(HexColor('#26262c'));c.roundRect(40,H-368,515,172,7,fill=1,stroke=0)
    for i,(x,w) in enumerate([(83,92),(251,92),(419,92)]):
        c.setFillColor(HexColor('#08080b'));c.rect(x-5,H-326,w+10,105,fill=1,stroke=0)
        c.setFillColor(HexColor('#ad1740'));c.rect(x,H-321,w,95,fill=1,stroke=0)
        c.setStrokeColor(HexColor('#c2a572'));c.line(x-16,H-341,x+w+16,H-341)
    text(c,172,346,'<  An expanding exhibition wall  >' if english else '←  横向延展的作品展墙  →',10,'#b9b6c2',300)
    steps=[('01','浏览展墙','电脑：拖动、滚轮或触控板平移，也可用左右方向键。\n手机 / 平板：横向滑动浏览；横屏观看空间更充足。'),('02','查看细节','点击作品查看原图与完整说明，详情中可左右切换。\n手机可左右轻扫详情图片。点击空白处或 Esc 返回展墙。'),('03','自由观看','观看缩放不改变作品尺寸；“视图”菜单可查看整体布展。\n作品总览、展区跳转、搜索与自动导览帮助定位作品。'),('04','保存与转发','完整解压后打开“打开展厅.html”，保留 assets 文件夹。\n无需联网或启动后台。转发完整 ZIP，文件为导出时固定版本。')]
    if english:steps=[('01','Browse the wall','Desktop: drag, scroll, or use keyboard arrows to pan.\nPhone / tablet: swipe; landscape gives more viewing space.'),('02','Explore details','Click artwork to view the original and full description.\nUse arrows or swipe to browse; click outside or press Esc to close.'),('03','View your way','Zoom changes the view, not artwork size. Use View to fit the wall.\nOverview, search, sections, and automatic tours help you navigate.'),('04','Keep it together','Extract the ZIP, then open Open-Gallery.html beside assets.\nNo internet or server required. Send the complete ZIP snapshot.')]
    y=398
    for number,title,body in steps:
        text(c,40,y,number,11,'#e12458');text(c,80,y-3,title,14);text(c,80,y+24,body,9,'#b3b0bb',472);y+=86
    c.showPage();c.save()
    catalog=io.BytesIO();c=canvas.Canvas(catalog,pagesize=(W,H));c.setTitle(gallery['title']+(' - Artwork catalog' if english else ' - 作品目录'))
    items=[a for a in gallery['artworks'] if not a.get('hidden')]
    for start in range(0,len(items),4):
        base(c,start//4+1,'EXHIBITION / WORK CATALOG');text(c,40,96,gallery['title'][:26],19);text(c,40,136,('Artwork catalog · '+str(len(items))+' on display' if english else '作品目录 · '+str(len(items))+' 件展出')+(' · '+gallery['curator'][:36] if gallery.get('curator') else ''),9,'#9999a6')
        for offset,item in enumerate(items[start:start+4]):
            from scripts import gallery_store
            x=40+(offset%2)*269;y=178+(offset//2)*283;path=gallery_store.thumbnail(studio,Path(item['src']).name)
            c.setFillColor(HexColor('#1c1c22'));c.rect(x,H-y-177,246,177,fill=1,stroke=0)
            c.drawImage(ImageReader(str(path)),x+8,H-y-169,width=230,height=161,preserveAspectRatio=True,anchor='c',mask='auto')
            used=text(c,x,y+188,str(start+offset+1).zfill(2)+' / '+item['title'][:38],10,limit=246)
            detail=' · '.join(str(item.get(k,'')) for k in ['author','year','dimensions'] if item.get(k));text(c,x,y+192+min(used,34),detail[:50] or item.get('section','')[:25],8,'#a8a5b1',246)
            text(c,x,y+258,item.get('section','')[:27],8,'#e12458',246)
        c.showPage()
    c.save();return guide.getvalue(),catalog.getvalue()


def panorama(studio,gallery):
    """A bounded 2D wall overview for handoff, not a substitute for interactive lighting."""
    from PIL import Image,ImageOps,ImageDraw
    colors={'white':'#e4e2dd','warm':'#9a8d7e','ivory':'#e7dfcd','plaster':'#c6bdb0','linen':'#b2a58b','oak':'#ac8c60','walnut':'#514033','marble':'#d5d2c9','slate':'#343c40','burgundy':'#4c202b','forest':'#243a30','navy':'#182131','charcoal':'#303033','concrete':'#696965'}
    items=[a for a in gallery['artworks'] if not a.get('hidden')];chunks=[]
    # Bounded panels avoid huge canvas memory on long walls.
    for start in range(0,len(items),12):
        subset=items[start:start+12];canvas=Image.new('RGB',(2400,900),colors.get(gallery['wall'],'#303033'));draw=ImageDraw.Draw(canvas);draw.rectangle((0,755,2400,900),fill='#242426')
        cell=2200/max(1,len(subset));x=100
        for item in subset:
            with Image.open(studio.DATA/'gallery-photos'/Path(item['src']).name) as raw:image=ImageOps.exif_transpose(raw).convert('RGB');image.thumbnail((max(20,int(cell-34)),480),Image.Resampling.LANCZOS)
            w,h=image.size;y=(755-h)//2;frame=item.get('frame','inherit');frame=gallery['frame'] if frame=='inherit' else frame
            fw=int(item.get('frameWidth') or gallery.get('frameWidth',8)) if frame!='none' else 0
            border={'white':'#e8e5dd','brass':'#a98b4b','silver':'#b0b2b5','oak':'#987442','wood':'#987442','walnut':'#493022'}.get(frame,'#141416')
            px=int(x+(cell-w)/2);draw.rectangle((px-fw,y-fw,px+w+fw,y+h+fw),fill=border);canvas.paste(image,(px,y));x+=cell
        output=io.BytesIO();canvas.save(output,'JPEG',quality=92);chunks.append((f'展墙总览-{start//12+1:02}.jpg',output.getvalue()))
    return chunks


def standalone(studio,identifier,format):
    from scripts import gallery_store
    gallery=copy.deepcopy(gallery_store.read(studio,identifier));check=preflight(studio,gallery)
    if not check['ok']:raise ValueError('请添加显示中的作品，并修复缺失图片后再导出')
    folder=getattr(studio,'STATE_ROOT',studio.ROOT)/'work'/'gallery-exports';folder.mkdir(parents=True,exist_ok=True)
    suffix='.pdf' if format in {'guide','catalog'} else '.zip'
    with tempfile.NamedTemporaryFile(prefix='gallery-',suffix=suffix,dir=folder,delete=False) as handle:target=Path(handle.name)
    try:
        if format in {'guide','catalog'}:target.write_bytes(pdfs(studio,gallery)[0 if format=='guide' else 1])
        elif format in {'panorama','sections'}:
            with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as archive:
                if format=='panorama':groups=[gallery]
                else:
                    groups=[]
                    for name in dict.fromkeys(a.get('section','') for a in gallery['artworks'] if not a.get('hidden')):groups.append({**gallery,'artworks':[a for a in gallery['artworks'] if a.get('section','')==name]})
                for n,group in enumerate(groups,1):
                    for name,data in panorama(studio,group):archive.writestr(f'{n:02}/'+name,data)
                archive.writestr('说明.txt','本文件为二维展墙编排总览，长展墙每 12 件分幅。动态灯光、玻璃反光请以离线互动展示包为准。')
        else:raise ValueError('不支持的展厅导出格式')
        return target
    except Exception:target.unlink(missing_ok=True);raise
