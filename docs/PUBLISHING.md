# GitHub publishing handoff / GitHub 发布交接

Preparation does not create repositories, push commits, make tags or upload releases.

## Before publication / 上传前

1. Run `pnpm release:check` from the development checkout using the documented build environment. Only a fully passed report identifies the actual latest installer, synthetic QA profile and clean public-source snapshot. Do not select an older snapshot by filename alone.
2. Independently test install, English/Chinese installation, fresh launch, upgrade, uninstall and retained projects on another Windows x64 machine. Local isolated profiles are not a substitute. Keep preview status while this is pending.
3. Confirm brand/artwork/texture distribution rights. The code's MIT license does not license customer artwork or brand marks. Keep third-party notices. This preview is unsigned: disclose it, ship the matching SHA256 and do not ask users to disable security software.
4. Use only the reported `work/public-release/.../source` as a NEW repository root. It contains no `.git` or prior history. NEVER push the original development Git history. `.gitignore` does not remove already tracked private files.

## Bind official links when a real repository exists / 建仓后绑定

Edit `desktop/release.json`: set `owner` and `repo` to the actual authorized GitHub owner/repository; set `channel` to `preview` to include GitHub prereleases or `stable` to exclude them. Only plain GitHub identifiers are accepted. Do not invent URLs before a repository exists. Update package metadata and both README download/feedback links to match that actual repository. Enable GitHub private vulnerability reporting and update SECURITY.md. Rebuild and rerun the gate after this configuration changes.

The app queries only the configured official GitHub releases endpoint, only after a user clicks Check for updates. It never downloads or executes an installer. Release notes are displayed as plain text. No updater, management controls or credentials enter customer offline ZIPs.

## Release contents / 发布内容

Upload the installer and matching `.sha256` as Release assets, with bilingual version notes, Windows x64 support, unsigned-preview warning and known limitations. The source ZIP is source code, not an installer. Internal QA profiles, customer exports, logs, backups, audit working folders and private data do not belong in the public repository or Release.

The official repository is `ablaze2432687090-byte/book-studio`, independent of Skill Canvas. `desktop/release.json` is bound to that repository and the preview channel. Future releases must keep the same identifiers and use a strictly increasing `vX.Y.Z` tag, attach the versioned installer plus SHA256, and clearly retain preview status until independent Windows acceptance and signing requirements are addressed. Check the previous installer and new installer against retained data on a separate machine before promoting to stable. This application-version check does not restore project publishing or synchronization.
