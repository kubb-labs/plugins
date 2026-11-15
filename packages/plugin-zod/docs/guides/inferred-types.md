# Infer TypeScript types from Zod schemas

Set `inferred` to export a `z.infer` type next to each Zod schema, or `z.input` and `z.output` types for codecs, so you can skip `@kubb/plugin-ts`.

## Turn on inferred types

With `inferred: true`, each schema gets a `z.infer` type named after it: the PascalCase schema name plus `SchemaType`, so `petSchema` gets `PetSchemaType`.

::code-group

```typescript [kubb.config.ts]
import { pluginZod } from '@kubb/plugin-zod'

pluginZod({ inferred: true })
```

```typescript [src/gen/zod/petSchema.ts]
export const petSchema = z.object({
  id: z.int(),
  name: z.string(),
})

export type PetSchemaType = z.infer<typeof petSchema>
```

::

To rename the types, see [Prefix inferred types](https://kubb.dev/extensions/kubb-labs/plugin-zod/guides/customization#prefix-inferred-types).

## Type codecs on each side

With `inferred: 'codec'`, Kubb writes `z.input<typeof schema>` for request schemas (bodies and params) and `z.output<typeof schema>` for response schemas.

- Use it with codecs: a request takes the domain value, such as a `Date`, which the schema encodes, and a response returns the decoded value.
- Clients and query hooks then take their operation types from these types instead of `@kubb/plugin-ts`.
- `'direction'` is the deprecated name for `'codec'`.

> [!WARNING]
> With `'codec'`, set `validator: { request: 'zod', params: 'zod' }` in [`@kubb/plugin-fetch`](https://kubb.dev/extensions/kubb-labs/plugin-fetch/options#validator) or [`@kubb/plugin-axios`](https://kubb.dev/extensions/kubb-labs/plugin-axios/options#validator). Without request validation, the client sends the domain value unencoded.

When a [printer](https://kubb.dev/extensions/kubb-labs/plugin-zod/options#printer) handler returns a different expression per `this.options.direction`, Kubb also writes an `${name}InputSchema`, which request bodies use, also through a `$ref`. Its type gets the `InputSchemaType` suffix:

```typescript [src/gen/zod/slotSchema.ts]
export type SlotSchemaType = z.output<typeof slotSchema>

export type SlotInputSchemaType = z.input<typeof slotInputSchema>
```

See [Encode custom types](https://kubb.dev/extensions/kubb-labs/plugin-zod/guides/customization#encode-custom-types) for a full example.

## Response types per status code

`inferred` also writes a `ResponsesSchema` for each operation, with one schema per status code, and its inferred type.

```typescript [src/gen/zod/listPetsSchema.ts]
export const listPetsResponsesSchema = z.object({
  '200': listPetsStatus200Schema,
})

export type ListPetsResponsesSchemaType = z.infer<typeof listPetsResponsesSchema>
```

[`@kubb/plugin-fetch`](https://kubb.dev/extensions/kubb-labs/plugin-fetch) and [`@kubb/plugin-axios`](https://kubb.dev/extensions/kubb-labs/plugin-axios) key their `RequestResult` on it when `@kubb/plugin-ts` is absent.

## Type guards with inferred types

With [`typeGuards`](https://kubb.dev/extensions/kubb-labs/plugin-zod/options#typeguards), which needs Zod 4.6 or later, and `inferred: true`, the guards narrow to the generated type, such as `PetSchemaType`. With [`mini: true`](https://kubb.dev/extensions/kubb-labs/plugin-zod/options#mini), they call `z.validate` and `z.parse`.

```typescript [src/gen/zod/petSchema.ts]
export const isPet = (data: unknown): data is PetSchemaType => petSchema.validate(data)
```
