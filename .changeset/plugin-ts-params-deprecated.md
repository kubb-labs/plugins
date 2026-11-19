---
'@kubb/plugin-ts': minor
'@kubb/plugin-client': patch
'@kubb/plugin-cypress': patch
'@kubb/plugin-faker': patch
'@kubb/plugin-mcp': patch
'@kubb/plugin-msw': patch
'@kubb/plugin-react-query': patch
'@kubb/plugin-swr': patch
'@kubb/plugin-valibot': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-zod': patch
---

`@kubb/plugin-ts` deprecates its function-parameter helpers (`createFunctionParameters`, `createFunctionParameter`, `functionPrinter`, `renderType` and their types). Use `ast.factory` from `@kubb/kit` and `printParams` from `@kubb/renderer-jsx`. They are removed in Kubb v6.

`@kubb/plugin-msw` handlers import `MswBody` from a shared `.kubb/mswBody.ts` instead of declaring it in each file.
