---
'@kubb/plugin-client': minor
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
'@kubb/plugin-ky': minor
---

Add `importPath` to `pluginFetch`, `pluginAxios`, and `pluginKy`. The generated operations import the client from that module, and Kubb still writes the full `.kubb/` runtime, including `config.ts`, so the module can re-export it with its own `client` or types.

Add the `ClientLike` type to the client runtime. Every generated client is assignable to it, also one from another `.kubb/` folder or from the package types, so code that wraps a generated client can take any of them.

The template types of `@kubb/plugin-fetch`, `@kubb/plugin-axios`, and `@kubb/plugin-ky` now use the plugin's own `NativeOptions`, so they match the generated runtime.

`import.meta.resolve('@kubb/plugin-fetch/templates/client.ts')` resolves again in `@kubb/plugin-fetch`, `@kubb/plugin-axios`, and `@kubb/plugin-ky`.
