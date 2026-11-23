---
'@kubb/plugin-ts': patch
'@kubb/plugin-zod': patch
'@kubb/plugin-valibot': patch
'@kubb/plugin-faker': patch
'@kubb/plugin-msw': patch
'@kubb/plugin-cypress': patch
'@kubb/plugin-mcp': patch
'@kubb/plugin-client': patch
'@kubb/plugin-react-query': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-swr': patch
---

Write each module's imports as one `File.Import` with `names`, in place of the deprecated `name`, `isTypeOnly` and `isNameSpace`. The generated code is unchanged.
