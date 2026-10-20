"""Storage contracts use temporary folders, no real book modifications."""
import hashlib
import io
import json
import re
import sys
import tempfile
import threading
import unittest
import zipfile
from pathlib import Path
from types import SimpleNamespace
from PIL import Image
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import server
from scripts import asset_store,gallery_store


class StoreContracts(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory(prefix='studio-store-contract-')
        self.studio=SimpleNamespace(DATA=Path(self.temp.name),STATE_ROOT=Path(self.temp.name)/'app-state',ROOT=server.ROOT,WEB=server.WEB,DATA_LOCK=threading.RLock(),atomic_json=server.atomic_json,now_iso=server.now_iso)
        self.before={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in (server.DATA/'albums').glob('*.json')}

    def tearDown(self):
        for name,digest in self.before.items():self.assertEqual(hashlib.sha256(Path(name).read_bytes()).hexdigest(),digest)
        self.temp.cleanup()

    def image(self,format='PNG'):
        buffer=io.BytesIO();Image.new('RGB',(36,48),'#aa2244').save(buffer,format=format);return buffer.getvalue()

    def test_image_formats_and_dedup(self):
        for fmt,mime in [('PNG','image/png'),('JPEG','image/jpeg'),('WEBP','image/webp'),('GIF','image/gif')]:
            result=asset_store.upload(self.studio,self.image(fmt),mime,'作品.'+fmt.lower())
            self.assertEqual(result['asset']['width'],36);self.assertEqual(result['asset']['height'],48)
            repeat=asset_store.upload(self.studio,self.image(fmt),mime,'same')
            self.assertTrue(repeat['duplicate']);self.assertEqual(repeat['asset']['id'],result['asset']['id'])
        self.assertEqual(len(asset_store.read(self.studio)['assets']),4)

    def test_copy_isolation_trash_and_export(self):
        result=asset_store.upload(self.studio,self.image(),'image/png','独立素材')
        gallery=gallery_store.create(self.studio,'测试展厅')
        gallery=asset_store.import_gallery(self.studio,gallery['id'],{'ids':[result['asset']['id']],'revision':gallery['revision']})
        self.assertEqual(gallery['artworks'][0]['sourceAssetId'],result['asset']['id'])
        state=asset_store.read(self.studio)
        asset_store.mutate(self.studio,{'version':state['version'],'ids':[result['asset']['id']],'changes':{'trashed':True,'name':'改名'}})
        self.assertEqual(gallery_store.read(self.studio,gallery['id'])['artworks'][0]['title'],'独立素材')
        self.assertTrue((self.studio.DATA/'gallery-photos'/gallery['artworks'][0]['src'].split('/')[-1]).is_file())
        package=gallery_store.export(self.studio,gallery['id'])
        try:
            with zipfile.ZipFile(package) as archive:
                self.assertIsNone(archive.testzip())
                html=archive.read('打开展厅.html').decode()
                self.assertNotIn('sourceAssetId',html)
                self.assertNotIn('gallery-authoring.js',html)
                self.assertNotIn('project-recovery.js',html)
                payload=json.loads(re.search(r'<script id="galleryData" type="application/json">(.*?)</script>',html).group(1))
                self.assertEqual(len(payload['artworks']),1)
                self.assertNotIn('revision',payload)
                self.assertNotIn('archived',payload)
                self.assertTrue(all(a['src'].startswith('assets/') for a in payload['artworks']))
        finally:package.unlink()
        gallery['artworks'][0]['hidden']=True;gallery=gallery_store.save(self.studio,gallery['id'],gallery)
        with self.assertRaises(ValueError):gallery_store.export(self.studio,gallery['id'])

    def test_conflicts_schema_and_foreign_paths(self):
        gallery=gallery_store.create(self.studio,'test')
        updated=gallery_store.save(self.studio,gallery['id'],gallery)
        with self.assertRaises(ValueError):gallery_store.save(self.studio,gallery['id'],gallery)
        with self.assertRaises(ValueError):gallery_store.clean({**updated,'schemaVersion':2},gallery['id'])
        with self.assertRaises(ValueError):gallery_store.clean({**updated,'artworks':[{'id':'a','src':'/media/book.png'}]},gallery['id'])
        with self.assertRaises(ValueError):gallery_store.read(self.studio,'../book')
        state=asset_store.folder(self.studio,{'version':0,'name':'品牌'})
        with self.assertRaises(ValueError):asset_store.folder(self.studio,{'version':0,'name':'旧窗口'})
        self.assertEqual(len(state['folders']),1)

    def test_local_write_guard(self):
        responses=[]
        request=SimpleNamespace(headers={'Host':'127.0.0.1:4173','Content-Type':'application/json','Origin':'https://outside.example'},client_address=('127.0.0.1',0),send_json=lambda data,status:responses.append(status))
        self.assertFalse(server.AlbumHandler.local_tool_write(request));self.assertEqual(responses[-1],403)
        request.headers['Origin']='http://127.0.0.1:4173';self.assertTrue(server.AlbumHandler.local_tool_write(request))
        request.headers['Content-Type']='text/plain';self.assertFalse(server.AlbumHandler.local_tool_write(request));self.assertEqual(responses[-1],400)


if __name__=='__main__':unittest.main()
