# Options

Pass these options to `pluginZod()`. Shared options link to [Shared plugin options](https://kubb.dev/docs/5.x/reference/plugin-options) for details.

## Options overview

| Option                                                                    | Purpose                                                                | Default                                      |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------- |
| [`output`](https://kubb.dev/docs/5.x/reference/plugin-options#output)     | Where files are written: `path`, `mode`, `barrel`, `banner`, `footer`. | `{ path: 'zod', barrel: { type: 'named' } }` |
| [`group`](https://kubb.dev/docs/5.x/reference/plugin-options#group)       | Split output by tag or path: `type`, `name`.                           | None                                         |
| [`importPath`](#importpath)                                               | Module the generated files import `z` from.                            | `'zod'`, or `'zod/mini'` with `mini`         |
| [`inferred`](#inferred)                                                   | Emit a `z.infer` (or `z.input`/`z.output`) alias next to each schema.  | `false`                                      |
| [`coercion`](#coercion)                                                   | Coerce input before validation.                                        | `false`                                      |
| [`guidType`](#guidtype)                                                   | Validator for `format: uuid` properties.                               | `'uuid'`                                     |
| [`regexType`](#regextype)                                                 | How an OpenAPI `pattern` is written.                                   | `'literal'`                                  |
| [`oneOfType`](#oneoftype)                                                 | How a `oneOf` is validated.                                            | `'union'`                                    |
| [`compile`](#compile)                                                     | Wrap schemas in `z.compile` for fast-path validation.                  | `false`                                      |
| [`mini`](#mini)                                                           | Generate Zod Mini schemas.                                             | `false`                                      |
| [`typeGuards`](#typeguards)                                               | Generate `is*` type guards and `assert*` assertions.                   | `false`                                      |
| [`include`](https://kubb.dev/docs/5.x/reference/plugin-options#include)   | Keep only operations and schemas that match.                           | None                                         |
| [`exclude`](https://kubb.dev/docs/5.x/reference/plugin-options#exclude)   | Skip operations and schemas that match.                                | `[]`                                         |
| [`override`](https://kubb.dev/docs/5.x/reference/plugin-options#override) | Apply different options per pattern.                                   | `[]`                                         |
| [`resolver`](#resolver)                                                   | Customize generated names and file paths.                              | `resolverZod`                                |
| [`macros`](https://kubb.dev/docs/5.x/reference/plugin-options#macros)     | Rewrite AST nodes before printing.                                     | `[]`                                         |
| [`printer`](#printer)                                                     | Replace the handler for a schema type.                                 | None                                         |

## Option details

### importPath

Module the generated files import `z` from. Point it at your own module to re-export Zod.

|          |                             |
| -------- | --------------------------- |
| Type     | `string`                    |
| Required | `false`                     |
| Default  | `mini ? 'zod/mini' : 'zod'` |

`'zod'` and `'zod/mini'` are imported as `import * as z`. A custom module is imported as `import { z }`, so export `z` by name.

### inferred

Exports a type alias next to each schema, so you do not need `@kubb/plugin-ts`. The type takes the PascalCase schema name plus `SchemaType`, so `petSchema` gets `PetSchemaType`.

|          |                          |
| -------- | ------------------------ |
| Type     | `boolean \| 'direction'` |
| Required | `false`                  |
| Default  | `false`                  |

::field-group

:::field{name="false"}
Default value. Emits no type aliases.
:::

:::field{name="true"}
Emits `z.infer<typeof schema>` for every schema.
:::

:::field{name="'direction'"}
Emits `z.input<typeof schema>` for request schemas (bodies and params) and `z.output<typeof schema>` for response schemas. Use it with codecs, where a request takes the domain value (a `Date`) that the schema encodes and a response returns the decoded value.
:::

::

```typescript
export type PetSchemaType = z.infer<typeof petSchema>
```

With `'direction'`, request types read the schema's input:

```typescript
export type PutEventBodySchemaType = z.input<typeof putEventBodySchema>
```

Pair `'direction'` with `validator: { request: 'zod', params: 'zod' }` in [`@kubb/plugin-fetch`](https://kubb.dev/extensions/kubb-labs/plugin-fetch/options#validator) or [`@kubb/plugin-axios`](https://kubb.dev/extensions/kubb-labs/plugin-axios/options#validator). Without request validation, the client sends the domain value unencoded.

It also writes a `ResponsesSchema` for each operation (one schema per status code) and its inferred type. [`@kubb/plugin-fetch`](https://kubb.dev/extensions/kubb-labs/plugin-fetch) and [`@kubb/plugin-axios`](https://kubb.dev/extensions/kubb-labs/plugin-axios) key their `RequestResult` on it when `@kubb/plugin-ts` is absent.

### coercion

Wraps schemas in `z.coerce` so input is coerced before validation, for form data, query params, and similar string sources. See [Coercion for primitives](https://zod.dev/?id=coercion-for-primitives).

|          |                                                                        |
| -------- | ---------------------------------------------------------------------- |
| Type     | `boolean \| { dates?: boolean, strings?: boolean, numbers?: boolean }` |
| Required | `false`                                                                |
| Default  | `false`                                                                |

::field-group

:::field{name="false"}
Coerces nothing and validates strictly, except `bigint` fields (`format: int64`), which always use `z.coerce.bigint()`.
:::

:::field{name="true"}
Coerces strings, numbers, and dates with `z.coerce.string()`, `z.coerce.number()` and `z.coerce.date()`.
:::

:::field{name="{ dates?, strings?, numbers? }"}
Chooses which primitives to coerce.
:::

::

> [!NOTE]
> `dates` coerces only `Date`-typed fields (from `dateType: 'date'`). ISO-string fields are never coerced, and neither are `format: time` fields, because `new Date()` cannot parse a bare `HH:mm:ss`. For a time-of-day type such as `Temporal.PlainTime`, see [Encode custom types](https://kubb.dev/extensions/kubb-labs/plugin-zod/guides/customization#encode-custom-types).

### guidType

Validator used for OpenAPI properties with `format: uuid`.

|          |                    |
| -------- | ------------------ |
| Type     | `'uuid' \| 'guid'` |
| Required | `false`            |
| Default  | `'uuid'`           |

::field-group

:::field{name="'uuid'"}
Generates `z.uuid()`, a standard RFC 4122 UUID.
:::

:::field{name="'guid'"}
Generates `z.guid()`, which is looser and accepts Microsoft-style GUIDs.
:::

::

### regexType

Controls how an OpenAPI `pattern` is written inside `.regex(...)`. Use `'constructor'` when a regex literal breaks your build or you need a string pattern.

|          |                              |
| -------- | ---------------------------- |
| Type     | `'literal' \| 'constructor'` |
| Required | `false`                      |
| Default  | `'literal'`                  |

::field-group

:::field{name="'literal'"}
Emits a regex literal, such as `.regex(/^[a-z]+$/)`.
:::

:::field{name="'constructor'"}
Emits the `RegExp` constructor, such as `.regex(new RegExp('^[a-z]+$'))`.
:::

::

### oneOfType

Controls how a `oneOf` is validated. Use `'xor'` when values may carry extra keys, or when members have no `required` keys.

|          |                    |
| -------- | ------------------ |
| Type     | `'union' \| 'xor'` |
| Required | `false`            |
| Default  | `'union'`          |

::field-group

:::field{name="'union'"}
Emits `z.union([...])`. Inline object members without `additionalProperties` print as `z.strictObject(...)`, so a value with another member's keys fails that member. Extra keys that the spec allows fail too.
:::

:::field{name="'xor'"}
Emits `z.xor([...])`, which passes only when exactly one member matches, as `oneOf` requires. Members keep their own `additionalProperties`. Needs Zod v4.2.0 or higher.
:::

::

A `oneOf` with a discriminator, where every member is an object, prints `z.discriminatedUnion(...)` with either value. An `anyOf` always prints `z.union(...)`.

### compile

Wraps schemas in `z.compile(...)` to generate validation code instead of interpreting the schema on each call. Needs Zod v4.5.0 or higher.

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
Compiles schemas using `z.compile(...)`.
:::

:::field{name="{ strict: true }"}
Passes `{ strict: true }` to `z.compile(...)`, which throws when any part of the schema cannot be compiled into flat JavaScript instead of falling back to the interpreter.
:::

::

Schemas with circular references (`z.lazy`) and bare `$ref` response aliases stay uncompiled to prevent runtime errors.

### mini

Generates [Zod Mini](https://zod.dev/packages/mini) schemas. They use functions (`z.optional(z.string())`) instead of method chains (`z.string().optional()`), so bundlers can drop unused validators. Also sets the `importPath` default to `'zod/mini'`.

|          |           |
| -------- | --------- |
| Type     | `boolean` |
| Required | `false`   |
| Default  | `false`   |

### typeGuards

Generates TypeScript type guards (`is*`) and assertion functions (`assert*`) with Zod's `validate` API. Needs Zod v4.6.0 or higher.

|          |                                                 |
| -------- | ----------------------------------------------- |
| Type     | `boolean \| { is?: boolean, assert?: boolean }` |
| Required | `false`                                         |
| Default  | `false`                                         |

::field-group

:::field{name="false"}
Generates only the Zod schemas.
:::

:::field{name="true"}
Generates both `is<Schema>` type guards and `assert<Schema>` assertion functions.
:::

:::field{name="{ is?: boolean; assert?: boolean }"}
Enables type guards or assertions separately.
:::

::

When [`inferred`](#inferred) is `true`, the guards narrow to the generated type alias such as `PetSchemaType`. When [`mini`](#mini) is `true`, they route through `z.validate` and `z.parse`.

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

### resolver

Overrides generated file and symbol names. Omitted members keep `resolverZod`. The shared members (`name`, `file`, `imports`) and the `this` context are described under [`resolver`](https://kubb.dev/docs/5.x/reference/plugin-options#resolver).

|          |                              |
| -------- | ---------------------------- |
| Type     | `ResolverPatch<ResolverZod>` |
| Required | `false`                      |

::code-collapse{name="ResolverZod patch members"}

```typescript [Partial override]
type ResolverZodPatch = {
  // plus the shared name, file, and imports members
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
  }
  response?: {
    status?(node: OperationNode, statusCode: StatusCode): string
    body?(node: OperationNode): string
    responses?(node: OperationNode): string
    response?(node: OperationNode): string
    error?(node: OperationNode): string
    options?(node: OperationNode): string
  }
}
```

::

### printer

Replaces the handler for a schema type such as `'integer'` or `'string'`. Each handler returns the Zod expression as a string, in Zod Mini syntax when `mini: true`. Inside a handler, `this.base(node)` returns the built-in output to wrap and `this.transform(node)` recurses into nested nodes. See the [printer guide](https://kubb.dev/docs/5.x/how-to/printers).

|          |                                                      |
| -------- | ---------------------------------------------------- |
| Type     | `{ nodes?: PrinterZodNodes \| PrinterZodMiniNodes }` |
| Required | `false`                                              |

```typescript
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

A handler can read `this.options.direction`, which is `'decode'` for responses and `'encode'` for request bodies and parameters. If it returns a different expression per direction, Kubb also writes an `${name}InputSchema`. Request bodies use it, including bodies that reach the schema through a `$ref`. See [Encode custom types](https://kubb.dev/extensions/kubb-labs/plugin-zod/guides/customization#encode-custom-types).
