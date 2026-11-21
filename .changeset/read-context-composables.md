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
'@kubb/plugin-swr': patch
'@kubb/plugin-vue-query': patch
---

Resolve operation files with kit's `ctx.file(node)` and read the build context through composables, so the shared helpers no longer take `ctx`. Generated output is unchanged.
