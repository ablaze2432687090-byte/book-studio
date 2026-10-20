# BOOK STUDIO

[简体中文](README.md)

A local-first Windows studio for page-turn books, expanding horizontal galleries, and shared image assets. Switch between Simplified Chinese and English in Settings. Your artwork and project text are never translated.

**0.3.1 public preview.** Unsigned, manual updates only. Independent clean-machine acceptance is still pending. BOOK STUDIO and Skill Canvas are separate projects with separate installations and project stores.

## Download and update

Open [Releases](https://github.com/ablaze2432687090-byte/book-studio/releases) and download **BOOK-STUDIO-0.3.1-Setup.exe** for Windows 10/11 x64. The installer supports English and Simplified Chinese. GitHub's Source code ZIP is not an installer.

A matching `.sha256` file and redacted verification summary accompany the installer. This preview is unsigned and Windows may show an unknown publisher warning. Verify the source and SHA256 before deciding to run it; do not disable security software.

For later versions, use Settings → About & updates → Check for updates, or return to Releases. Back up your data, exit the app, and run the new installer. Updates retain your projects by default. There are no silent downloads or automatic installations.

## Use

Run the installer or the complete portable folder. End users do not need Node, Python, a browser, or a coding assistant. Data lives separately in `%APPDATA%/BookStudio` and is retained by default during updates and uninstall. No author projects are shipped. See the [user guide](docs/USER_GUIDE.en.md).

Books and galleries have separate collections and a shared asset library. Deliver PDFs or complete offline ZIP packages. Recipients must extract the entire ZIP. There is no publishing, live synchronization, or QR service. AI is optional: images are sent to your chosen provider only after an explicit generation request. Provider charges may apply. Backups exclude API keys.

## Develop

Windows x64, Node >=22.13, pnpm 11, Python 3.12. No bundled development environment or personal tool paths.

```powershell
pnpm install --frozen-lockfile
python -m venv .venv
.\.venv\Scripts\python -m pip install -r desktop/requirements-build.txt
$env:BOOK_STUDIO_PYTHON = (Resolve-Path .\.venv\Scripts\python.exe).Path
pnpm start
```

Use an isolated `BOOK_STUDIO_HOME` when developing. See [development](docs/DEVELOPMENT.md) for testing and packaging.

## Export public source — no upload

Run `pnpm source:export`. A fresh `work/public-release/source-VERSION-RANDOM/source` folder contains only approved source, assets, and docs. Git history, projects, keys, logs, exports, old website templates, and dependencies are excluded. Its adjacent audit report records file hashes. Initialize a new public repository only after audit, asset-rights review, and explicit publication authorization. The original repository remains untouched.

## License

Custom backup locations, hash-verified data migration and allowlisted diagnostics are available in Settings. Originals and existing backups are retained. Official version checks run only on request. Visit the [repository](https://github.com/ablaze2432687090-byte/book-studio) or [report an issue](https://github.com/ablaze2432687090-byte/book-studio/issues) without attaching credentials or customer artwork. Run `pnpm release:check` before distribution; see [publishing](docs/PUBLISHING.md).

Original code and documentation: [MIT](LICENSE). Third-party dependencies and textures retain their licenses. Logos, trademarks, and user/customer artwork are not covered by MIT. See [third-party notices](desktop/THIRD_PARTY_NOTICES.md), [security](SECURITY.md), and the [release checklist](docs/RELEASE_CHECKLIST.md).
