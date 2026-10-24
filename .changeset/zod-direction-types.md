---
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
'@kubb/plugin-client': minor
'@kubb/plugin-react-query': minor
'@kubb/plugin-swr': minor
'@kubb/plugin-vue-query': minor
'@kubb/plugin-zod': minor
---

Type clients and query hooks from `pluginZod({ inferred: 'direction' })` when it is set, so a custom codec param takes its domain value.

- Types a codec param such as a `URL` with the value the encode schema accepts, instead of the wire `string`, also next to `pluginTs()`.
- Types the decoded response, such as a `URL` or `bigint`, in `data`.
- Makes `pluginTs()` optional for React Query, SWR, and Vue Query when `pluginZod({ inferred })` supplies the types.
