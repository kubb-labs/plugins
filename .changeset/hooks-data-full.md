---
'@kubb/plugin-react-query': major
'@kubb/plugin-vue-query': major
'@kubb/plugin-swr': major
---

Add the `returnType` option and follow the client plugin's `returnType` when it is unset. With `pluginFetch()` or `pluginAxios()`, whose default is `'full'`, the generated hooks now resolve to the whole `RequestResult` (`data`, `status`, `response`), so a hook can read response headers such as `ETag` or `Location`. This changes the default output: set `returnType: 'data'` on the hook plugin to keep resolving to the success body.
