---
'@kubb/plugin-client': patch
'@kubb/plugin-cypress': patch
'@kubb/plugin-faker': patch
'@kubb/plugin-mcp': patch
'@kubb/plugin-msw': patch
'@kubb/plugin-react-query': patch
'@kubb/plugin-redoc': patch
'@kubb/plugin-swr': patch
'@kubb/plugin-ts': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-zod': patch
---

Stop shipping `extension.yaml` in the npm packages and remove the yaml generator (`plugins/` sources and `scripts/build-extension-yaml.ts`). Extension metadata now lives in the platform repo (`kubb-labs/platform`, `extensions/` at the repo root) and the options are documented on each plugin's kubb.dev page.
