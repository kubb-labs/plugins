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

The function-parameter helpers exported by `@kubb/plugin-ts` (`createFunctionParameters`, `createFunctionParameter`, `functionPrinter`, `renderType` and their node types) are deprecated. Use `ast.factory` and `ast.params` from `@kubb/kit` instead. They are removed in Kubb v6. Generated output does not change.
