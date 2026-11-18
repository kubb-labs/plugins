# Infer TypeScript types from Valibot schemas

Set `inferred` to export a type next to each Valibot schema, so you can skip `@kubb/plugin-ts`.

## Turn on inferred types

With `inferred: true`, each schema gets a type named after it: the PascalCase schema name plus `SchemaType`, so `petSchema` gets `PetSchemaType`.

::code-group

```typescript [kubb.config.ts]
import { pluginValibot } from '@kubb/plugin-valibot'

pluginValibot({ inferred: true })
```

```typescript [src/gen/valibot/petSchema.ts]
export const petSchema = v.object({
  id: v.pipe(v.number(), v.integer()),
  name: v.string(),
})

export type PetSchemaType = v.InferOutput<typeof petSchema>
```

::

To rename the types, see [Prefix inferred types](https://kubb.dev/extensions/kubb-labs/plugin-valibot/guides/customization#prefix-inferred-types).

## Input and output types

Kubb writes `v.InferInput<typeof schema>` for request schemas (bodies and params) and `v.InferOutput<typeof schema>` for every other schema.

- A request takes the value the caller passes, such as a `Date`, which the schema encodes.
- A response returns the converted value.
- The two differ only for a schema that converts, such as a `Date` field or a default.

When a schema prints differently per direction, Kubb also writes an `${name}InputSchema`, which request bodies use, also through a `$ref`. Its type gets the `InputSchemaType` suffix:

```typescript [src/gen/valibot/slotSchema.ts]
export type SlotSchemaType = v.InferOutput<typeof slotSchema>

export type SlotInputSchemaType = v.InferInput<typeof slotInputSchema>
```

See [Encode custom types](https://kubb.dev/extensions/kubb-labs/plugin-valibot/guides/customization#encode-custom-types) for a full example.

## Options and responses per operation

`inferred` also writes two schemas for each operation, with their types: an `OptionsSchema` that combines `body`, `path`, `query`, and `headers`, and a `ResponsesSchema` with one schema per status code.

```typescript [src/gen/valibot/listPetsSchema.ts]
export const listPetsResponsesSchema = v.object({
  '200': listPetsStatus200Schema,
})

export type ListPetsResponsesSchemaType = v.InferOutput<typeof listPetsResponsesSchema>
```

## Circular schemas

A schema that is part of a circular reference is annotated as `v.GenericSchema`, so its inferred type is `unknown`. Add `@kubb/plugin-ts` when you need the types of those schemas.

## Type guards

With [`typeGuards`](https://kubb.dev/extensions/kubb-labs/plugin-valibot/options#typeguards), each component schema gets an `is*` guard and an `assert*` function. Both narrow to `v.InferInput`, the value the schema accepts before it converts anything.

```typescript [src/gen/valibot/petSchema.ts]
export const isPet = (data: unknown): data is v.InferInput<typeof petSchema> => v.is(petSchema, data)
```
