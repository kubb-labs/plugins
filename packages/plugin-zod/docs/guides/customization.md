# Customize generated schemas

Prefix inferred types, change Zod validators, and encode custom request types.

Start with the [Zod plugin configuration](https://kubb.dev/extensions/kubb-labs/plugin-zod#example). Apply these changes to `pluginZod()` in that configuration.

## Prefix inferred types

Enable `inferred` and override `resolver.schema.typeName`.

```typescript [kubb.config.ts]
import { pluginZod } from '@kubb/plugin-zod'

pluginZod({
  inferred: true,
  resolver: {
    schema: {
      typeName(name) {
        return 'Api' + name
      },
    },
  },
})
```

The type becomes `ApiPet`. The schema constant stays `petSchema`. The callback receives the cased type name, so no additional casing helper is needed.

## Use numbers for int64 fields

Replace the `bigint` printer handler to validate `int64` fields with `z.int()`.

```typescript [kubb.config.ts]
import { pluginZod } from '@kubb/plugin-zod'

pluginZod({
  printer: {
    nodes: {
      bigint() {
        return 'z.int()'
      },
    },
  },
})
```

The `integer` handler controls `int32` fields separately. To change integer representation across all plugins, use the adapter's [`integerType`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#integertype).

## Remove descriptions

Use the [description-removal macro](https://kubb.dev/extensions/kubb-labs/plugin-ts/guides/customization#remove-descriptions) with `pluginZod({ macros: [dropDescriptions] })`. Generated schemas omit description metadata.

## Encode custom types

A direction-aware printer decodes response values and encodes request values. This example converts ISO time strings to `Temporal.PlainTime`.

```typescript [kubb.config.ts]
import { pluginZod, type PrinterZodNodes } from '@kubb/plugin-zod'

const nodes: PrinterZodNodes = {
  time() {
    return this.options.direction === 'encode'
      ? 'z.instanceof(Temporal.PlainTime).transform((value) => value.toString())'
      : 'z.iso.time().transform((value) => Temporal.PlainTime.from(value))'
  },
}

pluginZod({ inferred: true, printer: { nodes } })
```

Use a runtime that provides `Temporal`, or add its polyfill through a generated import or banner. Match the OpenAPI format: `time`, `date`, and `date-time` use `time`, `date`, and `datetime` handlers.

The generator emits separate response and input schemas, including through `$ref`:

```typescript [src/gen/zod/slotSchema.ts]
export const slotSchema = z.object({
  startsAt: z.iso.time().transform((value) => Temporal.PlainTime.from(value)),
})

export const slotInputSchema = z.object({
  startsAt: z.instanceof(Temporal.PlainTime).transform((value) => value.toString()),
})
```

> [!IMPORTANT]
> Use `inferred: true` without `pluginTs` so the client types follow these conversions. Types from `pluginTs` describe the wire format.

For built-in date conversion, set `dateType: 'date'` on the adapter. Generated response schemas convert ISO datetimes to `Date`. Request schemas convert them back with `toISOString()`.

## Import a custom codec

Override a printer node and register the package import with `this.import`. For example, use your package's `myCodec.uint64()` for `int64` fields:

```typescript [kubb.config.ts]
import { ast } from 'kubb/kit'
import { pluginZod } from '@kubb/plugin-zod'

pluginZod({
  printer: {
    nodes: {
      bigint() {
        this.import(ast.factory.createImport({
          name: ['myCodec'],
          path: 'my-codec/zod',
        }))
        return 'myCodec.uint64()'
      },
    },
  },
})
```

Generated files import `myCodec` from `my-codec/zod`. Leave `root` unset on this import to preserve the package specifier. Setting `root` rewrites it as a relative file path.

## Format and type mappings

`@kubb/plugin-zod` maps OpenAPI types and formats to Zod v4:

| OpenAPI type and format                                | Zod                                   | Zod Mini                              | Notes                                                                           |
| :----------------------------------------------------- | :------------------------------------ | :------------------------------------ | :------------------------------------------------------------------------------ |
| `integer`                                              | `z.int()`                             | `z.int()`                             | Coerces to `z.coerce.number().int()` when `coercion.numbers` is enabled         |
| `integer`, `format: int32`                             | `z.int32()`                           | `z.int32()`                           | 32-bit signed integer                                                           |
| `integer`, `format: uint32`                            | `z.uint32()`                          | `z.uint32()`                          | 32-bit unsigned integer                                                         |
| `integer`, `format: int64`                             | `z.bigint()`                          | `z.bigint()`                          | 64-bit integer                                                                  |
| `string`, `format: byte` / `base64`                    | `z.base64()`                          | `z.base64()`                          | Base64 string validation                                                        |
| `string`, `format: base64url`                          | `z.base64url()`                       | `z.base64url()`                       | URL-safe base64 string validation                                               |
| `string`, `contentEncoding: base64` / `base64url`      | `z.base64()` / `z.base64url()`        | `z.base64()` / `z.base64url()`        | Same checks as the formats. Other encodings stay `z.string()`                   |
| `string`, JSON `contentMediaType` with `contentSchema` | `z.string().refine(...)`              | `z.string().check(z.refine(...))`     | The string must parse as JSON that passes the content schema. It stays a string |
| `string`, `format: jwt`                                | `z.jwt()`                             | `z.jwt()`                             | JSON Web Token format                                                           |
| `string`, `format: ulid`                               | `z.ulid()`                            | `z.ulid()`                            | ULID format                                                                     |
| `string`, `format: iban`                               | `z.iban()`                            | `z.iban()`                            | International Bank Account Number                                               |
| `string`, `format: duration`                           | `z.iso.duration()`                    | `z.iso.duration()`                    | ISO 8601 duration format                                                        |
| `string`, `format: uuid`                               | `z.uuid()` (or `z.guid()`)            | `z.uuid()` (or `z.guid()`)            | Configured via `guidType`                                                       |
| `string`, `format: email`                              | `z.email()`                           | `z.email()`                           | Email format                                                                    |
| `string`, `format: uri` / `url`                        | `z.url()`                             | `z.url()`                             | URL format                                                                      |
| `string`, `format: ipv4` / `ipv6`                      | `z.ipv4()` / `z.ipv6()`               | `z.ipv4()` / `z.ipv6()`               | IP address format                                                               |
| `string`, `format: date`                               | `z.iso.date()`                        | `z.iso.date()`                        | ISO 8601 date                                                                   |
| `string`, `format: date-time`                          | `z.iso.datetime()`                    | `z.string()`                          | ISO 8601 date-time                                                              |
| `string`, `format: time`                               | `z.iso.time()`                        | `z.iso.time()`                        | ISO 8601 time                                                                   |
| `object`, `additionalProperties: <schema>`             | `z.record(z.string(), schema)`        | `z.record(z.string(), schema)`        | Dictionary with no fixed properties                                             |
| `object`, `additionalProperties: true`                 | `z.looseObject(shape)`                | `z.looseObject(shape)`                | Open/passthrough object allowing extra keys                                     |
| `object`, `propertyNames: <schema>`                    | `z.record(keySchema, schema)`         | `z.record(keySchema, schema)`         | Dynamic map with validated key schema (e.g. pattern, format)                    |
| `object`, `propertyNames: <enum>`                      | `z.partialRecord(enumSchema, schema)` | `z.partialRecord(enumSchema, schema)` | Enum keys may be missing                                                        |

These keywords print a `z.refine` check, in both APIs:

- `if`/`then`/`else`, `dependentRequired`, and `dependentSchemas` check the input before it is parsed, in `z.pipe(z.unknown().check(...), schema)`.
- `contains` with `minContains` and `maxContains` counts the matching items of an array.
- `propertyNames` on an object that also declares `properties` checks every key of the input. A dictionary keeps `z.record(keySchema, schema)`.

## Dictionaries, open objects, and key schemas

OpenAPI 3.1 `propertyNames` validates dictionary keys. Open key schemas use `z.record(keySchema, valueSchema)`, including regex, UUID, and length constraints. Closed keys, such as enums, literals, or unions of enums, use `z.partialRecord` so only present keys are validated. Keys may be missing, as in OpenAPI, and the inferred type is `Partial<Record<Keys, Value>>`.

`patternProperties` combines key regex patterns into an alternation and emits `z.record(z.string().regex(...), valueSchema)`. Zod Mini uses `z.string().check(z.regex(...))` for the key schema.

An `additionalProperties` schema without fixed properties produces a dictionary. With fixed properties, it produces `.catchall(valueSchema)` to preserve that declared shape. `additionalProperties: true` emits `z.looseObject(shape)` to allow undeclared keys.
