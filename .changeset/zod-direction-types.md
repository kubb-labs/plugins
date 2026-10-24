---
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
'@kubb/plugin-client': minor
'@kubb/plugin-react-query': minor
'@kubb/plugin-swr': minor
'@kubb/plugin-vue-query': minor
'@kubb/plugin-zod': minor
'@kubb/plugin-mcp': minor
---

Type clients, query hooks, and MCP handlers from `pluginZod({ inferred: 'codec' })` when it is set, so a custom codec param takes its domain value.

- Types a codec param such as a `URL` with the value the encode schema accepts, instead of the wire `string`, also next to `pluginTs()`.
- Types the decoded response, such as a `URL` or `bigint`, in `data`.
- Makes `pluginTs()` optional for React Query, SWR, Vue Query, and MCP when `pluginZod({ inferred })` supplies the types.
- Renames `inferred: 'direction'` to `inferred: 'codec'`. `'direction'` still works as a deprecated alias.
