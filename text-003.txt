# Contributing / 参与开发

Keep book, gallery, and asset storage separate. Share generic UI, localization, undo/redo, dialog dismissal, and editor chrome instead of copying implementations. Never change existing artwork for a UI fix.

新增文字需要补充 `web/i18n-catalog.js`。使用英文界面检查长文本、自适应、键盘焦点与弹窗。项目名称、作者、作品说明、分类、标签和用户输入必须保持原文；不能用整页自动翻译或修改表单值代替界面国际化。

Tests must generate synthetic artwork in temporary profiles. Never depend on private project IDs, local usernames, sibling repositories, real AI calls, or author images. Keep customer runtime independent of admin scripts. Run storage, UI, offline-export, and packaged-desktop tests before releases.

Do not submit personal data, secrets, customer exports, generated builds, or node_modules. New textures and dependencies need source and license attribution. Maintain the source allowlist and release checks.
