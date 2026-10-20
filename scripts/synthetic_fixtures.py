"""Generated geometric fixtures only. No personal artwork or repository data."""
import copy
from PIL import Image, ImageDraw

def seed(studio):
    studio.PHOTOS.mkdir(parents=True,exist_ok=True)
    colors=[('#14161d','#c60036'),('#102d2d','#55c8ac'),('#252134','#c6a8ed'),('#172131','#80baff')]
    pages=[]
    for index,(background,accent) in enumerate(colors):
        image=Image.new('RGB',(900,1200),background);draw=ImageDraw.Draw(image)
        for ring in range(6):
            inset=100+ring*35
            draw.ellipse((inset,200+ring*35,900-inset,1000-ring*35),outline=accent,width=3)
        draw.line((100,1070,800,1070),fill=accent,width=6)
        filename=f'synthetic-{index}.png';image.save(studio.PHOTOS/filename)
        pages.append({'id':f'page-{index}','name':f'Study {index+1:02d}','src':'/media/'+filename,'color':background})
    album=copy.deepcopy(studio.DEFAULT_CONFIG)
    album.update(id='sample-book',title='ORBIT / Visual study',ratio='4:3',landscape=False,pages=pages)
    album=studio.sanitize_album(album,'sample-book')
    studio.atomic_json(studio.album_path('sample-book'),album)
    studio.atomic_json(studio.PROJECTS,{'currentAlbumId':'sample-book','albums':[{'id':'sample-book','slug':'sample-book','title':album['title'],'pageCount':4,'coverSrc':pages[0]['src'],'isRoot':False,'createdAt':studio.now_iso(),'updatedAt':studio.now_iso()}]})
    return album
