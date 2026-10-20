"""Packaged backend entry. Data never lives in the application installation."""
import json
import os
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import server
from scripts import studio_store

if __name__=="__main__":
    if len(sys.argv)>2 and sys.argv[1] in {"--import","--restore","--migrate"}:
        try:
            operation={"--import":studio_store.import_folder,"--restore":studio_store.restore,"--migrate":studio_store.migrate}[sys.argv[1]]
            print(json.dumps(operation(server,sys.argv[2]),ensure_ascii=False),flush=True)
        except Exception as error:
            print(json.dumps({"ok":False,"error":str(error)},ensure_ascii=False),flush=True);sys.exit(1)
    else:
        server.ensure_data()
        from scripts.ai_studio import recover_jobs
        recover_jobs()
        http=server.ThreadingHTTPServer(("127.0.0.1",0),server.AlbumHandler)
        http.daemon_threads=True
        print(json.dumps({"ready":True,"port":http.server_address[1]}),flush=True)
        http.serve_forever()
