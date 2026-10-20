import io,json,os,tempfile,threading,time,unittest
from pathlib import Path
from types import SimpleNamespace
from PIL import Image
import server
from scripts import gallery_store as gallery,project_tools as tools

class RecoveryContracts(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory(prefix='studio-recovery-test-');self.root=Path(self.temp.name)
  self.studio=SimpleNamespace(DATA=self.root,ROOT=server.ROOT,WEB=server.WEB,DATA_LOCK=threading.RLock(),atomic_json=server.atomic_json,now_iso=server.now_iso)
  (self.root/'gallery-photos').mkdir();Image.new('RGB',(80,100),'red').save(self.root/'gallery-photos'/'test.png')
 def tearDown(self):self.temp.cleanup()
 def test_restore_archive_copy_trash(self):
  g=gallery.create(self.studio,'原始展览');g['artworks']=[{'id':'a','title':'原作','src':'/gallery-media/test.png','width':80,'height':100}];g=gallery.save(self.studio,g['id'],g)
  point=tools.capture(self.studio,'gallery',g['id'],g,'确认版本',True);g['wall']='oak';g=gallery.save(self.studio,g['id'],g)
  with self.assertRaises(ValueError):tools.restore(self.studio,'gallery',g['id'],point,g['revision']-1)
  restored=tools.restore(self.studio,'gallery',g['id'],point,g['revision']);self.assertEqual(restored['wall'],'charcoal');self.assertEqual(len(restored['artworks']),1)
  new=tools.gallery_action(self.studio,g['id'],'duplicate',{});self.assertNotEqual(new['id'],g['id']);self.assertEqual(new['artworks'][0]['src'],g['artworks'][0]['src'])
  tools.gallery_action(self.studio,g['id'],'archive',{});self.assertTrue(gallery.read(self.studio,g['id'])['archived'])
  tools.gallery_action(self.studio,g['id'],'trash',{});self.assertEqual(len(tools.trash_list(self.studio,'gallery')),1);tools.restore_trash(self.studio,'gallery',g['id']);self.assertTrue(gallery.read(self.studio,g['id'])['archived'])
 def test_reference_aware_recoverable_cleanup(self):
  unused=self.root/'gallery-photos'/'unused.png';unused.write_bytes((self.root/'gallery-photos'/'test.png').read_bytes())
  for path in (self.root/'gallery-photos').iterdir():os.utime(path,(time.time()-9*86400,)*2)
  tools.lease(self.studio,'test-session',['/gallery-media/test.png']);state=tools.storage(self.studio);self.assertEqual(state['count'],1)
  result=tools.cleanup(self.studio,state['token']);self.assertEqual(result['count'],1);self.assertTrue((self.root/'gallery-photos'/'test.png').exists());self.assertFalse(unused.exists())
  self.assertEqual(tools.undo_cleanup(self.studio)['count'],1);self.assertTrue(unused.exists());self.assertEqual(tools.undo_cleanup(self.studio)['count'],0)
 def test_schema_and_export_check(self):
  from scripts.gallery_delivery import preflight
  g=gallery.clean({'wall':'marble','floor':'oak','frame':'silver','arrangement':'double','frameWidth':99,'lightTemperature':10000,'artworks':[{'id':'a','src':'/gallery-media/missing.png'}]},'new')
  self.assertEqual(g['frameWidth'],40);self.assertEqual(g['lightTemperature'],7500);self.assertEqual(g['arrangement'],'double');self.assertFalse(preflight(self.studio,g)['ok'])
  with self.assertRaises(ValueError):tools.source_path(self.studio,'gallery','../bad')

if __name__=='__main__':unittest.main()
