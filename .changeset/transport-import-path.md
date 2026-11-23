---
'@kubb/plugin-client': minor
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
'@kubb/plugin-ky': minor
'@kubb/plugin-react-query': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-swr': patch
'@kubb/plugin-mcp': patch
---

Add `importPath` to `pluginFetch`, `pluginAxios`, and `pluginKy`. The generated operations, SDK classes, and query hooks import the client from that module, and Kubb still writes the full `.kubb/` runtime, including `config.ts`. The module re-exports `.kubb/client.ts` and overrides what it needs, such as a pre-configured `client`. Typed response headers and `securitySchemes` stay, also in the query hooks, and the headers validator helper still comes from `.kubb/standardSchema.ts`.
