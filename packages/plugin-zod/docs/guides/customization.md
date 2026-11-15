# Customize generated schemas

Prefix inferred types, change Zod validators, and encode custom request types.

Add each change to `pluginZod()` in the [Zod plugin configuration](https://kubb.dev/extensions/kubb-labs/plugin-zod#example). [Format and type mappings](https://kubb.dev/extensions/kubb-labs/plugin-zod/options#format-and-type-mappings) covers the default Zod calls.

## Prefix inferred types

Turn on `inferred` and override `resolver.schema.typeName`. The callback receives the schema name, such as `Pet`, and returns the type name.

::code-group

```typescript [kubb.config.ts]
import { pluginZod } from '@kubb/plugin-zod'

pluginZod({
  inferred: true,
  resolver: {
    schema: {
      typeName(name) {
        return 'Api' + name
      },
    },
  },
})
```

```typescript [Before]
export type PetSchemaType = z.infer<typeof petSchema>
```

```typescript [After]
export type ApiPet = z.infer<typeof petSchema>
```

::

The schema constant stays `petSchema`.

## Use numbers for int64 fields

Replace the `bigint` printer handler to validate `int64` fields with `z.int()`.

::code-group

```typescript [kubb.config.ts]
import { pluginZod } from '@kubb/plugin-zod'

pluginZod({
  printer: {
    nodes: {
      bigint() {
        return 'z.int()'
      },
    },
  },
})
```

```typescript [Before]
id: z.coerce.bigint(),
```

```typescript [After]
id: z.int(),
```

::

To change `int64` fields for every plugin, set the adapter's [`integerType`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#integertype) instead.

## Remove descriptions

Pass the [description-removal macro](https://kubb.dev/extensions/kubb-labs/plugin-ts/guides/customization#remove-descriptions) to `pluginZod({ macros: [dropDescriptions] })`. Schemas then omit their own `.describe()` calls.

> [!NOTE]
> A `$ref` to a described component keeps its `.describe()` call, such as `owner: ownerSchema.describe('An owner')`, because a macro does not visit the schema a `$ref` points to.

## Encode custom types

A printer handler that reads `this.options.direction` decodes response values and encodes request values. This example converts ISO time strings to `Temporal.PlainTime`.

::steps{level="3"}

### Write a direction-aware handler

Return one expression for `'encode'` (request bodies and parameters) and another for `'decode'` (responses). Set `inferred: 'codec'` so the client types follow the conversion, and set the client `validator` so the client runs it. Without request validation, the client sends the `Temporal.PlainTime` unencoded.

```typescript [kubb.config.ts]
import { pluginZod, type PrinterZodNodes } from '@kubb/plugin-zod'
import { pluginFetch } from '@kubb/plugin-fetch'

const nodes: PrinterZodNodes = {
  time() {
    return this.options.direction === 'encode'
      ? 'z.instanceof(Temporal.PlainTime).transform((value) => value.toString())'
      : 'z.iso.time().transform((value) => Temporal.PlainTime.from(value))'
  },
}

pluginZod({ inferred: 'codec', printer: { nodes } })
pluginFetch({ validator: { request: 'zod', params: 'zod', response: 'zod' } })
```

The formats `time`, `date`, and `date-time` use the `time`, `date`, and `datetime` handlers.

Type the handlers as `PrinterZodNodes`, because the inline `printer.nodes` type also covers Zod Mini, which has no `direction`.

### Check the generated schemas

Kubb writes a response schema and an input schema, also for schemas reached through a `$ref`:

```typescript [src/gen/zod/slotSchema.ts]
export const slotSchema = z.object({
  startsAt: z.iso.time().transform((value) => Temporal.PlainTime.from(value)),
})

export const slotInputSchema = z.object({
  startsAt: z.instanceof(Temporal.PlainTime).transform((value) => value.toString()),
})
```

### Provide Temporal

Use a runtime that provides `Temporal`, or add its polyfill through a generated import or banner.

::

> [!IMPORTANT]
> With `inferred: true` instead of `'codec'`, a request type is the encoded string, not `Temporal.PlainTime`. Types from `pluginTs` describe the wire format.

For built-in `Date` conversion, set `dateType: 'date'` on the adapter instead.

## Import a custom codec

Override a printer handler and register its import with `this.import`. This example uses `myCodec.uint64()` from your package for `int64` fields:

::code-group

```typescript [kubb.config.ts]
import { ast } from 'kubb/kit'
import { pluginZod } from '@kubb/plugin-zod'

pluginZod({
  printer: {
    nodes: {
      bigint() {
        this.import(ast.factory.createImport({
          name: ['myCodec'],
          path: 'my-codec/zod',
        }))
        return 'myCodec.uint64()'
      },
    },
  },
})
```

```typescript [src/gen/zod/petSchema.ts]
// excerpt
import { myCodec } from 'my-codec/zod'

export const petSchema = z.object({
  id: myCodec.uint64(),
})
```

::

Leave `root` unset on the import to keep the package specifier. With `root` set, Kubb rewrites it as a relative file path.

For the handler context and how overrides compose with macros, see the [printer guide](https://kubb.dev/docs/5.x/how-to/customize#printers).
