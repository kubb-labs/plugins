---
'@kubb/plugin-react-query': minor
'@kubb/plugin-vue-query': minor
'@kubb/plugin-swr': minor
---

Type the hooks' `client` option as `RequestConfig` without the fields the hook sets.

- Remove `throwOnError` from `client`. The hook always sets it to `true`.
- Pass `contentType` for a mutation with several request media types on the mutation variables, not on `client`.
