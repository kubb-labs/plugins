# Options

Pass these options to `pluginZod()`. Shared options link to [Shared plugin options](https://kubb.dev/docs/5.x/reference/plugin-options).

## Options overview

| Option                                                                    | Purpose                                                                              | Default                                      |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------- |
| [`output`](https://kubb.dev/docs/5.x/reference/plugin-options#output)     | Where files are written.                                                             | `{ path: 'zod', barrel: { type: 'named' } }` |
| [`group`](https://kubb.dev/docs/5.x/reference/plugin-options#group)       | Split output by tag or path.                                                         | None                                         |
| [`importPath`](#importpath)                                               | Module the generated files import `z` from.                                          | `'zod'`, or `'zod/mini'` with `mini`         |
| [`inferred`](#inferred)                                                   | Export a type next to each schema.                                                   | `false`                                      |
| [`coercion`](#coercion)                                                   | Coerce input before validation.                                                      | `false`                                      |
| [`guidType`](#guidtype)                                                   | Validator for `format: uuid`.                                                        | `'uuid'`                                     |
| [`regexType`](#regextype)                                                 | How an OpenAPI `pattern` is written.                                                 | `'literal'`                                  |
| [`oneOfType`](#oneoftype)                                                 | How a `oneOf` is validated.                                                          | `'union'`                                    |
| [`compile`](#compile)                                                     | Wrap schemas in `z.compile` for fast-path validation.                                | `false`                                      |
| [`mini`](#mini)                                                           | Generate Zod Mini schemas.                                                           | `false`                                      |
| [`typeGuards`](#typeguards)                                               | Generate `is*` type guards and `assert*` assertions.                                 | `false`                                      |
| [`printer`](#printer)                                                     | Replace the handler for a schema type.                                               | None                                         |
| [`include`](https://kubb.dev/docs/5.x/reference/plugin-options#include)   | Keep only operations and schemas that match.                                         | None                                         |
| [`exclude`](https://kubb.dev/docs/5.x/reference/plugin-options#exclude)   | Skip operations and schemas that match.                                              | `[]`                                         |
| [`override`](https://kubb.dev/docs/5.x/reference/plugin-options#override) | Apply different options per pattern.                                                 | `[]`                                         |
| [`resolver`](https://kubb.dev/docs/5.x/reference/plugin-options#resolver) | Customize generated names and file paths. See [resolver members](#resolver-members). | `resolverZod`                                |
| [`macros`](https://kubb.dev/docs/5.x/reference/plugin-options#macros)     | Rewrite AST nodes before printing.                                                   | `[]`                                         |

## Option details

### importPath

Module the generated files import `z` from, such as your own module that re-exports Zod.

|          |                                 |
| -------- | ------------------------------- |
| Type     | `'zod' \| 'zod/mini' \| string` |
| Required | `false`                         |
| Default  | `mini ? 'zod/mini' : 'zod'`     |

`'zod'` and `'zod/mini'` are imported as `import * as z`. Any other module is imported as `import { z }`, so export `z` by name.

### inferred

Exports a type next to each schema, so you do not need `@kubb/plugin-ts`.

|          |                                     |
| -------- | ----------------------------------- |
| Type     | `boolean \| 'codec' \| 'direction'` |
| Required | `false`                             |
| Default  | `false`                             |

::field-group

:::field{name="true"}
Writes `z.infer<typeof schema>` for every schema.
:::

:::field{name="'codec'"}
Writes `z.input` for request schemas and `z.output` for response schemas, for codecs. See [Type codecs on each side](https://kubb.dev/extensions/kubb-labs/plugin-zod/guides/inferred-types#type-codecs-on-each-side).
:::

:::field{name="'direction'"}
Deprecated name for `'codec'`.
:::

::

::code-group

```typescript [true]
export type PetSchemaType = z.infer<typeof petSchema>
```

```typescript ['codec' (request)]
export type PutEventBodySchemaType = z.input<typeof putEventBodySchema>
```

::

> [!WARNING]
> With `'codec'`, set `validator: { request: 'zod', params: 'zod' }` in [`@kubb/plugin-fetch`](https://kubb.dev/extensions/kubb-labs/plugin-fetch/options#validator) or [`@kubb/plugin-axios`](https://kubb.dev/extensions/kubb-labs/plugin-axios/options#validator), or the client sends the domain value unencoded.

### coercion

Wraps schemas in `z.coerce` to convert input, such as form data and query params, before validation.

|          |                                                                        |
| -------- | ---------------------------------------------------------------------- |
| Type     | `boolean \| { dates?: boolean, strings?: boolean, numbers?: boolean }` |
| Required | `false`                                                                |
| Default  | `false`                                                                |

::field-group

:::field{name="false"}
No coercion, except `format: int64` fields, which use `z.coerce.bigint().pipe(z.int64())` with the adapter's default `integerType: 'bigint'`.
:::

:::field{name="true"}
Coerces strings, numbers, and dates.
:::

:::field{name="{ dates?, strings?, numbers? }"}
Coerces only the primitives you pick.
:::

::

Coerced fields lose some format checks, such as `jwt`. See [Coerce input with Zod](https://kubb.dev/extensions/kubb-labs/plugin-zod/guides/coercion).

### guidType

Validator for `format: uuid`.

|          |                    |
| -------- | ------------------ |
| Type     | `'uuid' \| 'guid'` |
| Required | `false`            |
| Default  | `'uuid'`           |

::field-group

:::field{name="'uuid'"}
Writes `z.uuid()`, for a standard RFC 4122 UUID.
:::

:::field{name="'guid'"}
Writes `z.guid()`, which also accepts Microsoft-style GUIDs.
:::

::

### regexType

How an OpenAPI `pattern` is written inside `.regex(...)`. Use `'constructor'` when a regex literal breaks your build or you need a string pattern.

|          |                              |
| -------- | ---------------------------- |
| Type     | `'literal' \| 'constructor'` |
| Required | `false`                      |
| Default  | `'literal'`                  |

::field-group

:::field{name="'literal'"}
Writes `.regex(/^[a-z]+$/)`.
:::

:::field{name="'constructor'"}
Writes `.regex(new RegExp("^[a-z]+$"))`.
:::

::

### oneOfType

How a `oneOf` without a discriminator is validated. Use `'xor'` when values may carry extra keys.

|          |                    |
| -------- | ------------------ |
| Type     | `'union' \| 'xor'` |
| Required | `false`            |
| Default  | `'union'`          |

::field-group

:::field{name="'union'"}
Writes `z.union([...])` with strict object members, so extra keys fail, even keys the spec allows.
:::

:::field{name="'xor'"}
Writes `z.xor([...])`, which passes only when exactly one member matches. Needs Zod 4.2 or later.
:::

::

### compile

Wraps schemas in `z.compile(...)`, which generates validation code instead of interpreting the schema on each call. Needs Zod 4.5 or later.

|          |                                   |
| -------- | --------------------------------- |
| Type     | `boolean \| { strict?: boolean }` |
| Required | `false`                           |
| Default  | `false`                           |

::field-group

:::field{name="true"}
Compiles schemas. Parts that cannot compile fall back to the interpreter.
:::

:::field{name="{ strict: true }"}
Zod throws when a part cannot be compiled, except in schemas Kubb leaves uncompiled.
:::

::

Circular schemas and coerced fields, `int64` included, stay on the interpreter. See [Compile Zod schemas](https://kubb.dev/extensions/kubb-labs/plugin-zod/guides/compiled-schemas).

### mini

Generates [Zod Mini](https://zod.dev/packages/mini) schemas, which use functions instead of method chains so bundlers can drop unused validators. It sets the `importPath` default to `'zod/mini'`. In beta.

|          |           |
| -------- | --------- |
| Type     | `boolean` |
| Required | `false`   |
| Default  | `false`   |

::code-group

```typescript [mini: false]
status: z.string().optional(),
```

```typescript [mini: true]
status: z.optional(z.string()),
```

::

### typeGuards

Generates `is*` type guards and `assert*` assertions with Zod's `validate` API. Needs Zod 4.6 or later.

|          |                                                 |
| -------- | ----------------------------------------------- |
| Type     | `boolean \| { is?: boolean, assert?: boolean }` |
| Required | `false`                                         |
| Default  | `false`                                         |

::field-group

:::field{name="true"}
Writes both `is<Schema>` and `assert<Schema>`.
:::

:::field{name="{ is?, assert? }"}
Both default to `true`, so `{ assert: false }` writes only the `is*` guards.
:::

::

::code-collapse{name="Guards added to petSchema.ts with typeGuards: true"}

```typescript [src/gen/zod/petSchema.ts]
export const isPet = (data: unknown): data is z.infer<typeof petSchema> => petSchema.validate(data)

export function assertPet(data: unknown): asserts data is z.infer<typeof petSchema> {
  if (!petSchema.validate(data)) {
    petSchema.parse(data)
  }
}
```

::

### printer

Replaces the handler for a schema type such as `'integer'`. Each handler returns the Zod expression as a string, in Zod Mini syntax when `mini` is `true`. `this.base(node)` returns the built-in output, and `this.transform(node)` recurses into nested nodes. See the [printer guide](https://kubb.dev/docs/5.x/how-to/customize#printers).

|          |                                                      |
| -------- | ---------------------------------------------------- |
| Type     | `{ nodes?: PrinterZodNodes \| PrinterZodMiniNodes }` |
| Required | `false`                                              |

```typescript [kubb.config.ts]
import { pluginZod } from '@kubb/plugin-zod'

pluginZod({
  printer: {
    nodes: {
      integer() {
        return 'z.number()'
      },
    },
  },
})
```

To convert requests and responses differently, branch on `this.options.direction`, as in [Encode custom types](https://kubb.dev/extensions/kubb-labs/plugin-zod/guides/customization#encode-custom-types).

## Resolver members

`resolver` takes one patch or an array of patches. An array merges over `resolverZod` from left to right.

Besides the shared members of [`resolver`](https://kubb.dev/docs/5.x/reference/plugin-options#resolver), `resolverZod` has these. Members you leave out keep the default.

::code-collapse{name="ResolverZod patch members"}

```typescript [Partial override]
type ResolverZodPatch = {
  schema?: {
    typeName?(name: string): string
    type?(name: string): string
    inputName?(name: string): string
    inputTypeName?(name: string): string
    isName?(name: string): string
    assertName?(name: string): string
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
    responses?(node: OperationNode): string
    response?(node: OperationNode): string
    error?(node: OperationNode): string
    options?(node: OperationNode): string
  }
}
```

::

## Format and type mappings

Kubb maps each OpenAPI format to its Zod v4 call, such as `format: email` to `z.email()`. See [Zod validators for OpenAPI formats](https://kubb.dev/extensions/kubb-labs/plugin-zod/guides/format-mappings).
