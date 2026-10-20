# Development / 开发

See the root README for prerequisites and environment setup. The Python server and vanilla web UI are the product; no React/Vinext or external Skill Canvas checkout is required. Use a dedicated virtual environment, not a system-wide package overwrite.

## Complete local release gate / 完整发布检查

Install the audit tool in the build venv: `python -m pip install pip-audit==2.10.1`. Set `BOOK_STUDIO_PYTHON` to that interpreter and run `pnpm release:check`. This scans dependencies, runs public-source, desktop and Python contracts, starts its own isolated UI server on 4187, checks bilingual responsive pages and dialogs, builds the backend and installer, checks actual packaged Electron, checks extracted offline handoffs, exports a clean source tree and reinstalls/tests a disposable copy. It never uploads. If 4187 is occupied it stops without terminating the existing process. Results are under `work/release-check/run-*/report.json`; failures remain failures.

Audit behavior follows [pnpm audit](https://pnpm.io/cli/audit) and [PyPA pip-audit](https://github.com/pypa/pip-audit). Network/unavailable results never count as success. One narrowly scoped exception is currently recorded for unpatched `sprintf-js` 1.1.3 / GHSA-hp3w-g68c-fv3c, an optional Electron downloader logging dependency used only during builds, absent from the customer package. Any different version, non-optional/runtime occurrence or higher severity blocks the release. Re-evaluate at every release; do not describe the scan as zero vulnerabilities. Python's complete pinned build requirements are audited separately.

Use pnpm 11: overrides live in `pnpm-workspace.yaml`. Do not move them into the no-longer-supported package.json `pnpm` field. No online scanning or updater runs in customer offline presentation packages.

```powershell
pnpm test
pnpm test:contracts
pnpm test:python
# In a separate terminal: temporary synthetic data only, port 4187
.\.venv\Scripts\python scripts/gallery_test_server.py
pnpm test:ui
# Backend and Windows installer
pnpm desktop:backend
.\.venv\Scripts\python scripts/collect_desktop_licenses.py
pnpm desktop:package
```

Set `BOOK_STUDIO_PYTHON` to the venv interpreter for source-mode Electron and packaging. `BOOK_STUDIO_HOME` isolates development data from installation data. Tests must not terminate another service on port 4173. Install Playwright Chromium with `pnpm exec playwright install chromium` if not already available.

Actual Electron QA: `node scripts/check_desktop_public.mjs`. Set `BOOK_STUDIO_TEST_EXECUTABLE` to the generated BOOK STUDIO executable to test the packaged application; omit it for development Electron. Every run creates a new synthetic profile under `work/desktop-qa`. Set `BOOK_STUDIO_TEST_PROFILE` to that reported QA area and run `node scripts/check_offline_public.mjs` to inspect extracted file-based exports while HTTP/HTTPS is blocked. These are automated local checks, not independent clean-machine acceptance.

`pnpm source:export` produces a fresh public-source tree and audit. Run install and tests again from that tree before publication; development-machine success alone is insufficient. A source hash manifest is reproducibility evidence, not a signature.

Run `node scripts/validate_public_source.mjs PATH-TO-EXPORTED-SOURCE` to perform that installation and test in a disposable copy. Do not install dependencies inside the source snapshot you intend to distribute. Its audit manifest must still describe the unmodified, dependency-free source tree.

Localization uses a reviewed exact UI catalog and bounded parameterized messages. Protect user-origin DOM with `data-user-content` or `translate="no"`; keep select values stable. The `StudioI18n.missing()` diagnostic lists untranslated visible text for review. Never hide missing text to pass a test.
