# Valibot

The Valibot plugin generates a Valibot v1 schema for every schema in your OpenAPI spec, plus the parameter, request, and response schemas of each operation.

Every generated schema is a [Standard Schema](https://standardschema.dev), so any library that takes one can validate with it.

`@kubb/plugin-fetch`, `@kubb/plugin-axios`, and `@kubb/plugin-client` validate with these schemas when you set their `validator` option to `'valibot'`.

## Setup

- No other plugins are needed.
- Install `valibot` 1.2 or later in the app that uses the generated code.

## Options worth knowing

| Option                                                                                  | Default | What it does                                                        |
| --------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------- |
| [`inferred`](https://kubb.dev/extensions/kubb-labs/plugin-valibot/options#inferred)     | `false` | Adds a type next to each schema, so you can skip `@kubb/plugin-ts`. |
| [`coercion`](https://kubb.dev/extensions/kubb-labs/plugin-valibot/options#coercion)     | `false` | Converts input before validation, such as query strings.            |
| [`typeGuards`](https://kubb.dev/extensions/kubb-labs/plugin-valibot/options#typeguards) | `false` | Adds `is*` type guards and `assert*` assertions.                    |
| [`printer`](https://kubb.dev/extensions/kubb-labs/plugin-valibot/options#printer)       | None    | Replaces the Valibot call for a schema type.                        |

## Example

This config generates the schemas with a `v.InferOutput` type next to each one. For a `Pet` schema, the plugin writes `petSchema.ts`:

::code-group

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { pluginValibot } from '@kubb/plugin-valibot'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  plugins: [pluginValibot({ inferred: true })],
})
```

```typescript [src/gen/valibot/petSchema.ts]
import * as v from 'valibot'

export const petSchema = v.object({
  id: v.pipe(v.number(), v.integer()),
  name: v.string(),
  status: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
})

export type PetSchemaType = v.InferOutput<typeof petSchema>
```

::

## Guides

- [Valibot schemas for OpenAPI formats](https://kubb.dev/extensions/kubb-labs/plugin-valibot/guides/format-mappings)
- [Infer TypeScript types from Valibot schemas](https://kubb.dev/extensions/kubb-labs/plugin-valibot/guides/inferred-types)
- [Coerce input with Valibot](https://kubb.dev/extensions/kubb-labs/plugin-valibot/guides/coercion)
- [Customize generated schemas](https://kubb.dev/extensions/kubb-labs/plugin-valibot/guides/customization)

## Differences from the Zod plugin

The two plugins share option names, generated names, and file layout. These Zod options have no Valibot counterpart:

| Zod option           | In this plugin                                                                          |
| -------------------- | --------------------------------------------------------------------------------------- |
| `guidType`           | Not needed. `v.uuid()` checks the shape only, so it already accepts any GUID.           |
| `inferred: 'codec'`  | Always on. A request schema gets `v.InferInput` and every other schema `v.InferOutput`. |
| `compile` and `mini` | Zod features. Valibot is modular by default.                                            |
