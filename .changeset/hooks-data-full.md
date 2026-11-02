---
'@kubb/plugin-react-query': minor
'@kubb/plugin-vue-query': minor
'@kubb/plugin-swr': minor
---

Add the `data` option. `data: 'full'` makes the generated hooks resolve to the client's whole `RequestResult` (`data`, `status`, `response`) instead of the success body, so a hook can read response headers such as `ETag` or `Location`. The default `'body'` keeps the current output.
