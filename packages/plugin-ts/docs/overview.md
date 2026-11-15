# TypeScript

The TypeScript plugin generates a type or interface for every schema in your OpenAPI spec, plus the request, response, and parameter types of each operation. The other Kubb plugins import these types, and Kubb runs this plugin before them, whatever the order of the `plugins` array.

## Setup

No other plugins or packages are needed.

## Options worth knowing

| Option                                                                                 | Default           | What it does                                                                                   |
| -------------------------------------------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------- |
| [`enum.type`](https://kubb.dev/extensions/kubb-labs/plugin-ts/options#enumtype)        | `'asConst'`       | Writes enums as an `as const` object, a TypeScript `enum`, a `const enum`, or a literal union. |
| [`syntaxType`](https://kubb.dev/extensions/kubb-labs/plugin-ts/options#syntaxtype)     | `'type'`          | Writes object schemas as `type` aliases or `interface` declarations.                           |
| [`optionalType`](https://kubb.dev/extensions/kubb-labs/plugin-ts/options#optionaltype) | `'questionToken'` | Writes optional properties as `a?: T`, `a: T \| undefined`, or both.                           |
| [`arrayType`](https://kubb.dev/extensions/kubb-labs/plugin-ts/options#arraytype)       | `'array'`         | Writes arrays as `T[]` or `Array<T>`.                                                          |
| [`operations`](https://kubb.dev/extensions/kubb-labs/plugin-ts/options#operations)     | `'export'`        | `'inline'` skips the per-operation type files.                                                 |
| [`group`](https://kubb.dev/docs/5.x/reference/plugin-options#group)                    | None              | Splits the output into folders by tag or path. It does not work with `output.mode: 'file'`.    |

> [!TIP]
> The OpenAPI adapter types `int64` fields as `bigint`, while JSON responses hold numbers. Set [`integerType: 'number'`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#integertype) on `adapterOas` for most JSON APIs.

## Example

The config below writes the types to `src/gen/types`. For a `Pet` schema with a `status` enum, the plugin writes `Pet.ts`:

::code-group

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  plugins: [pluginTs()],
})
```

```typescript [src/gen/types/Pet.ts]
// excerpt, without JSDoc
export const petStatusEnum = {
  available: 'available',
  pending: 'pending',
  sold: 'sold',
} as const

export type PetStatusEnumKey = (typeof petStatusEnum)[keyof typeof petStatusEnum]

export type Pet = {
  id?: bigint
  name: string
  photoUrls: string[]
  status?: PetStatusEnumKey
}
```

::
