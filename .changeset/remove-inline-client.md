---
"@kubb/plugin-react-query": minor
"@kubb/plugin-vue-query": minor
"@kubb/plugin-swr": minor
"@kubb/plugin-mcp": minor
---

Remove the inline client fallback. The query plugins and `@kubb/plugin-mcp` no longer emit their own bundled `.kubb/client.ts`; they always call a registered `@kubb/plugin-axios` or `@kubb/plugin-fetch` (auto-detected when one is registered, or selected with `client: 'axios' | 'fetch'`).

Register a client plugin alongside the query/mcp plugin. Transport options such as `baseURL` live on that client plugin, so the `baseURL` option was removed from `@kubb/plugin-mcp`.

```ts
plugins: [
  pluginTs(),
  pluginAxios({ baseURL: 'https://api.example.com' }),
  pluginReactQuery(),
]
```
