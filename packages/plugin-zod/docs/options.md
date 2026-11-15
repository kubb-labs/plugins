# Options

Pass these options to `pluginZod()`. Shared options link to [Shared plugin options](https://kubb.dev/docs/5.x/reference/plugin-options), and this page gives only their default here.

## Options overview

| Option                                                                    | Purpose                                                                              | Default                                      |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------- |
| [`output`](https://kubb.dev/docs/5.x/reference/plugin-options#output)     | Where files are written: `path`, `mode`, `barrel`, `banner`, `footer`.               | `{ path: 'zod', barrel: { type: 'named' } }` |
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

`'zod'` and `'zod/mini'` are imported as `import * as z`. A custom module is imported as `import { z }`, so export `z` by name.

### inferred

Exports a type next to each schema, so you do not need `@kubb/plugin-ts`. The type takes the PascalCase schema name plus `SchemaType`, so `petSchema` gets `PetSchemaType`.

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
Writes `z.input<typeof schema>` for request schemas (bodies and params) and `z.output<typeof schema>` for response schemas. Use it with codecs, where a request takes the domain value (a `Date`) that the schema encodes and a response returns the decoded value. Clients and query hooks then take their operation types from these types instead of `@kubb/plugin-ts`.
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

Pair `'codec'` with `validator: { request: 'zod', params: 'zod' }` in [`@kubb/plugin-fetch`](https://kubb.dev/extensions/kubb-labs/plugin-fetch/options#validator) or [`@kubb/plugin-axios`](https://kubb.dev/extensions/kubb-labs/plugin-axios/options#validator). Without request validation, the client sends the domain value unencoded.

`inferred` also writes a `ResponsesSchema` for each operation, with one schema per status code, and its inferred type. [`@kubb/plugin-fetch`](https://kubb.dev/extensions/kubb-labs/plugin-fetch) and [`@kubb/plugin-axios`](https://kubb.dev/extensions/kubb-labs/plugin-axios) key their `RequestResult` on it when `@kubb/plugin-ts` is absent.

### coercion

Wraps schemas in `z.coerce`, so input is converted before validation. Use it for form data, query params, and other string sources. See [Coercion for primitives](https://zod.dev/?id=coercion-for-primitives).

|          |                                                                        |
| -------- | ---------------------------------------------------------------------- |
| Type     | `boolean \| { dates?: boolean, strings?: boolean, numbers?: boolean }` |
| Required | `false`                                                                |
| Default  | `false`                                                                |

| Value                            | Effect                                                                                                    |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `false` (default)                | No coercion, except `bigint` fields (`format: int64`), which always use `z.coerce.bigint()`.              |
| `true`                           | Coerces strings, numbers, and dates with `z.coerce.string()`, `z.coerce.number()`, and `z.coerce.date()`. |
| `{ dates?, strings?, numbers? }` | Coerces only the primitives you pick.                                                                     |

What each key changes:

| Key       | Coerces                                                    | Side effects                                                                                                                                                                                                                                                                                                |
| --------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `strings` | String fields                                              | Replaces the `base64`, `base64url`, `jwt`, `ulid`, `iban`, and `duration` validators with `z.coerce.string()`, so those formats are no longer checked. `email`, `uri`, `uuid`, `ipv4`, and `ipv6` keep their validator and are not coerced.                                                                 |
| `numbers` | Numbers, and enums with a numeric `format` such as `int32` | Prints every integer as `z.coerce.number().int()`, which drops the `int32` and `uint32` range checks. A coerced enum that is the discriminator of a `oneOf` prints the union as `z.union`, because `z.discriminatedUnion` cannot read coerced values. Other enums are not coerced.                          |
| `dates`   | Only `Date`-typed fields, from `dateType: 'date'`          | ISO-string fields are never coerced, and neither are `format: time` fields, because `new Date()` cannot parse a bare `HH:mm:ss`. For a time-of-day type such as `Temporal.PlainTime`, see [Encode custom types](https://kubb.dev/extensions/kubb-labs/plugin-zod/guides/customization#encode-custom-types). |

### guidType

Validator for OpenAPI properties with `format: uuid`.

|          |                    |
| -------- | ------------------ |
| Type     | `'uuid' \| 'guid'` |
| Required | `false`            |
| Default  | `'uuid'`           |

| Value              | Output                                                        |
| ------------------ | ------------------------------------------------------------- |
| `'uuid'` (default) | `z.uuid()`, a standard RFC 4122 UUID                          |
| `'guid'`           | `z.guid()`, which is looser and accepts Microsoft-style GUIDs |

### regexType

How an OpenAPI `pattern` is written inside `.regex(...)`. Use `'constructor'` when a regex literal breaks your build or you need a string pattern.

|          |                              |
| -------- | ---------------------------- |
| Type     | `'literal' \| 'constructor'` |
| Required | `false`                      |
| Default  | `'literal'`                  |

| Value                 | Output                           |
| --------------------- | -------------------------------- |
| `'literal'` (default) | `.regex(/^[a-z]+$/)`             |
| `'constructor'`       | `.regex(new RegExp("^[a-z]+$"))` |

### oneOfType

How a `oneOf` is validated. Use `'xor'` when values may carry extra keys.

|          |                    |
| -------- | ------------------ |
| Type     | `'union' \| 'xor'` |
| Required | `false`            |
| Default  | `'union'`          |

| Value               | Output           | Behavior                                                                                                                                                                                |
| ------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `'union'` (default) | `z.union([...])` | Inline object members without `additionalProperties` print as `z.strictObject(...)`, so a value with another member's keys fails that member. Extra keys that the spec allows fail too. |
| `'xor'`             | `z.xor([...])`   | Passes only when exactly one member matches, as `oneOf` requires. Members keep their own `additionalProperties`. Needs Zod 4.2 or later.                                                |

With `'xor'`, members need `required` keys that tell them apart. When every key is optional, an object matches several members and `z.xor` rejects it.

A `oneOf` with a discriminator, where every member is an object, prints `z.discriminatedUnion(...)` with either value, and its members keep the extra keys the spec allows. An `anyOf` always prints `z.union(...)`.

### compile

Wraps schemas in `z.compile(...)`, which generates validation code instead of interpreting the schema on each call. Needs Zod 4.5 or later.

|          |                                   |
| -------- | --------------------------------- |
| Type     | `boolean \| { strict?: boolean }` |
| Required | `false`                           |
| Default  | `false`                           |

| Value              | Effect                                                                                                            |
| ------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `false` (default)  | Leaves schemas uncompiled.                                                                                        |
| `true`             | Compiles schemas with `z.compile(...)`. A part that cannot be compiled falls back to the interpreter.             |
| `{ strict: true }` | Passes `{ strict: true }` to `z.compile(...)`, so Zod throws when a part cannot be compiled into flat JavaScript. |

These schemas stay uncompiled:

- Schemas with circular references (`z.lazy`).
- Bare `$ref` response aliases. An alias that adds a description, such as `petSchema.describe('A pet')`, is compiled.
- With `strict: true`, a `z.coerce` or `z.xor` schema, a union with such a member, and a schema that reaches a circular one through a `$ref`. This way the module loads without a `ZodCompileUnsupportedError`.

> [!NOTE]
> Every `format: int64` schema is coerced, and so is every schema that [`coercion`](#coercion) covers. An object or array that holds a coerced field is still compiled, and Zod runs that field on its interpreter. To compile an `int64` schema, set [`integerType: 'number'`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#integertype) on the adapter.

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

Generates TypeScript type guards (`is*`) and assertion functions (`assert*`) with Zod's `validate` API. Needs Zod 4.6 or later.

|          |                                                 |
| -------- | ----------------------------------------------- |
| Type     | `boolean \| { is?: boolean, assert?: boolean }` |
| Required | `false`                                         |
| Default  | `false`                                         |

| Value              | Generates                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| `false` (default)  | Only the Zod schemas                                                                              |
| `true`             | `is<Schema>` type guards and `assert<Schema>` assertions                                          |
| `{ is?, assert? }` | Each one on its own. Both default to `true`, so `{ assert: false }` writes only the `is*` guards. |

With [`inferred: true`](#inferred), the guards narrow to the generated type, such as `PetSchemaType`. With [`mini: true`](#mini), they call `z.validate` and `z.parse`.

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

Replaces the handler for a schema type such as `'integer'` or `'string'`. Each handler returns the Zod expression as a string, in Zod Mini syntax when `mini` is `true`. Inside a handler, `this.base(node)` returns the built-in output to wrap, and `this.transform(node)` recurses into nested nodes. See the [printer guide](https://kubb.dev/docs/5.x/how-to/customize#printers).

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

A handler can read `this.options.direction`, which is `'decode'` for responses and `'encode'` for request bodies and parameters. When it returns a different expression per direction, Kubb also writes an `${name}InputSchema`, which request bodies use, also through a `$ref`. See [Encode custom types](https://kubb.dev/extensions/kubb-labs/plugin-zod/guides/customization#encode-custom-types).

## Resolver members

A `resolver` patch overrides generated names. Members you leave out keep `resolverZod`. Next to the shared `name`, `file`, and `imports` members described under [`resolver`](https://kubb.dev/docs/5.x/reference/plugin-options#resolver), `resolverZod` has these:

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

How `@kubb/plugin-zod` maps OpenAPI types and formats to Zod v4:

| OpenAPI type and format                                | Zod                                   | Zod Mini                              | Notes                                                                 |
| :----------------------------------------------------- | :------------------------------------ | :------------------------------------ | :-------------------------------------------------------------------- |
| `integer`                                              | `z.int()`                             | `z.int()`                             | `z.coerce.number().int()` with `coercion.numbers`                     |
| `integer`, `format: int32`                             | `z.int32()`                           | `z.int32()`                           | 32-bit signed integer                                                 |
| `integer`, `format: uint32`                            | `z.uint32()`                          | `z.uint32()`                          | 32-bit unsigned integer                                               |
| `integer`, `format: int64`                             | `z.coerce.bigint()`                   | `z.coerce.bigint()`                   | Always coerced, because JSON holds a number                           |
| `string`, `format: base64`                             | `z.base64()`                          | `z.base64()`                          | Base64 string                                                         |
| `string`, `format: byte` / `binary`                    | `z.instanceof(Blob)`                  | `z.instanceof(Blob)`                  | Binary payload                                                        |
| `string`, `format: base64url`                          | `z.base64url()`                       | `z.base64url()`                       | URL-safe base64 string                                                |
| `string`, `contentEncoding: base64` / `base64url`      | `z.base64()` / `z.base64url()`        | `z.base64()` / `z.base64url()`        | Other encodings stay `z.string()`                                     |
| `string`, JSON `contentMediaType` with `contentSchema` | `z.string().refine(...)`              | `z.string().check(z.refine(...))`     | Must parse as JSON that passes the content schema. It stays a string. |
| `string`, `format: jwt`                                | `z.jwt()`                             | `z.jwt()`                             | JSON Web Token                                                        |
| `string`, `format: ulid`                               | `z.ulid()`                            | `z.ulid()`                            | ULID                                                                  |
| `string`, `format: iban`                               | `z.iban()`                            | `z.iban()`                            | International Bank Account Number                                     |
| `string`, `format: duration`                           | `z.iso.duration()`                    | `z.iso.duration()`                    | ISO 8601 duration                                                     |
| `string`, `format: uuid`                               | `z.uuid()` or `z.guid()`              | `z.uuid()` or `z.guid()`              | Set by [`guidType`](#guidtype)                                        |
| `string`, `format: email`                              | `z.email()`                           | `z.email()`                           | Email                                                                 |
| `string`, `format: uri` / `url`                        | `z.url()`                             | `z.url()`                             | URL                                                                   |
| `string`, `format: ipv4` / `ipv6`                      | `z.ipv4()` / `z.ipv6()`               | `z.ipv4()` / `z.ipv6()`               | IP address                                                            |
| `string`, `format: date`                               | `z.iso.date()`                        | `z.iso.date()`                        | ISO 8601 date                                                         |
| `string`, `format: date-time`                          | `z.iso.datetime()`                    | `z.string()`                          | ISO 8601 date-time                                                    |
| `string`, `format: time`                               | `z.iso.time()`                        | `z.iso.time()`                        | ISO 8601 time                                                         |
| `object`, `additionalProperties: <schema>`             | `z.record(z.string(), schema)`        | `z.record(z.string(), schema)`        | Dictionary with no fixed properties                                   |
| `object`, `additionalProperties: true`                 | `z.looseObject(shape)`                | `z.looseObject(shape)`                | Allows extra keys                                                     |
| `object`, `propertyNames: <schema>`                    | `z.record(keySchema, schema)`         | `z.record(keySchema, schema)`         | Validated keys, such as a pattern or format                           |
| `object`, `propertyNames: <enum>`                      | `z.partialRecord(enumSchema, schema)` | `z.partialRecord(enumSchema, schema)` | Enum keys may be missing                                              |

These keywords print a `z.refine` check in both APIs:

| Keyword                                                      | Check                                                                            |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `if`/`then`/`else`, `dependentRequired`, `dependentSchemas`  | Checks the input before parsing, in `z.pipe(z.unknown().check(...), schema)`.    |
| `contains` with `minContains` and `maxContains`              | Counts the matching items of an array.                                           |
| `propertyNames` on an object that also declares `properties` | Checks every key of the input. A dictionary keeps `z.record(keySchema, schema)`. |

Dictionaries and key schemas:

- An open key schema from `propertyNames`, such as a regex, UUID, or length constraint, prints `z.record(keySchema, valueSchema)`.
- Closed keys, such as enums, literals, or unions of enums, print `z.partialRecord`, so only present keys are validated. The inferred type is `Partial<Record<Keys, Value>>`.
- `patternProperties` joins its key patterns into one alternation and prints `z.record(z.string().regex(...), valueSchema)`. Zod Mini uses `z.string().check(z.regex(...))` for the key.
- An `additionalProperties` schema without fixed properties prints a dictionary. With fixed properties, it prints `.catchall(valueSchema)` to keep the declared shape.
