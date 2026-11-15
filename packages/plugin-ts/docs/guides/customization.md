# Customize generated types

Prefix TypeScript names, change how a schema type prints, and remove descriptions.

Each change goes into `pluginTs()` in the [TypeScript plugin configuration](https://kubb.dev/extensions/kubb-labs/plugin-ts#example).

## Prefix type names

Override `resolver.name` and call `resolverTs.name` first, so the plugin's PascalCase rule still applies.

::code-group

```typescript [kubb.config.ts]
import { pluginTs, resolverTs } from '@kubb/plugin-ts'

pluginTs({
  resolver: {
    name(name) {
      return 'Api' + resolverTs.name(name)
    },
  },
})
```

```typescript [Before]
export type Pet = { name: string }
```

```typescript [After]
export type ApiPet = { name: string }
```

::

File names stay the same unless you also override the file resolver. The [options page](https://kubb.dev/extensions/kubb-labs/plugin-ts/options#resolver-members) lists every resolver member.

## Map schema types

Replace a [printer handler](https://kubb.dev/extensions/kubb-labs/plugin-ts/options#printer). Each handler returns the TypeScript type as a string.

::code-group

```typescript [kubb.config.ts]
import { pluginTs } from '@kubb/plugin-ts'

pluginTs({
  printer: {
    nodes: {
      date() {
        return 'Date'
      },
      integer() {
        return 'bigint'
      },
    },
  },
})
```

```typescript [Before]
export type Pet = {
  birthday?: string
  age?: number
}
```

```typescript [After]
export type Pet = {
  birthday?: Date
  age?: bigint
}
```

::

Pick the handler that matches the schema:

| Schema                                  | Handler                               |
| --------------------------------------- | ------------------------------------- |
| `format: date`                          | `date`                                |
| `format: date-time`                     | `datetime`                            |
| `integer`, `format: int32` or no format | `integer`                             |
| `integer`, `format: int64`              | `bigint`, already `bigint` by default |

> [!WARNING]
> A handler that returns a TypeScript compiler node is deprecated and is removed in the next major. It still works when your project installs `@kubb/parser-ts`, plus `typescript` 5 or 6, or `@typescript/typescript6` next to TypeScript 7. All are optional peer dependencies. Without `@kubb/parser-ts`, the build stops with an error that tells you to install it.

## Remove descriptions

Clear schema descriptions with a [macro](https://kubb.dev/docs/5.x/reference/plugin-options#macros).

::code-group

```typescript [kubb.config.ts]
import { pluginTs } from '@kubb/plugin-ts'
import { defineMacro } from 'kubb/kit'

const dropDescriptions = defineMacro({
  name: 'drop-descriptions',
  schema(node) {
    return 'description' in node && node.description
      ? { ...node, description: undefined }
      : undefined
  },
})

pluginTs({ macros: [dropDescriptions] })
```

```typescript [Before]
export type Pet = {
  /**
   * @description The name of the pet
   * @type string
   */
  name: string
}
```

```typescript [After]
export type Pet = {
  name: string
}
```

::

The OpenAPI document stays unchanged. The same macro works with `pluginZod`, with [one exception](https://kubb.dev/extensions/kubb-labs/plugin-zod/guides/customization#remove-descriptions).
