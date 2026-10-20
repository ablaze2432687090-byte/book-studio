# User guide

## First use and preview releases

Start with a book, gallery or asset library; no API is required. The installer language seeds the first launch only and never replaces an existing preference.

Settings → Data & backups → Storage locations lets you choose a backup directory or migrate projects. Migration saves and backs up first, copies and verifies every file, then switches locations. The original workspace is retained. Keep enough free space and do not disconnect drives during migration. If the migrated drive is unavailable, reconnect it; an empty workspace will never silently replace it. Existing backups stay at their original location.

Exports show real stages, not invented percentages. After the native save dialog completes, a confirmation lets you show the file in its folder. If you cancel saving, use the download link again.

Settings → About & updates checks official versions only on request. Install updates manually. Unconfigured repositories, no releases, network errors and rate limits are distinguished. Safe diagnostics contain version, system, connection status and counts only, never raw logs, paths, artwork names or credentials. Do not publish raw logs or backups.

## Create and organize

Choose Books or Galleries in Projects. These are peer project types with independent collections. The shared Asset library supports folders, tags, archive, and trash. Galleries import independent copies, so organizing the library does not break existing presentations.

Books can import finished pages manually, optionally generate with an API, or copy prompts to another AI. No API is required to edit or export. Gallery walls extend automatically as artwork is added. Editing zoom cannot go below its default 100%; Overview shows the entire wall.

## Edit and view

Turn book pages by dragging, clicking arrows, or using keyboard arrows. Pan, zoom, and crop images non-destructively. Materials and lighting are optional screen effects; static PDFs do not reproduce the interactive lighting engine.

Shared glass controls default to 45% transparency, adjustable from 0–80%. Background brightness affects the scene, not panel opacity. Small screens use opaque panels for readability. Changing interface language never translates project content.

Undo/redo retains up to 60 steps per editing session. Up to 30 recovery points are retained, but they do not replace full backups. Archive and trash preserve original images; trash is not automatically emptied.

## Save and deliver

Projects save automatically. Wait for saves and exports to finish before closing. Failed saves prevent forced closing. Exit confirmation is optional. Export PDFs for static reading, or complete offline ZIPs for interaction. Extract the entire ZIP before opening its HTML entry. Each export is a snapshot, not a live synchronized link.

## Settings and data

Settings → General & appearance controls language, density, motion, and zoom. Data & backups shows storage paths, backup, import, and restore. Default location: `%APPDATA%/BookStudio`. Updates preserve projects; uninstall retains data by default. Do not move data manually while running.

AI is optional. Saving settings does not generate images. Explicit generation requests may incur provider charges and send selected images to that provider under its data policies. Keys are excluded from backups and customer exports.

Shortcuts: Ctrl+, Settings; Ctrl+S Save; Ctrl+Shift+H Projects; Ctrl+Z Undo; Ctrl+Shift+Z Redo; Esc dismiss top dialog; F11 Fullscreen; Ctrl+0 reset interface zoom.
