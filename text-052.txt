"""Generate fresh exports only from a synthetic test profile."""
import os,sys,shutil
from pathlib import Path
root=Path(__file__).resolve().parents[1];area=Path(sys.argv[1]).resolve()
if not area.is_relative_to(root/'work/desktop-qa'):raise ValueError('Only QA profiles are accepted')
os.environ['BOOK_STUDIO_HOME']=str(area/'profile');sys.path.insert(0,str(root))
import server
from scripts import export_album,gallery_store,studio_store
studio_store.save_settings(server,{'language':'en'})
export_album.export_album(server.read_album('sample-book'),'offline',language='en')
for gallery in gallery_store.listing(server):
    target=gallery_store.export(server,gallery['id']);shutil.copy2(target,area/'profile/output/exports/Gallery.zip')
print('Fresh QA exports generated')
