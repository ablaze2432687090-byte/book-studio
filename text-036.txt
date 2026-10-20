param([string]$Python = 'python')
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Push-Location $projectRoot
try {
  # Install build tools in a dedicated environment; never modify the application data.
  & $Python -m PyInstaller --noconfirm --onedir --name BookStudioService --distpath work/desktop-backend --workpath work/desktop-pyinstaller --specpath work --paths . --collect-submodules reportlab --hidden-import PIL.Image --hidden-import PIL.ImageOps --hidden-import charset_normalizer --exclude-module numpy --exclude-module tkinter --exclude-module scipy --exclude-module matplotlib --exclude-module qrcode desktop/service_entry.py
  if ($LASTEXITCODE -ne 0) { throw 'Backend packaging failed.' }
} finally { Pop-Location }
