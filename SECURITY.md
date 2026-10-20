# Security / 安全

Safe exported diagnostics use a strict field allowlist; raw logs, paths, project names, artwork, prompts and credentials are excluded. Raw local logs and backups are private. Dependency audit policy and the narrowly scoped unpatched build-only dependency exception are documented in docs/DEVELOPMENT.md; unavailable scans block the local release gate.

This is a local application, not a multi-user hosting service. The packaged backend listens on loopback with a fresh session token; Electron uses context isolation, sandboxing, disabled Node integration, IPC source validation, and external-navigation confirmation. The development server is for trusted local use only.

本工具不是公网多用户服务。不要把开发服务暴露到外网。API 密钥与作品数据分别存储；Windows 使用当前用户加密保护密钥，备份、客户包和公开源码不包含密钥。不要把 API 密钥写入作品标题、文本或截图。

Back up before import, restore, or updates. Failed saves and pending exports can block closing to avoid data loss. Archive and trash are recoverable; original media is not automatically destroyed. No automatic update feed or signing certificate is configured in this preview.

报告问题时提供版本、操作步骤及脱敏诊断，不发送客户图片、API Key、完整用户目录或私人仓库。安全漏洞请使用 [GitHub 私密漏洞报告](https://github.com/ablaze2432687090-byte/book-studio/security/advisories/new)。普通使用问题可提交 [Issue](https://github.com/ablaze2432687090-byte/book-studio/issues)。不要把安全漏洞及敏感材料直接贴入公开 issue。

Report vulnerabilities through [private vulnerability reporting](https://github.com/ablaze2432687090-byte/book-studio/security/advisories/new), not a public issue. Include the version, minimal reproduction steps and redacted diagnostics only. Do not attach customer artwork, credentials, raw logs or private repositories. General support belongs in [Issues](https://github.com/ablaze2432687090-byte/book-studio/issues).

Pattern scanning is a release gate, not a proof that arbitrary content is safe or licensed. Independent clean-machine tests and manual rights/privacy review remain required.
