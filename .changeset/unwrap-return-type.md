---
'@kubb/plugin-axios': minor
'@kubb/plugin-fetch': minor
'@kubb/plugin-react-query': minor
'@kubb/plugin-vue-query': minor
'@kubb/plugin-swr': minor
---

Add a `returnType` option (`'full' | 'data'`, default `'full'`) to the standalone client
functions and the class-based SDK. `'data'` resolves a call to the bare success body instead of
the full `{ status, data, error, contentType, request, response }` result, once `throwOnError`
(on by default) rules out the error branch.

`plugin-react-query`, `plugin-vue-query`, and `plugin-swr` now read this option off the
registered client plugin, so their generated hooks work with either setting instead of assuming
the full result.
