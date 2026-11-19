---
'@kubb/plugin-ts': patch
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

`@kubb/plugin-msw` handlers import `MswBody` from a shared `.kubb/mswBody.ts` instead of declaring it in each file.
