---
'@kubb/plugin-axios': minor
'@kubb/plugin-client': minor
'@kubb/plugin-cypress': minor
'@kubb/plugin-faker': minor
'@kubb/plugin-fetch': minor
'@kubb/plugin-ky': minor
'@kubb/plugin-mcp': minor
'@kubb/plugin-msw': minor
'@kubb/plugin-react-query': minor
'@kubb/plugin-swr': minor
'@kubb/plugin-ts': minor
'@kubb/plugin-valibot': minor
'@kubb/plugin-vue-query': minor
'@kubb/plugin-zod': minor
---

The `resolver` option now takes an array of resolver parts as well as one patch. The parts merge left to right over the plugin's default resolver.

```ts
import { resolverCasedFile } from '@kubb/kit'

pluginTs({ resolver: [resolverCasedFile(casing.camel), { name: (name) => `Api${name}` }] })
```
