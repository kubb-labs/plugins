# Zod

The Zod plugin generates a Zod v4 schema for every schema in your OpenAPI spec.

The client plugins `@kubb/plugin-fetch`, `@kubb/plugin-axios`, and `@kubb/plugin-client` use these schemas when you set their `validator` option.

## Setup

- No other plugins are needed.
- Install `zod` v4 in the app that uses the generated code. `compile` needs 4.5 or later, and `typeGuards` needs 4.6 or later.

## Options worth knowing

- `mini` (beta) generates Zod Mini schemas for smaller bundles, and switches `importPath` to `zod/mini`.
- `importPath` sets the module the generated files import `z` from. The default is `zod`.
- `inferred` adds a `z.infer` type next to each schema, so you can skip `@kubb/plugin-ts`.
- `coercion` wraps schemas in `z.coerce`, so input is converted before validation. Pass an object to coerce only dates, strings, or numbers.
- `guidType` picks `z.uuid()` (default) or `z.guid()` for `format: uuid`.
- `regexType` writes a `pattern` as a regex literal (default) or a `RegExp` constructor.
- `oneOfType` validates a `oneOf` with `z.union` and strict object members (default) or with `z.xor`, which needs exactly one member to match.
- `typeGuards` adds `is*` type guards and `assert*` assertions.
- `compile` wraps schemas in `z.compile` for faster validation. Circular schemas are left as they are.

See [Options](https://kubb.dev/extensions/kubb-labs/plugin-zod/options) for every option and its default.

## Example

The config below generates the schemas with a `z.infer` type next to each one.

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { pluginZod } from '@kubb/plugin-zod'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  plugins: [
    pluginZod({ inferred: true }),
  ],
})
```
