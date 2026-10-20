/* Public-source allowlist. Historical Git state and user work are never copied. */
export const directories=['web','docs'];
export const files=[
 'server.py','package.json','pnpm-lock.yaml','pnpm-workspace.yaml','.gitignore','LICENSE','README.md','README.en.md','SECURITY.md','CONTRIBUTING.md',
 'desktop/main.cjs','desktop/preload.cjs','desktop/release-tools.cjs','desktop/release-tools.test.mjs','desktop/storage-paths.cjs','desktop/release.json','desktop/startup.html','desktop/startup.js','desktop/service_entry.py','desktop/electron-builder.json','desktop/package.json','desktop/requirements-build.txt','desktop/THIRD_PARTY_NOTICES.md',
 'scripts/audit_dependencies.mjs','scripts/release_check.mjs','scripts/check_release_interactions.mjs',
 'desktop/installer-language.nsh',
 'scripts/pdf_fonts.py','assets/fonts/StudioSansSC-Regular.ttf','assets/fonts/OFL.txt','assets/fonts/SOURCES.md',
 'assets/BOOK-STUDIO.ico','assets/BS-LOGO.png','assets/delivery/使用指南.pdf','assets/delivery/User-Guide.pdf',
 ...['ai_studio.py','asset_store.py','gallery_store.py','gallery_delivery.py','project_tools.py','studio_store.py','export_album.py','render_album.py','build_desktop_backend.ps1','build_desktop_backend.mjs','collect_desktop_licenses.py','stamp_desktop_exe.py','package_desktop.mjs','public_policy.mjs','export_public_source.mjs','audit_public.mjs','test_public_source.mjs','synthetic_fixtures.py','gallery_test_server.py','check_bilingual.mjs','test_studio_store.py','test_tool_stores.py','test_collection_rules.py','test_project_tools.py','test_ai_studio.py','run_python_tests.mjs','validate_public_source.mjs','audit_backend.py','reexport_test_profile.py','seed_test_profile.py','check_desktop_public.mjs','extract_test_exports.py','check_offline_public.mjs'].map(name=>'scripts/'+name)
];
export function allowed(relative){return !relative.split('/').some(part=>['node_modules','.git','.private','__pycache__','models'].includes(part))&&!relative.endsWith('.pyc')&&relative!=='web/public-build.test.mjs';}
