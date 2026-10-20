# Changelog / 更新记录

## 0.6.0 Beta - 2026-10-21

- Compact gallery preview header and grouped sidebar viewing tools; fullscreen keeps the original controls available. 中英文紧凑工具栏与全屏控件回位。
- Continuous gallery illumination: sum linear light before exposure, smooth neighbouring pools and remove artwork-sized light cutoffs. 展厅统一连续光场与自然交叉衰减。
- Eleven book lighting modes share bounded cached light fields; facing pages sample the same field. No visible book fixtures or changes to page-turn code. 画册只保留光影，不出现灯具。
- Preserve the cover/spread navigation layout fix, glass controls, isolated project collections, offline export and data protection. 保留画册切换修复、半透明操作栏及数据隔离。
- Updated Windows x64 installer, bilingual docs, SHA256 and redacted release verification. Unsigned beta; independent clean-machine acceptance remains pending.

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
- Dedicated Node/Python toolchains and locked dependencies; public scripts use portable runtime paths.
- 源码白名单导出、文件哈希、资源目录检查、压缩后端代码路径检查、独立版本构建目录、安装包 SHA256。
- Bilingual usage/development/security/release documentation. Original code uses MIT; third-party licenses and artwork rights remain separate.
