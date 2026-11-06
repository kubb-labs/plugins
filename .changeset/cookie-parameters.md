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
---

Add cookie parameters to the generated operation types. An operation with an `in: cookie` parameter gets a `<Name>Cookies` type and a `cookies` member on its options, so a generated call, SDK method, or query hook accepts them. The Zod schema and faker get the matching group. Operations without cookie parameters are unchanged.

```ts
await getSession({ cookies: { session_id: 'abc' } })
```
