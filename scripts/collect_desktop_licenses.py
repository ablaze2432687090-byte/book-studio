"""Collect runtime license texts, not packages or user files."""
import importlib.metadata
import shutil
import sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
target=root/"work"/"desktop-licenses"
target.mkdir(parents=True,exist_ok=True)
python_license=Path(sys.base_prefix)/"LICENSE.txt"
if python_license.is_file():shutil.copy2(python_license,target/"PYTHON-LICENSE.txt")
for name in ["pillow","reportlab","charset-normalizer","pyinstaller"]:
    try: distribution=importlib.metadata.distribution(name)
    except importlib.metadata.PackageNotFoundError:continue
    for item in distribution.files or []:
        if any(word in item.name.lower() for word in ["license","copyright","copying"]):
            source=Path(distribution.locate_file(item))
            if source.is_file():shutil.copy2(source,target/(name+"-"+item.name))
print('Runtime licenses collected:',len(list(target.iterdir())))
