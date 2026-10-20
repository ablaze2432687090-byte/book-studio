import hashlib
import json
import sys
import tempfile
import threading
import unittest
import zipfile
from pathlib import Path
from types import SimpleNamespace
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import server
from scripts import studio_store as store

class DesktopDataContracts(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory(prefix="book-desktop-test-")
        self.root=Path(self.temp.name)
        self.studio=SimpleNamespace(ROOT=server.ROOT,STATE_ROOT=self.root,DATA=self.root/"data",DATA_LOCK=threading.RLock(),atomic_json=server.atomic_json,now_iso=server.now_iso)
        self.studio.DATA.mkdir();(self.studio.DATA/"albums").mkdir();(self.studio.DATA/"photos").mkdir()
        (self.studio.DATA/"photos"/"test.jpg").write_bytes(b"original-photo")
        server.atomic_json(self.studio.DATA/"projects.json",{"albums":[{"id":"sample"}]})
        server.atomic_json(self.studio.DATA/"albums"/"sample.json",{"pages":[{"src":"/media/test.jpg"}]})
    def tearDown(self):self.temp.cleanup()
    def test_backup_restore_and_recovery(self):
        (self.root/".private").mkdir();(self.root/".private"/"secret").write_text("must-not-leak")
        snapshot=store.backup(self.studio);archive=self.root/"backups"/snapshot["name"]
        with zipfile.ZipFile(archive) as bundle:
            self.assertFalse(any("private" in name for name in bundle.namelist()))
            manifest=json.loads(bundle.read("manifest.json"))
            for name,meta in manifest["files"].items():self.assertEqual(hashlib.sha256(bundle.read(name)).hexdigest(),meta["sha256"])
        (self.studio.DATA/"photos"/"test.jpg").write_bytes(b"changed")
        result=store.restore(self.studio,archive)
        self.assertEqual((self.studio.DATA/"photos"/"test.jpg").read_bytes(),b"original-photo")
        self.assertEqual((self.root/result["recovery"]/"photos"/"test.jpg").read_bytes(),b"changed")
    def test_tamper_and_traversal_never_replace_data(self):
        snapshot=store.backup(self.studio);archive=self.root/"backups"/snapshot["name"]
        with zipfile.ZipFile(archive) as bundle:entries={name:bundle.read(name) for name in bundle.namelist()}
        entries['data/photos/test.jpg']=b'tampered'
        broken=self.root/'broken.zip'
        with zipfile.ZipFile(broken,'w') as bundle:
            for name,raw in entries.items():bundle.writestr(name,raw)
        with self.assertRaises(ValueError):store.restore(self.studio,broken)
        manifest={'schemaVersion':1,'files':{'data/../../outside':{'bytes':1,'sha256':hashlib.sha256(b'x').hexdigest()}}}
        with zipfile.ZipFile(broken,'w') as bundle:bundle.writestr('manifest.json',json.dumps(manifest));bundle.writestr('data/../../outside',b'x')
        with self.assertRaises(ValueError):store.restore(self.studio,broken)
        self.assertEqual((self.studio.DATA/'photos'/'test.jpg').read_bytes(),b'original-photo')
        self.assertFalse((self.root/'outside').exists())
    def test_import_copies_source_and_rejects_missing_image(self):
        import shutil
        source=self.root/'source';shutil.copytree(self.studio.DATA,source)
        original=(source/'projects.json').read_bytes()
        store.import_folder(self.studio,source)
        self.assertEqual((source/'projects.json').read_bytes(),original)
        (source/'photos'/'test.jpg').unlink()
        with self.assertRaises(ValueError):store.import_folder(self.studio,source)
        self.assertTrue((self.studio.DATA/'photos'/'test.jpg').is_file())
    def test_preferences_and_retention(self):
        self.assertFalse(store.settings(self.studio)['confirmExit'])
        self.assertEqual(store.settings(self.studio)['language'],'zh-CN')
        with self.assertRaises(ValueError):store.save_settings(self.studio,{'language':'unsupported'})
        store.save_settings(self.studio,{'language':'en'})
        self.assertEqual(store.settings(self.studio)['language'],'en')
        with self.assertRaises(ValueError):store.save_settings(self.studio,{'density':'bad'})
        store.save_settings(self.studio,{'density':'compact','backupKeep':3})
        for _ in range(5):store.backup(self.studio)
        self.assertEqual(len(store.backups(self.studio)),3)
        self.assertEqual(store.settings(self.studio)['density'],'compact')

    def test_migration_is_verified_and_original_is_preserved(self):
        target=self.root/'external'/'BOOK STUDIO Data'
        result=store.migrate(self.studio,target)
        self.assertTrue(result['ok'])
        self.assertEqual((target/'photos/test.jpg').read_bytes(),b'original-photo')
        self.assertEqual((self.studio.DATA/'photos/test.jpg').read_bytes(),b'original-photo')
        with self.assertRaises(ValueError):store.migrate(self.studio,target)
        with self.assertRaises(ValueError):store.migrate(self.studio,self.studio.DATA/'nested')

    def test_external_backup_path_and_unowned_archives_preserved(self):
        from unittest.mock import patch
        directory=self.root/'external-backups';directory.mkdir()
        unowned=directory/'BOOK-STUDIO-other-workspace.zip';unowned.write_bytes(b'not-owned')
        with patch.dict('os.environ',{'BOOK_STUDIO_BACKUPS':str(directory)}):
            store.save_settings(self.studio,{'backupKeep':3})
            for _ in range(5):store.backup(self.studio)
            self.assertEqual(len(store.backups(self.studio)),4)
            self.assertEqual(unowned.read_bytes(),b'not-owned')

if __name__=='__main__':unittest.main()
