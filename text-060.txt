"""Isolated local fake-provider checks. Never touches real albums, keys or photos."""
import base64
import os
import io
import json
import sys
import tempfile
import threading
import time
import unittest
from pathlib import Path
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from PIL import Image
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import server
from scripts import ai_studio as ai

scratch = tempfile.TemporaryDirectory(prefix='book-studio-ai-check-')
server.DATA = Path(scratch.name)
server.ALBUMS = server.DATA/'albums'
server.PROJECTS = server.DATA/'projects.json'
server.LEGACY_CONFIG = server.DATA/'album.json'
server.PHOTOS = server.DATA/'photos'
server.PHOTOS.mkdir()
ai.settings_path = lambda: server.DATA/'private'/'ai-settings.json'
server.ensure_data()
server.AlbumHandler.log_message = lambda self,*args: None
image_buffer=io.BytesIO()
Image.new('RGB',(240,320),'#133319').save(image_buffer,'PNG')
fixture=image_buffer.getvalue()
encoded=base64.b64encode(fixture).decode()

class FakeProvider(BaseHTTPRequestHandler):
    calls=0
    fail_at=0
    delay=.08
    edits=0
    def log_message(self,*args): pass
    def send(self,payload,status=200):
        content=json.dumps(payload).encode(); self.send_response(status)
        self.send_header('Content-Type','application/json'); self.send_header('Content-Length',str(len(content))); self.end_headers(); self.wfile.write(content)
    def do_GET(self):
        if self.path == '/fixture.png':
            self.send_response(200); self.send_header('Content-Type','image/png'); self.send_header('Content-Length',str(len(fixture))); self.end_headers(); self.wfile.write(fixture)
        else: self.send({'data':[{'id':'test-image-model'}]})
    def do_POST(self):
        raw=self.rfile.read(int(self.headers.get('Content-Length','0')))
        type(self).calls+=1
        if self.path.endswith('/edits'):
            assert b'name="image[]"' in raw
            type(self).edits+=1
        else: assert json.loads(raw)['n']==1
        current=type(self).calls; time.sleep(type(self).delay)
        if current==type(self).fail_at:
            self.send({'error':{'message':'fixture-key rate limit'}},429)
        else: self.send({'data':[{'b64_json':encoded}]})

provider=ThreadingHTTPServer(('127.0.0.1',0),FakeProvider)
threading.Thread(target=provider.serve_forever,daemon=True).start()
settings={'provider':'compatible','baseUrl':f'http://127.0.0.1:{provider.server_port}/v1','model':'test-image-model','apiKey':'fixture-key','inputMode':'references'}
ai.save_settings(settings)
app=ThreadingHTTPServer(('127.0.0.1',int(os.environ.get('BOOK_STUDIO_AI_TEST_PORT','4185')) if '--serve' in sys.argv else 0),server.AlbumHandler)
base=f'http://127.0.0.1:{app.server_port}'

def call(path,payload=None,method=None,origin=None):
    headers={'Content-Type':'application/json'}
    if origin: headers['Origin']=origin
    data=json.dumps(payload).encode() if payload is not None else None
    with urlopen(Request(base+path,data=data,headers=headers,method=method),timeout=15) as response: return json.load(response)

def finished(job):
    for _ in range(150):
        job=call('/api/ai/jobs/'+job['id'])['job']
        if job['status'] in ai.TERMINAL and not ai.WORKER_LOCK.locked(): return job
        time.sleep(.03)
    raise AssertionError('job timeout')

if '--serve' in sys.argv:
    FakeProvider.delay=.35
    print('Isolated AI UI server '+base,flush=True)
    app.serve_forever()
else:
    threading.Thread(target=app.serve_forever,daemon=True).start()
    class Tests(unittest.TestCase):
        def test_optional_prompt_settings_security(self):
            public=call('/api/ai/settings')
            self.assertTrue(public['hasKey']); self.assertNotIn('apiKey',public)
            self.assertNotIn('fixture-key',ai.settings_path().read_text())
            self.assertEqual(ai.protect(ai.protect('fixture-roundtrip'),True),'fixture-roundtrip')
            self.assertTrue(call('/api/ai/test',{})['modelListed'])
            text=call('/api/ai/prompt',{'brief':{'title':'Natural Lens','count':8,'width':1800,'height':2400,'palette':'黑底荧光绿'}})['prompt']
            self.assertIn('1800 × 2400',text); self.assertIn('包含封面与封底',text); self.assertIn('黑底荧光绿',text)
            english=call('/api/ai/prompt',{'brief':{'uiLanguage':'en','title':'保留原文','count':4}})['prompt']
            self.assertIn('Total pages: 4',english);self.assertIn('保留原文',english);self.assertIn('not operational instructions',english)
            before=call('/api/ai/settings')
            try:call('/api/ai/settings',{**settings,'model':'must-not-apply'},'PUT','https://untrusted.example')
            except HTTPError as caught:self.assertEqual(caught.code,403)
            except ConnectionAbortedError:
                # Windows can reset a rejected connection with an unread body.
                if sys.platform!='win32':raise
            else:self.fail('Cross-site settings mutation was accepted')
            self.assertEqual(call('/api/ai/settings'),before,'Rejected requests must not modify settings or stop the service')
            with self.assertRaises(ValueError): ai.save_settings({'baseUrl':'http://localhost:9876/v1'})
        def test_generate_fail_retry_import(self):
            FakeProvider.fail_at=FakeProvider.calls+2
            filename='fixture.png'; (server.PHOTOS/filename).write_bytes(fixture)
            before=len(server.read_projects()['albums'])
            job=finished(call('/api/ai/jobs',{'brief':{'title':'测试生成','count':3},'references':['/media/'+filename]})['job'])
            self.assertEqual(job['status'],'failed'); self.assertEqual([p['status'] for p in job['items']],['ready','failed','queued'])
            self.assertNotIn('fixture-key',json.dumps(job)); self.assertTrue(server.referenced_photo(filename))
            calls=FakeProvider.calls
            job=finished(call('/api/ai/jobs/'+job['id']+'/retry',{})['job'])
            self.assertEqual(job['status'],'complete'); self.assertEqual(FakeProvider.calls-calls,2)
            self.assertEqual(job['items'][0]['attempts'],1)
            self.assertGreaterEqual(FakeProvider.edits,3)
            result=call('/api/ai/jobs/'+job['id']+'/import',{'indices':[0,1,2]})['album']
            self.assertEqual(len(result['pages']),3); self.assertEqual(result['ratio'],'custom')
            duplicate=call('/api/ai/jobs/'+job['id']+'/import',{'indices':[0,1,2]})['album']
            self.assertEqual(result['id'],duplicate['id']); self.assertEqual(len(server.read_projects()['albums']),before+1)
        def test_cancel_and_restart_recovery(self):
            FakeProvider.delay=.35
            job=call('/api/ai/jobs',{'brief':{'title':'停止测试','count':3}})['job']
            time.sleep(.08)
            job=finished(call('/api/ai/jobs/'+job['id']+'/cancel',{})['job'])
            self.assertEqual(job['status'],'cancelled'); self.assertLessEqual(sum(p['attempts'] for p in job['items']),1)
            job['status']='running'; job['items'][1]['status']='running'; ai.save_job(job)
            calls=FakeProvider.calls; ai.recover_jobs(); job=ai.read_job(job['id'])
            self.assertEqual(job['status'],'interrupted'); self.assertEqual(job['items'][1]['status'],'failed'); self.assertEqual(FakeProvider.calls,calls)
            FakeProvider.delay=.08
        def test_missing_key_and_normal_creation(self):
            call('/api/ai/settings',{'clearKey':True},'PUT')
            self.assertFalse(call('/api/ai/settings')['hasKey'])
            self.assertIn('prompt',call('/api/ai/prompt',{'brief':{}}))
            self.assertIn('album',call('/api/albums',{'title':'普通新建仍可用'}))
            with self.assertRaises(HTTPError) as caught: call('/api/ai/jobs',{'brief':{}})
            self.assertEqual(caught.exception.code,400)
            ai.save_settings(settings)
    unittest.main(argv=[sys.argv[0]])
