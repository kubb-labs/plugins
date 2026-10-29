---
'@kubb/plugin-axios': patch
'@kubb/plugin-client': patch
'@kubb/plugin-cypress': patch
'@kubb/plugin-faker': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-mcp': patch
'@kubb/plugin-msw': patch
'@kubb/plugin-react-query': patch
'@kubb/plugin-swr': patch
'@kubb/plugin-vue-query': patch
---

Cache each operation's client and dependency file with `ctx.memo` instead of `ctx.cache`. This keeps the plugins working once `@kubb/core` drops `ctx.cache`. Generated output does not change.
