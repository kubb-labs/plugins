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

Add cookie parameters to the generated operation types. An operation with an `in: cookie` parameter now gets a `<Name>Cookies` type and a `cookies` member on its `<Name>Options`, so a generated call, SDK method, or query hook accepts `cookies`, which the client already serializes into the `Cookie` header. `@kubb/plugin-zod` and `@kubb/plugin-faker` emit the matching `cookies` group. Operations without cookie parameters are unchanged.
