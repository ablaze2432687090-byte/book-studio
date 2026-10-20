# Release checklist / 发布检查

Beta releases use the preview channel and GitHub Pre-release status.

- [ ] Storage tests, UI tests, and source/privacy audit pass against exported source.
- [ ] Chinese and English: projects, creation modes, book editor, gallery, assets, settings, dialogs, native menus, startup, and installer.
- [ ] Test long English labels at 860/1024/1280/1440/1920 widths; no clipped actions or horizontal page overflow.
- [ ] User titles, descriptions, labels, folders, tags, prompts, and select values survive language round-trips.
- [ ] Synthetic viewer screenshots replace private artwork in fixed public PDF guides.
- [ ] Inspect the entire packaged resource tree, not only app.asar; no projects, credentials, contact templates, old models, or personal paths.
- [ ] Offline book and gallery ZIPs work after extraction without network. PDF pages render correctly.
- [ ] Actual packaged Electron starts, edits, saves, exports, backs up, and quits against an isolated profile.
- [ ] Installer SHA256 and machine-readable verification report are recorded. Signature status is explicit.
- [ ] Fresh Windows machine: install, first run, upgrade, uninstall, data retention, both installer languages. **Pending until independently performed.**
- [ ] Manual review of brand rights, textures, vendor licenses and third-party notices; MIT does not license user artwork.
- [ ] Public vulnerability reporting channel and repository URL added only once actually established.

Unsigned installer warnings are expected in this preview. There is no automatic update feed. A failed or skipped check must stay visible in the release report, never be rewritten as success.
