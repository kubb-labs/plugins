---
'@kubb/plugin-react-query': minor
'@kubb/plugin-vue-query': minor
'@kubb/plugin-swr': minor
'@kubb/plugin-mcp': minor
'@kubb/plugin-client': patch
---

Accept `@kubb/plugin-client` as the client plugin. The `client` option now also takes `'client'`, a lone registered `@kubb/plugin-client` is auto-detected, and the generated hooks and handlers call its operations and import `RequestConfig` and `ResponseErrorConfig` from your `importPath` module.
