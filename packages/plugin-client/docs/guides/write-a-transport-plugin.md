# Write a transport plugin

A transport plugin generates the same client code as `@kubb/plugin-fetch` and `@kubb/plugin-axios`, but sends requests with your own HTTP library. `@kubb/plugin-client` exports the setup those two plugins use, so a transport plugin adds only its plugin definition and one `client.ts` template.

## Define the plugin

Call `resolveClientOptions`, `setupClient`, and `clientDependencies` from your own `defineExtension` definition. `setupClient` sets the resolver and macros, adds the client or SDK generator, and copies the shared runtime and your `client.ts` into `.kubb/`.

```typescript [src/plugin.ts]
import { fileURLToPath } from 'node:url'
import { defineExtension } from '@kubb/kit'
import { clientDependencies, resolveClientOptions, setupClient } from '@kubb/plugin-client'
import type { PluginKy } from './types.ts'

export const pluginKy = defineExtension<PluginKy>({
  kind: 'plugin',
  meta: { name: 'plugin-ky', version: '1.0.0', compatibility: { kubb: '>=5.16.0' } },
  dependencies: clientDependencies,
  setup(options) {
    const resolved = resolveClientOptions(options)
    setupClient({ resolved, client: fileURLToPath(new URL('../templates/client.ts', import.meta.url)) })
    return resolved
  },
})
```

Keep `src/plugin.ts` directly in `src/`, so the `../templates/client.ts` path also resolves from the built `dist/index.js`. Add `templates` to the `files` field of your `package.json`.

The plugin type reuses the shared option types and registers the plugin name:

```typescript [src/types.ts]
import type { PluginType } from '@kubb/kit'
import type { ClientOptions, ClientResolvedOptions, ResolverClient } from '@kubb/plugin-client'

export type PluginKy = PluginType<'plugin-ky', ClientOptions, ClientResolvedOptions, ResolverClient>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-ky': PluginKy
    }
  }
}
```

## Write the client template

`templates/client.ts` is copied into `.kubb/client.ts` next to the shared `core.ts`. It exports the `NativeRequest`, `NativeResponse`, and `NativeOptions` types, a `defaultTransport`, and a `client` built with `createLazyClient((config) => createClientCore({ defaultTransport, ...config }))`. [Write your client](https://kubb.dev/extensions/kubb-labs/plugin-client/guides/write-your-client#build-on-the-shared-runtime) lists what the core expects.

Start from [`@kubb/plugin-fetch/templates/client.ts`](https://github.com/kubb-labs/plugins/blob/main/packages/plugin-fetch/templates/client.ts) or [`@kubb/plugin-axios/templates/client.ts`](https://github.com/kubb-labs/plugins/blob/main/packages/plugin-axios/templates/client.ts) and replace the transport. To type-check the template while you work on it, add a `templates/core.ts` that contains `export * from '@kubb/plugin-client/templates/core.ts'`, and leave it out of the published `files`.

## Limits

The query plugins and `@kubb/plugin-mcp` only call `@kubb/plugin-fetch`, `@kubb/plugin-axios`, or `@kubb/plugin-client`. Their `client` option has no value for a third-party transport plugin, so use one with the standalone functions or the `sdk` option.
