---
'@kubb/plugin-client': patch
'@kubb/plugin-cypress': patch
'@kubb/plugin-faker': patch
'@kubb/plugin-mcp': patch
'@kubb/plugin-msw': patch
'@kubb/plugin-react-query': patch
'@kubb/plugin-swr': patch
'@kubb/plugin-ts': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-zod': patch
---

Read media types, status codes, servers and auth through the `ast.mediaType`, `ast.http`, `ast.server` and `ast.auth` helpers from `@kubb/kit`, instead of each plugin's own copy. The generated code stays the same, except that `@kubb/plugin-msw` now mocks a `text/json` response as JSON, like `application/json`.
