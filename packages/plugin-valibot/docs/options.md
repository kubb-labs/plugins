# Options

Pass these options to `pluginValibot()`. Shared options link to [Shared plugin options](https://kubb.dev/docs/5.x/reference/plugin-options).

## Options overview

| Option                                                                    | Purpose                                                                              | Default                                          |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------ |
| [`output`](https://kubb.dev/docs/5.x/reference/plugin-options#output)     | Where files are written.                                                             | `{ path: 'valibot', barrel: { type: 'named' } }` |
| [`group`](https://kubb.dev/docs/5.x/reference/plugin-options#group)       | Split output by tag or path.                                                         | None                                             |
| [`importPath`](#importpath)                                               | Module the generated files import `v` from.                                          | `'valibot'`                                      |
| [`inferred`](#inferred)                                                   | Export a type next to each schema.                                                   | `false`                                          |
| [`regexType`](#regextype)                                                 | How an OpenAPI `pattern` is written.                                                 | `'literal'`                                      |
| [`printer`](#printer)                                                     | Replace the handler for a schema type.                                               | None                                             |
| [`include`](https://kubb.dev/docs/5.x/reference/plugin-options#include)   | Keep only operations and schemas that match.                                         | None                                             |
| [`exclude`](https://kubb.dev/docs/5.x/reference/plugin-options#exclude)   | Skip operations and schemas that match.                                              | `[]`                                             |
| [`override`](https://kubb.dev/docs/5.x/reference/plugin-options#override) | Apply different options per pattern.                                                 | `[]`                                             |
| [`resolver`](https://kubb.dev/docs/5.x/reference/plugin-options#resolver) | Customize generated names and file paths. See [resolver members](#resolver-members). | `resolverValibot`                                |
| [`macros`](https://kubb.dev/docs/5.x/reference/plugin-options#macros)     | Rewrite AST nodes before printing.                                                   | `[]`                                             |

## Option details

### importPath

Module the generated files import `v` from, such as your own module that re-exports Valibot.

|          |             |
| -------- | ----------- |
| Type     | `string`    |
| Required | `false`     |
| Default  | `'valibot'` |

The module is imported as `import * as v`, so it must export every Valibot function the schemas call.

### inferred

Exports a type next to each schema, so you do not need `@kubb/plugin-ts`.

|          |           |
| -------- | --------- |
| Type     | `boolean` |
| Required | `false`   |
| Default  | `false`   |

```typescript [petSchema.ts]
export type PetSchemaType = v.InferOutput<typeof petSchema>
```

A schema that is part of a circular reference is annotated as `v.GenericSchema`, so its inferred type is `unknown`. Add `@kubb/plugin-ts` when you need the types of those schemas.

### regexType

How an OpenAPI `pattern` is written inside `v.regex(...)`. Use `'constructor'` when a regex literal breaks your build or you need a string pattern.

|          |                              |
| -------- | ---------------------------- |
| Type     | `'literal' \| 'constructor'` |
| Required | `false`                      |
| Default  | `'literal'`                  |

::field-group

:::field{name="'literal'"}
Writes `v.regex(/^[a-z]+$/)`.
:::

:::field{name="'constructor'"}
Writes `v.regex(new RegExp("^[a-z]+$"))`.
:::

::

### printer

Replaces the handler for a schema type such as `'date'`. Each handler returns the Valibot expression as a string. `this.base(node)` returns the built-in output, and `this.transform(node)` recurses into nested nodes. See the [printer guide](https://kubb.dev/docs/5.x/how-to/customize#printers).

|          |                                   |
| -------- | --------------------------------- |
| Type     | `{ nodes?: PrinterValibotNodes }` |
| Required | `false`                           |

```typescript [kubb.config.ts]
import { pluginValibot } from '@kubb/plugin-valibot'

pluginValibot({
  printer: {
    nodes: {
      date() {
        return 'v.pipe(v.string(), v.isoDate(), v.transform((value) => new Date(value)))'
      },
    },
  },
})
```

## Resolver members

Besides the shared members of [`resolver`](https://kubb.dev/docs/5.x/reference/plugin-options#resolver), `resolverValibot` has these. Members you leave out keep the default.

::code-collapse{name="ResolverValibot patch members"}

```typescript [Partial override]
type ResolverValibotPatch = {
  schema?: {
    typeName?(name: string): string
    type?(name: string): string
  }
  param?: {
    name?(node: OperationNode, param: ParameterNode): string
    path?(node: OperationNode, param: ParameterNode): string
    query?(node: OperationNode, param: ParameterNode): string
    headers?(node: OperationNode, param: ParameterNode): string
    cookies?(node: OperationNode, param: ParameterNode): string
  }
  response?: {
    status?(node: OperationNode, statusCode: StatusCode): string
    headers?(node: OperationNode, statusCode: StatusCode): string
    body?(node: OperationNode): string
    response?(node: OperationNode): string
    error?(node: OperationNode): string
  }
}
```

::

## Format and type mappings

Kubb maps each OpenAPI format to its Valibot call, such as `format: email` to `v.pipe(v.string(), v.email())`. See [Valibot schemas for OpenAPI formats](https://kubb.dev/extensions/kubb-labs/plugin-valibot/guides/format-mappings).
