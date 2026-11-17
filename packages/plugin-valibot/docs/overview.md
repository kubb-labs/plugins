# Valibot

The Valibot plugin generates a Valibot v1 schema for every schema in your OpenAPI spec, plus the parameter, request, and response schemas of each operation.

`@kubb/plugin-fetch`, `@kubb/plugin-axios`, and `@kubb/plugin-client` validate with these schemas when you set their `validator` option to `'valibot'`.

## Setup

- No other plugins are needed.
- Install `valibot` 1.2 or later in the app that uses the generated code.

## Options worth knowing

| Option                                                                                | Default     | What it does                                                                         |
| ------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------ |
| [`inferred`](https://kubb.dev/extensions/kubb-labs/plugin-valibot/options#inferred)   | `false`     | Adds a `v.InferOutput` type next to each schema, so you can skip `@kubb/plugin-ts`.  |
| [`regexType`](https://kubb.dev/extensions/kubb-labs/plugin-valibot/options#regextype) | `'literal'` | Writes an OpenAPI `pattern` as a regex literal or a `RegExp` call.                   |
| [`printer`](https://kubb.dev/extensions/kubb-labs/plugin-valibot/options#printer)     | None        | Replaces the Valibot call for a schema type, such as a date that parses to a `Date`. |

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

Next, look up [the Valibot call for each OpenAPI format](https://kubb.dev/extensions/kubb-labs/plugin-valibot/guides/format-mappings).
