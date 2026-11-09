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

Add an optional `cookies` option for `in: cookie` parameters to the types, Zod schemas, Faker mocks, clients, query hooks, MCP tools, and Cypress requests.

- Query keys leave `cookies` out, as they do headers, since keys end up in SSR payloads and caches.
- `validator: 'zod'` checks `cookies` when the call passes them.

```ts
await getSession({ cookies: { session_id: 'abc' } })
```
