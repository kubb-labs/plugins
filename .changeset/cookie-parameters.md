---
'@kubb/plugin-ts': patch
'@kubb/plugin-zod': patch
'@kubb/plugin-faker': patch
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
'@kubb/plugin-react-query': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-swr': patch
'@kubb/plugin-mcp': patch
'@kubb/plugin-cypress': patch
---

Add an optional `cookies` option for `in: cookie` parameters to the generated types, Zod schema, faker, client call, query hooks, MCP tool, and Cypress request.

- Leave `cookies` out of query keys, as headers are, since a key ends up in SSR payloads and caches.
- Check `cookies` with `validator: 'zod'` when the call passes them.

```ts
await getSession({ cookies: { session_id: 'abc' } })
```
