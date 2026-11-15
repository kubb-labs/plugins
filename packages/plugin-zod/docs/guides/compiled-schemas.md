# Compile Zod schemas

Set `compile` to wrap generated schemas in `z.compile(...)` for faster validation, and see which schemas stay on the interpreter. Needs Zod 4.5 or later.

## Turn on compile

Pass `true`, or `{ strict: true }` to make Zod throw when a part cannot be compiled. The [schemas that stay uncompiled](https://kubb.dev/extensions/kubb-labs/plugin-zod/guides/compiled-schemas#schemas-that-stay-uncompiled) are not wrapped, so they raise no error.

::code-group

```typescript [kubb.config.ts]
import { pluginZod } from '@kubb/plugin-zod'

pluginZod({ compile: true })
```

```typescript [src/gen/zod/petSchema.ts]
export const petSchema = z.compile(
  z.object({
    id: z.int(),
    name: z.string(),
  }),
)
```

::

| Value              | Effect                                                                                                                                                           |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `false` (default)  | Leaves schemas uncompiled.                                                                                                                                       |
| `true`             | Compiles schemas with `z.compile(...)`. A part that cannot be compiled falls back to the interpreter.                                                            |
| `{ strict: true }` | Passes `{ strict: true }` to `z.compile(...)`, so Zod throws when a part cannot be compiled into flat JavaScript. Schemas Kubb leaves uncompiled raise no error. |

## Schemas that stay uncompiled

Kubb leaves these schemas without `z.compile(...)`:

- Schemas with circular references (`z.lazy`).
- Bare `$ref` response aliases. An alias that adds a description, such as `petSchema.describe('A pet')`, is compiled.
- With `strict: true`, a `z.coerce` or `z.xor` schema, a union with such a member, and a schema that reaches a circular one through a `$ref`. The module then loads without a `ZodCompileUnsupportedError`.

## Coerced and int64 fields

Every `format: int64` schema is coerced, and so is every schema that [`coercion`](https://kubb.dev/extensions/kubb-labs/plugin-zod/guides/coercion) covers.

- An object or array that holds a coerced field is still compiled, and Zod runs that field on its interpreter.
- To compile an `int64` schema, set [`integerType: 'number'`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#integertype) on the adapter.

For every option value, see [`compile`](https://kubb.dev/extensions/kubb-labs/plugin-zod/options#compile).
