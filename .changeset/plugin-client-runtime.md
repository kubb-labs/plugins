---
'@kubb/plugin-client': minor
---

Add the `runtime` option to `pluginClient`: `'fetch'`, `'axios'`, or `'ky'`. Kubb then writes that transport's `.kubb/` runtime, including the spec's `config.ts`, while the generated operations keep importing from `importPath`. Install the matching package, such as `@kubb/plugin-fetch`.
