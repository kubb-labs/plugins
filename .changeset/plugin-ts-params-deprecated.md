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

The function-parameter helpers exported by `@kubb/plugin-ts` (`createFunctionParameters`, `createFunctionParameter`, `functionPrinter`, `renderType` and their node types) are deprecated. Use `ast.factory` from `@kubb/kit` and `printParams` from `@kubb/renderer-jsx` instead. They are removed in Kubb v6.

`@kubb/plugin-msw` handlers with a request body now import the `MswBody` type from a shared `.kubb/mswBody.ts` file, which the plugin writes once, instead of declaring it in each handler file. Output of the other plugins does not change.
