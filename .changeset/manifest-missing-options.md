---
'@kubb/plugin-axios': patch
'@kubb/plugin-client': patch
'@kubb/plugin-cypress': patch
'@kubb/plugin-faker': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-mcp': patch
'@kubb/plugin-msw': patch
'@kubb/plugin-react-query': patch
'@kubb/plugin-redoc': patch
'@kubb/plugin-swr': patch
'@kubb/plugin-ts': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-zod': patch
---

Studio can now edit more plugin options, because each `kubb-extension.json` lists them:

- Every plugin: `output.banner` and `output.footer` as text.
- `@kubb/plugin-axios` and `@kubb/plugin-fetch`: `returnType` and `throwOnErrorDefault`.
- `@kubb/plugin-client`: `throwOnErrorDefault`.
- `@kubb/plugin-faker`: `typeMode`.
- `@kubb/plugin-zod`: `compile` and `typeGuards` as on or off.
- `@kubb/plugin-react-query`: `customOptions.importPath` and `customOptions.name`.
