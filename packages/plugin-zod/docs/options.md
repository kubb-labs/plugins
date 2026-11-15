# Options

Pass these options to `pluginZod()`. Shared options link to [Shared plugin options](https://kubb.dev/docs/5.x/reference/plugin-options), and this page gives only their default here.

## Options overview

| Option                                                                    | Purpose                                                                              | Default                                      |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------- |
| [`output`](https://kubb.dev/docs/5.x/reference/plugin-options#output)     | Where files are written.                                                             | `{ path: 'zod', barrel: { type: 'named' } }` |
| [`group`](https://kubb.dev/docs/5.x/reference/plugin-options#group)       | Split output by tag or path.                                                         | None                                         |
| [`importPath`](#importpath)                                               | Module the generated files import `z` from.                                          | `'zod'`, or `'zod/mini'` with `mini`         |
| [`inferred`](#inferred)                                                   | Add a `z.infer` (or `z.input` and `z.output`) type next to each schema.              | `false`                                      |
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

Module the generated files import `z` from. Point it at your own module to re-export Zod.

|          |                                 |
| -------- | ------------------------------- |
| Type     | `'zod' \| 'zod/mini' \| string` |
| Required | `false`                         |
| Default  | `mini ? 'zod/mini' : 'zod'`     |

::field-group

:::field{name="'zod'"}
Writes `import * as z from 'zod'`.
:::

:::field{name="'zod/mini'"}
Writes `import * as z from 'zod/mini'`.
:::

::

Any other module is imported as `import { z }`, so export `z` by name.

### inferred

Exports a type next to each schema, so you do not need `@kubb/plugin-ts`.

|          |                                     |
| -------- | ----------------------------------- |
| Type     | `boolean \| 'codec' \| 'direction'` |
| Required | `false`                             |
| Default  | `false`                             |

::field-group

:::field{name="false"}
Writes no types.
:::

:::field{name="true"}
Writes `z.infer<typeof schema>` for every schema.
:::

:::field{name="'codec'"}
Writes `z.input` for request schemas and `z.output` for response schemas, so a codec types each side with its domain value. Clients and query hooks then use these types instead of `@kubb/plugin-ts`.
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
> With `'codec'`, set `validator: { request: 'zod', params: 'zod' }` in [`@kubb/plugin-fetch`](https://kubb.dev/extensions/kubb-labs/plugin-fetch/options#validator) or [`@kubb/plugin-axios`](https://kubb.dev/extensions/kubb-labs/plugin-axios/options#validator). Without request validation, the client sends the domain value unencoded.

See [Zod inferred types](EDGE:zod-inferred-types).

### coercion

Wraps schemas in [`z.coerce`](https://zod.dev/?id=coercion-for-primitives), so input is converted before validation. Use it for form data, query params, and other string sources.

|          |                                                                        |
| -------- | ---------------------------------------------------------------------- |
| Type     | `boolean \| { dates?: boolean, strings?: boolean, numbers?: boolean }` |
| Required | `false`                                                                |
| Default  | `false`                                                                |

::field-group

:::field{name="false"}
No coercion, except `format: int64` fields, which always use `z.coerce.bigint()`.
:::

:::field{name="true"}
Coerces strings, numbers, and dates.
:::

:::field{name="{ dates?, strings?, numbers? }"}
Coerces only the primitives you pick.
:::

::

> [!WARNING]
> Coerced strings and numbers lose some format checks, such as `jwt` and the `int32` range. `dates` coerces only fields typed as `Date`, from the adapter's `dateType: 'date'`.

See [Zod coercion](EDGE:zod-coercion).

### guidType

Validator for `format: uuid`.

|          |                    |
| -------- | ------------------ |
| Type     | `'uuid' \| 'guid'` |
| Required | `false`            |
| Default  | `'uuid'`           |

::field-group

:::field{name="'uuid'"}
Writes `z.uuid()`, which accepts a standard RFC 4122 UUID.
:::

:::field{name="'guid'"}
Writes `z.guid()`, which is looser and accepts Microsoft-style GUIDs.
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

How a `oneOf` is validated. Use `'xor'` when values may carry extra keys.

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
Writes `z.xor([...])`, which passes only when exactly one member matches. Members keep their own `additionalProperties`. Needs Zod 4.2 or later.
:::

::

> [!WARNING]
> With `'xor'`, give members `required` keys that tell them apart. An object that matches several members fails.

See [Unions and oneOf](EDGE:unions-and-one-of).

### compile

Wraps schemas in `z.compile(...)`, which generates validation code instead of interpreting the schema on each call. Needs Zod 4.5 or later.

|          |                                   |
| -------- | --------------------------------- |
| Type     | `boolean \| { strict?: boolean }` |
| Required | `false`                           |
| Default  | `false`                           |

::field-group

:::field{name="false"}
Leaves schemas uncompiled.
:::

:::field{name="true"}
Compiles schemas. A part that cannot be compiled falls back to the interpreter.
:::

:::field{name="{ strict: true }"}
Zod throws when a part cannot be compiled into flat JavaScript.
:::

::

> [!NOTE]
> Circular schemas and coerced fields, including every `format: int64` field, run on the interpreter. To compile `int64` fields, set [`integerType: 'number'`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#integertype) on the adapter.

See [Compiled Zod schemas](EDGE:zod-compile).

### mini

Generates [Zod Mini](https://zod.dev/packages/mini) schemas, which use functions instead of method chains, so bundlers can drop unused validators. It also sets the `importPath` default to `'zod/mini'`. This option is in beta.

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

:::field{name="false"}
Writes only the Zod schemas.
:::

:::field{name="true"}
Writes `is<Schema>` type guards and `assert<Schema>` assertions.
:::

:::field{name="{ is?, assert? }"}
Turns each one on or off. Both default to `true`, so `{ assert: false }` writes only the `is*` guards.
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

Replaces the handler for a schema type such as `'integer'` or `'string'`. Each handler returns the Zod expression as a string, in Zod Mini syntax when `mini` is `true`. Inside a handler, `this.base(node)` returns the built-in output, and `this.transform(node)` recurses into nested nodes. See the [printer guide](https://kubb.dev/docs/5.x/how-to/customize#printers).

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

To convert values one way for responses and another way for requests, branch on `this.options.direction`. See [Encode custom types](https://kubb.dev/extensions/kubb-labs/plugin-zod/guides/customization#encode-custom-types).

## Resolver members

Members you leave out of a `resolver` patch keep `resolverZod`. Besides the shared `name`, `file`, and `imports` members of [`resolver`](https://kubb.dev/docs/5.x/reference/plugin-options#resolver), `resolverZod` has these:

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

Kubb maps OpenAPI formats to the matching Zod v4 call, such as `format: email` to `z.email()`. Watch for these mappings:

- `format: int64` always prints `z.coerce.bigint()`, because JSON holds a number.
- `format: uuid` prints `z.uuid()` or `z.guid()`, set by [`guidType`](#guidtype).
- Zod Mini prints `format: date-time` as `z.string()`.

See [Zod format mappings](EDGE:zod-format-mappings).

See [Additional properties](EDGE:additional-properties).

See [JSON Schema keywords](EDGE:json-schema-keywords).
