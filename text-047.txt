"""Isolated test storage for both collections. Never writes real project data."""
import sys
import tempfile
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import server
scratch=tempfile.TemporaryDirectory(prefix="book-studio-gallery-test-")
server.DATA=Path(scratch.name)
server.STATE_ROOT=Path(scratch.name)/"app-state"
server.ALBUMS=server.DATA/"albums"
server.PHOTOS=server.DATA/"photos"
server.PHOTOS.mkdir()
server.PROJECTS=server.DATA/"projects.json"
server.LEGACY_CONFIG=server.DATA/"album.json"
from scripts.synthetic_fixtures import seed
seed(server)
print("Isolated gallery test server http://127.0.0.1:4187",flush=True)
server.ThreadingHTTPServer(('127.0.0.1',4187),server.AlbumHandler).serve_forever()
