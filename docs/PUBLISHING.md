# Publishing / 发布指南

## Release configuration / 版本配置

Configure the application version and release channel in `desktop/release.json`. Beta builds use the `preview` channel and GitHub Pre-release status. The official repository is [ablaze2432687090-byte/book-studio](https://github.com/ablaze2432687090-byte/book-studio).

应用版本与发布通道由 `desktop/release.json` 配置。测试版使用 `preview` 通道，并在 GitHub 标为 Pre-release。

## Build and verify / 构建与检查

1. Run `pnpm release:check` using the environment described in [Development](DEVELOPMENT.md). Use the installer and clean source snapshot identified in its report.
2. Test installation, first launch, upgrade, uninstall and retained data on a separate Windows x64 machine, in both installer languages.
3. Review brand, artwork and texture distribution rights; preserve third-party notices. MIT does not license user artwork or brand marks.
4. Publish source only from the audited `work/public-release/.../source` snapshot. Exclude user data, credentials, logs, backups and internal QA files. Never publish the development repository's private history.

## Release assets / 发布文件

Attach the versioned Windows x64 installer and matching `.sha256` file. Include concise Chinese/English notes covering features, installation requirements and known limitations. Clearly disclose unsigned installers; do not ask users to disable security software. GitHub's Source code ZIP is not an installer.

发布内容包括 Windows x64 安装包、对应 SHA256 校验文件，以及中英文功能与安装说明。未签名安装包应明确标注；源码 ZIP 不代替安装包。

## Update behavior / 更新方式

The app checks the configured GitHub releases endpoint only when the user selects Check for updates. Updates are downloaded and installed manually. Release notes are displayed as plain text; customer offline packages contain no updater or management controls.

应用只在用户点击「检查更新」时查询版本，安装包由用户手动下载和安装。离线展示包不包含更新器或管理入口。
