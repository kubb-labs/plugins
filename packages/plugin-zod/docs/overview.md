# Zod

The Zod plugin generates a Zod v4 schema for every schema in your OpenAPI spec, plus the parameter, request, and response schemas of each operation. The client plugins `@kubb/plugin-fetch`, `@kubb/plugin-axios`, and `@kubb/plugin-client` use these schemas when you set their `validator` option.

## Setup

- No other plugins are needed.
- Install `zod` v4 in the app that uses the generated code. Some options need a newer minor version:

| Option             | Needs            |
| ------------------ | ---------------- |
| `oneOfType: 'xor'` | Zod 4.2 or later |
| `compile`          | Zod 4.5 or later |
| `typeGuards`       | Zod 4.6 or later |

## Options worth knowing

| Option                                                                              | Default     | What it does                                                                           |
| ----------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------- |
| [`inferred`](https://kubb.dev/extensions/kubb-labs/plugin-zod/options#inferred)     | `false`     | Adds a `z.infer` type next to each schema, so you can skip `@kubb/plugin-ts`.          |
| [`mini`](https://kubb.dev/extensions/kubb-labs/plugin-zod/options#mini)             | `false`     | Beta. Generates Zod Mini schemas for smaller bundles and imports from `zod/mini`.      |
| [`importPath`](https://kubb.dev/extensions/kubb-labs/plugin-zod/options#importpath) | `'zod'`     | Module the generated files import `z` from.                                            |
| [`coercion`](https://kubb.dev/extensions/kubb-labs/plugin-zod/options#coercion)     | `false`     | Wraps schemas in `z.coerce`. Pass an object to coerce only dates, strings, or numbers. |
| [`oneOfType`](https://kubb.dev/extensions/kubb-labs/plugin-zod/options#oneoftype)   | `'union'`   | Validates a `oneOf` with `z.union` and strict members, or with `z.xor`.                |
| [`typeGuards`](https://kubb.dev/extensions/kubb-labs/plugin-zod/options#typeguards) | `false`     | Adds `is*` type guards and `assert*` assertions.                                       |
| [`compile`](https://kubb.dev/extensions/kubb-labs/plugin-zod/options#compile)       | `false`     | Wraps schemas in `z.compile` for faster validation. Circular schemas stay as they are. |
| [`guidType`](https://kubb.dev/extensions/kubb-labs/plugin-zod/options#guidtype)     | `'uuid'`    | Uses `z.uuid()` or `z.guid()` for `format: uuid`.                                      |
| [`regexType`](https://kubb.dev/extensions/kubb-labs/plugin-zod/options#regextype)   | `'literal'` | Writes a `pattern` as a regex literal or a `RegExp` constructor.                       |

## Example

The config below generates the schemas with a `z.infer` type next to each one. For a `Pet` schema, the plugin writes `petSchema.ts`:

::code-group

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { pluginZod } from '@kubb/plugin-zod'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  plugins: [pluginZod({ inferred: true })],
})
```

```typescript [src/gen/zod/petSchema.ts]
import * as z from 'zod'

export const petSchema = z.object({
  id: z.int(),
  name: z.string(),
  status: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export type PetSchemaType = z.infer<typeof petSchema>
```

::
