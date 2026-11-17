---
'@kubb/plugin-valibot': minor
---

Add `@kubb/plugin-valibot`, which generates a [Valibot](https://valibot.dev) schema for every schema in your OpenAPI spec, plus the parameter, request, and response schemas of each operation. Set `inferred: true` to export a `v.InferOutput` type next to each schema.

```ts
import { pluginValibot } from '@kubb/plugin-valibot'

export default defineConfig({
  plugins: [pluginValibot({ inferred: true })],
})
```
