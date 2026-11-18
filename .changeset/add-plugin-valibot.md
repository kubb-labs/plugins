---
'@kubb/plugin-valibot': minor
---

Add `@kubb/plugin-valibot`, which generates a [Valibot](https://valibot.dev) schema for every schema in your OpenAPI spec, plus the parameter, request, and response schemas of each operation. Set `inferred: true` to export a type next to each schema, `coercion` to convert input before validation, and `typeGuards` to add `is*` and `assert*` functions. With `dateType: 'date'` on the adapter, response schemas parse a date string into a `Date` and request schemas write it back.

```ts
import { pluginValibot } from '@kubb/plugin-valibot'

export default defineConfig({
  plugins: [pluginValibot({ inferred: true })],
})
```
