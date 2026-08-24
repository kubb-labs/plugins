---
"@kubb/plugin-fetch": patch
"@kubb/plugin-axios": patch
---

Fix the generated `client.ts` importing `./standardSchema.ts` with a `.ts` extension while every other sibling import (`./serializers`) omits it.

Under `"moduleResolution": "nodenext"` an extensioned relative specifier is resolved as CommonJS even in an ESM package, which TypeScript 6 now rejects when the rest of the config expects ESM resolution. Dropping the extension makes the import consistent with the other generated files and compiles under `nodenext`.

```ts
// before
import { type StandardSchemaValidator, validateStandardSchema } from './standardSchema.ts'

// after
import { type StandardSchemaValidator, validateStandardSchema } from './standardSchema'
```

Only the import specifier changes, so regenerating produces a one-line diff in existing `client.ts` files without any behavior change.
