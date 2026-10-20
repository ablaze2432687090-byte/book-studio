import io,json,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
from PIL import Image
import server
from scripts import project_tools as tools,asset_store as assets,gallery_store as galleries,studio_store

class CollectionRules(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory(prefix='studio-collection-test-');self.root=Path(self.temp.name)
  self.scope=patch.multiple(server,DATA=self.root,ALBUMS=self.root/'albums',PHOTOS=self.root/'photos',PROJECTS=self.root/'projects.json',LEGACY_CONFIG=self.root/'album.json',STATE_ROOT=self.root/'state')
  self.scope.start();server.atomic_json(server.LEGACY_CONFIG,server.DEFAULT_CONFIG);server.ensure_data()
 def tearDown(self):self.scope.stop();self.temp.cleanup()
 def test_book_archive_trash_root_and_restore(self):
  root=server.read_projects()['albums'][0]['id'];before=server.read_album(root)
  tools.book_action(server,root,'rename',{'title':'新主画册'})
  self.assertEqual(json.loads(server.LEGACY_CONFIG.read_text(encoding='utf8'))['title'],'新主画册')
  tools.book_action(server,root,'archive',{'archived':True})
  tools.book_action(server,root,'trash',{})
  self.assertEqual(server.read_projects()['albums'],[])
  self.assertTrue(tools.trash_list(server,'book')[0]['archived'])
  studio_store.validate_data(self.root)
  with self.assertRaises(FileNotFoundError):server.read_album(root)
  tools.restore_trash(server,'book',root)
  self.assertTrue(server.project_for(root)['archived'])
  self.assertEqual(server.read_album(root)['pages'],before['pages'])
  with self.assertRaises(ValueError):tools.restore_trash(server,'book',root)
  tools.book_action(server,root,'archive',{'archived':False})
  self.assertFalse(server.project_for(root)['archived'])
 def test_fresh_profile_has_no_author_projects(self):
  import tempfile
  with tempfile.TemporaryDirectory(prefix='studio-fresh-') as temporary:
   root=Path(temporary)
   with patch.multiple(server,DATA=root,ALBUMS=root/'albums',PHOTOS=root/'photos',PROJECTS=root/'projects.json',LEGACY_CONFIG=root/'album.json'):
    server.ensure_data();self.assertEqual(server.read_projects(),{'currentAlbumId':None,'albums':[]})
    created=server.create_album('First book');self.assertEqual(server.read_projects()['albums'][0]['id'],created['id'])
 def test_asset_archive_trash_restore_preserves_category(self):
  raw=io.BytesIO();Image.new('RGB',(20,30),'red').save(raw,'PNG');a=assets.upload(server,raw.getvalue(),'image/png','test')['asset']
  def change(value):return assets.mutate(server,{'version':assets.read(server)['version'],'ids':[a['id']],'changes':value})
  change({'archived':True});change({'trashed':True});restored=change({'trashed':False})['assets'][0]
  self.assertTrue(restored['archived']);self.assertFalse(restored['trashed']);self.assertTrue((self.root/'library-images'/Path(a['src']).name).is_file())
 def test_gallery_summary_contains_only_bounded_preview(self):
  g=galleries.create(server,'摘要测试');g['wall']='forest';g['frame']='brass';g['artworks']=[{'id':str(i),'src':'/gallery-media/test.png','width':20,'height':30,'title':'作品','description':'private detail'} for i in range(8)]
  galleries.save(server,g['id'],g);entry=galleries.listing(server)[0]
  self.assertEqual(entry['preview']['wall'],'forest');self.assertEqual(len(entry['preview']['artworks']),3)
  self.assertNotIn('description',entry['preview']['artworks'][0]);self.assertNotIn('artworks',entry)

if __name__=='__main__':unittest.main()
