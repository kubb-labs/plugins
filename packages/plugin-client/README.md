# @kubb/plugin-client

Generate typed operations from an OpenAPI document and connect them to a client module that you own. The plugin generates operation functions and types; it does not choose a transport or copy runtime helpers.

```ts
import { pluginClient } from '@kubb/plugin-client'

pluginClient({ importPath: '../api/client' })
```

`importPath` is written into each generated import as-is, so it must resolve from the generated operation file (for example `../../../client`, or a package or alias specifier). The module must export `client`, plus the `Options` and `RequestResult` types. Generated operations call `client` with a config containing `method`, `url`, and the operation options, and return its promise typed as `RequestResult`. There are no `withUnwrap` or `unwrapResult` helpers to write, and `returnType` is not an option.

If your spec has server-sent event operations, also export `toEventStream` and the `EventStreamResult` and `SuccessOf` types. Implement the behavior your application needs in that module.

Set the base URL, auth, retries, and any other behavior inside your `client`. `sdk`, `returnType`, and `baseURL` are not options of this plugin. `validator: 'zod'` needs `pluginZod()` in the plugins, and generation stops with an error if it is missing. Your `client` receives the schemas on `config.validator` (`{ request?, response?, error? }`), so add that field to your `RequestConfig` and run them yourself.

See [`examples/client`](../../examples/client) for a minimal `client.ts` built on `fetch`.
