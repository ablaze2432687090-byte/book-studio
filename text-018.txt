# Changelog / 更新记录

## 0.3.1 - final local release preparation / 发布前收尾

- Bundle an OFL-licensed Chinese/Latin PDF font with provenance and embedded subsets; no Windows language pack or Microsoft font is required for gallery/catalog or generated book text.

- Strict allowlist diagnostics exclude logs, paths, credentials and artwork names.
- 手动版本检查区分未配置、无版本、网络失败、请求受限与新版本；支持预览通道，不自动下载安装。
- Custom backup locations and full hash-verified data migration retain originals; disconnected drives never create a replacement workspace.
- 修正设置忙碌保护与导入、恢复的交互；取消操作明确反馈。备份保留规则不删除未登记的旧备份。
- Bilingual dates, English prompt instructions, installer-language seeding, export stages and native save completion / show-in-folder feedback.
- 统一发布检查入口，锁定构建依赖安全修复版本；未修复的可选构建依赖例外完整披露。

## 0.3.0 - public-readiness preview / 公开准备预览版

- Chinese / English interface, persistent preferences, native menu and startup localization. Long English text wraps without altering artwork content or select values.
- 中英文主界面、创建预设与说明、设备预览、恢复点、设置和观看控件；英文版离线交付说明、使用指南与目录。
- Synthetic geometric fixtures replace private-artwork dependencies. Fixed book guides use actual 3:4-spread viewer screenshots with neutral generated artwork.
- 全新安装从空项目仓库开始，旧仓库迁移规则保留。默认自动保存后退出，用户可选择开启退出确认。
- Independent Node/Python toolchains and locked dependencies; no dependency on Skill Canvas or a personal runtime path in public scripts.
- 源码白名单导出、文件哈希、资源目录检查、压缩后端代码路径检查、独立版本构建目录、安装包 SHA256。
- Bilingual usage/development/security/release documentation. Original code uses MIT; third-party licenses and artwork rights remain separate.

This preview is unsigned and manually updated. Independent fresh-Windows installation/upgrade/uninstall acceptance and final branding/license review remain required before public release. Preparation does not publish anything to GitHub.
