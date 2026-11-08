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

Add cookie parameters to the generated operation types.

- An operation with an `in: cookie` parameter gets a `<Name>Cookies` type and a `cookies` option, so its call, SDK method, query hook, MCP tool, and Cypress request take `cookies`.
- `cookies` is always optional, even for a required cookie, because a browser sends its cookies itself.
- Query keys include `cookies`, so two calls with different cookies get separate cache entries.
- The Zod schema and faker get the same group, and `validator: 'zod'` checks it when the call passes `cookies`.
- Operations without cookie parameters generate the same code as before.

```ts
await getSession({ cookies: { session_id: 'abc' } })
```
