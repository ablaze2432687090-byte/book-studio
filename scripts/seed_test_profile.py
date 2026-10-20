"""Create synthetic desktop QA input, never import development project data."""
import os,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
target=Path(sys.argv[1]).resolve()
if not target.is_relative_to(root/'work'/'desktop-qa'):raise ValueError('QA data must stay within work/desktop-qa')
os.environ['BOOK_STUDIO_HOME']=str(target)
sys.path.insert(0,str(root))
import server
from scripts.synthetic_fixtures import seed
seed(server)
print('Synthetic desktop input created')
