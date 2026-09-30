# @kubb/plugin-client

Generate typed operations from an OpenAPI document and connect them to a client module that you own. The plugin generates operation functions and types; it does not choose a transport or copy runtime helpers.

```ts
import { pluginClient } from '@kubb/plugin-client'

pluginClient({ importPath: '../api/client' })
```

`importPath` is written into each generated import as-is, so it must resolve from the generated operation file (for example `../../../client`, or a package or alias specifier). The module must export `client`, `withUnwrap`, `unwrapResult`, and `toEventStream`, plus the matching `Options`, `RequestResult`, `UnwrappedResult`, `Unwrappable`, `EventStreamResult`, and `SuccessOf` types. Generated operations use `client` as the default request function and pass it a config containing `method`, `url`, and operation options. Implement the behavior your application needs in that module.

See [`examples/client`](../../examples/client) for a minimal `client.ts` built on `fetch`.
