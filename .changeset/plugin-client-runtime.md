---
'@kubb/plugin-client': minor
---

Add the `runtime` option to `pluginClient`. Set it to a transport's `client.ts` template, such as `@kubb/plugin-fetch/templates/client.ts`, and Kubb writes the `.kubb/` runtime with that client, including the spec's `config.ts`, while the generated operations keep importing from `importPath`.
