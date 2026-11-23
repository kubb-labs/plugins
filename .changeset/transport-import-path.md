---
'@kubb/plugin-client': minor
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
'@kubb/plugin-ky': minor
---

Add `importPath` to `pluginFetch`, `pluginAxios`, and `pluginKy`. The generated operations and SDK classes import the client from that module, and Kubb still writes the full `.kubb/` runtime, including `config.ts`. The module re-exports `.kubb/client.ts` and overrides what it needs, such as a pre-configured `client`. Typed response headers and `securitySchemes` stay, because the module re-exports them.
