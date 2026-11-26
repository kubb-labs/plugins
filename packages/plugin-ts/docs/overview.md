# TypeScript

The TypeScript plugin generates a type for every schema in your OpenAPI spec, plus the request, response, and parameter types of each operation.

The other Kubb plugins import these types, and Kubb runs this plugin before them, whatever the order of `plugins`.

## Setup

No other plugins or packages are needed.

## Options worth knowing

| Option                                                                                 | Default           | What it does                                                                             |
| -------------------------------------------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| [`enum.type`](https://kubb.dev/extensions/kubb-labs/plugin-ts/options#enumtype)        | `'asConst'`       | Writes enums as an `as const` object, an `enum`, or a literal union.                     |
| [`syntaxType`](https://kubb.dev/extensions/kubb-labs/plugin-ts/options#syntaxtype)     | `'type'`          | Writes object schemas as `type` or `interface`.                                          |
| [`optionalType`](https://kubb.dev/extensions/kubb-labs/plugin-ts/options#optionaltype) | `'questionToken'` | Writes `a?: T`, `a: T \| undefined`, or both.                                            |
| [`arrayType`](https://kubb.dev/extensions/kubb-labs/plugin-ts/options#arraytype)       | `'array'`         | Writes arrays as `T[]` or `Array<T>`.                                                    |
| [`operations`](https://kubb.dev/extensions/kubb-labs/plugin-ts/options#operations)     | `'inline'`        | `'export'` writes a types file per operation.                                            |
| [`group`](https://kubb.dev/docs/5.x/reference/plugin-options#group)                    | None              | Splits the output into folders by tag or path. Does not work with `output.mode: 'file'`. |

> [!TIP]
> The OpenAPI adapter types `int64` fields as `bigint`, but JSON responses hold numbers. For most JSON APIs, set [`integerType: 'number'`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#integertype) on `adapterOas`.

## Example

This config writes the types to `src/gen/types`. For a `Pet` schema with a `status` enum, the plugin writes `Pet.ts`:

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

Next, [customize the generated types](https://kubb.dev/extensions/kubb-labs/plugin-ts/guides/customization).
