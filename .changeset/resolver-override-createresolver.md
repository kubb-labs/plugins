---
"@kubb/plugin-cypress": minor
"@kubb/plugin-faker": minor
"@kubb/plugin-mcp": minor
"@kubb/plugin-msw": minor
"@kubb/plugin-react-query": minor
"@kubb/plugin-swr": minor
"@kubb/plugin-ts": minor
"@kubb/plugin-vue-query": minor
"@kubb/plugin-zod": minor
---

Accept a resolver built with `createResolver` in the plugin `resolver` option.

The option now takes `ResolverPatch<T> | T`, so you can build the override once with `createResolver` and pass it in, or keep passing the plain params object:

```ts
import { createResolver } from 'kubb/kit'
import { pluginFaker, resolverFaker } from '@kubb/plugin-faker'
import type { PluginFaker } from '@kubb/plugin-faker'

pluginFaker({
  resolver: createResolver<PluginFaker>({
    pluginName: 'plugin-faker',
    name(name) {
      return `${resolverFaker.name(name)}Faker`
    },
  }),
})
```
