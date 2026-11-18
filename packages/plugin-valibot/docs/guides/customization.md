# Customize generated schemas

Prefix inferred types, change Valibot calls, and encode custom request types.

Add each change to `pluginValibot()` in the [Valibot plugin configuration](https://kubb.dev/extensions/kubb-labs/plugin-valibot#example). [Format and type mappings](https://kubb.dev/extensions/kubb-labs/plugin-valibot/options#format-and-type-mappings) covers the default Valibot calls.

## Prefix inferred types

Turn on `inferred` and override `resolver.schema.typeName`. The callback receives the schema name, such as `Pet`, and returns the type name.

::code-group

```typescript [kubb.config.ts]
import { pluginValibot } from '@kubb/plugin-valibot'

pluginValibot({
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
export type PetSchemaType = v.InferOutput<typeof petSchema>
```

```typescript [After]
export type ApiPet = v.InferOutput<typeof petSchema>
```

::

The schema constant stays `petSchema`.

## Use numbers for int64 fields

Replace the `bigint` printer handler to validate `int64` fields as integers.

::code-group

```typescript [kubb.config.ts]
import { pluginValibot } from '@kubb/plugin-valibot'

pluginValibot({
  printer: {
    nodes: {
      bigint() {
        return 'v.pipe(v.number(), v.integer())'
      },
    },
  },
})
```

```typescript [Before]
id: v.pipe(
  v.union([v.bigint(), v.number(), v.string()]),
  v.toBigint(),
  v.minValue(-9223372036854775808n),
  v.maxValue(9223372036854775807n),
),
```

```typescript [After]
id: v.pipe(v.number(), v.integer()),
```

::

To change the TypeScript type as well, set [`integerType: 'number'`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#integertype) on the adapter.

## Remove descriptions

A schema with a `description` or `examples` in the spec carries them as `v.description()` and `v.metadata({ examples })`. Pass the [description-removal macro](https://kubb.dev/extensions/kubb-labs/plugin-ts/guides/customization#remove-descriptions) to `pluginValibot({ macros: [dropDescriptions] })` to leave out the `v.description()` calls.

> [!NOTE]
> A `$ref` to a described component keeps its `v.description()` call, because a macro does not visit the schema a `$ref` points to.

## Encode custom types

A printer handler that reads `this.options.direction` decodes response values and encodes request values. This example converts ISO time strings to `Temporal.PlainTime`.

::steps{level="3"}

### Write a direction-aware handler

Return one expression for `'encode'` (request bodies and parameters) and another for `'decode'` (responses).

```typescript [kubb.config.ts]
import { pluginValibot } from '@kubb/plugin-valibot'

pluginValibot({
  inferred: true,
  printer: {
    nodes: {
      time() {
        return this.options.direction === 'encode'
          ? 'v.pipe(v.instance(Temporal.PlainTime), v.transform((value) => value.toString()))'
          : 'v.pipe(v.string(), v.isoTime(), v.transform((value) => Temporal.PlainTime.from(value)))'
      },
    },
  },
})
```

The formats `time`, `date`, and `date-time` use the `time`, `date`, and `datetime` handlers.

### Check the generated schemas

Kubb writes a response schema and an input schema, also for schemas reached through a `$ref`:

```typescript [src/gen/valibot/slotSchema.ts]
export const slotSchema = v.object({
  startsAt: v.pipe(v.string(), v.isoTime(), v.transform((value) => Temporal.PlainTime.from(value))),
})

export const slotInputSchema = v.object({
  startsAt: v.pipe(v.instance(Temporal.PlainTime), v.transform((value) => value.toString())),
})
```

### Provide Temporal

The generated files use `Temporal` as a global. Load a polyfill, such as `temporal-polyfill/global`, before the schemas run where the runtime has none.

::
