# BOOK STUDIO

[English](README.en.md)

本地优先的 Windows 作品创作与展示工作台：翻页画册、横向展厅和公共素材图库。中文与 English 界面可在设置中切换，作品内容保持原样。

当前为 **0.6 测试版（0.6.0 Beta）**，不是 1.0 正式版。在作者明确确认“1.0 正式版”之前，后续发布均保持测试版／GitHub Pre-release 状态。未签名，手动下载安装更新；尚未完成独立干净电脑验收。这是与 Skill Canvas 完全独立的项目，不共用作品仓库或安装目录。

## 下载安装

前往 [0.6 测试版下载页](https://github.com/ablaze2432687090-byte/book-studio/releases/tag/v0.6.0) 下载 **BOOK-STUDIO-0.6.0-Setup.exe**，不要把页面上的 Source code ZIP 当作安装包。适用 Windows 10/11 x64；安装器支持中文和 English。

同时提供 `.sha256` 校验文件和脱敏验收摘要。安装包尚未签名，Windows 可能显示未知发布者；不要关闭安全软件。请核对来源与 SHA256 后自行决定是否运行。

以后在设置 → 关于与更新中点击「检查更新」，或回到版本下载页下载新版安装器。升级前先备份，再退出程序并安装；作品数据默认保留。不会静默下载或自动安装更新。

## 使用

安装器或完整便携目录均可运行；用户不需要 Node、Python、浏览器或 Codex。数据独立存于 `%APPDATA%/BookStudio`，升级和卸载默认保留。首次使用不会携带作者项目。详见 [使用指南](docs/USER_GUIDE.zh-CN.md)。

画册、展厅独立保存，图库共用。导出 PDF 或完整离线 ZIP；接收方完整解压后打开。没有作品在线发布、同步和二维码服务。AI 完全可选；只有显式生成才发送图片给配置的服务商，费用由服务商收取。备份不含密钥。支持自选备份位置、逐文件校验的数据迁移、无日志的安全诊断；原仓库和旧备份保留。

设置 → 关于与更新提供手动版本检查和[官方仓库](https://github.com/ablaze2432687090-byte/book-studio)入口。使用问题可提交[问题反馈](https://github.com/ablaze2432687090-byte/book-studio/issues)，请勿附上密钥或客户作品。完整检查入口：`pnpm release:check`，见[发布步骤](docs/PUBLISHING.md)。

## 开发与构建

Windows x64、Node >=22.13、pnpm 11、Python 3.12。源码不含 node_modules、Python 环境或个人工具路径。

```powershell
pnpm install --frozen-lockfile
python -m venv .venv
.\.venv\Scripts\python -m pip install -r desktop/requirements-build.txt
$env:BOOK_STUDIO_PYTHON = (Resolve-Path .\.venv\Scripts\python.exe).Path
pnpm start
```

测试与打包见 [开发指南](docs/DEVELOPMENT.md)。不建议直接运行源码中的历史数据目录；开发时请设置独立的 `BOOK_STUDIO_HOME`。

## 准备公开源码（不会上传）

```powershell
pnpm source:export
```

生成全新 `work/public-release/source-版本-随机号/source`，无 `.git`、个人项目、密钥、日志、旧网站模板或历史提交。旁边的 `source-audit.json` 包含文件哈希和扫描结果。只在审核通过、素材权利确认并获得上传授权后，才从这个新目录初始化公开仓库。原始仓库与用户数据保持不变。

## 授权与状态

原创代码和文档使用 [MIT](LICENSE)。第三方运行库与纹理按原授权保留，品牌标识和用户作品不包含在 MIT 授权内。见 [第三方说明](desktop/THIRD_PARTY_NOTICES.md)、[安全说明](SECURITY.md) 和 [发布检查表](docs/RELEASE_CHECKLIST.md)。
