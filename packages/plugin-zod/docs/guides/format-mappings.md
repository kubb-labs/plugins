# Zod validators for OpenAPI formats

Look up the Zod v4 call Kubb writes for each OpenAPI type and format, such as `z.uuid()` for `format: uuid`, and the keywords that add a `z.refine` check.

`@kubb/plugin-zod` reads the `type` and `format` of each schema and prints the matching Zod call. The Zod Mini column shows the output with [`mini: true`](https://kubb.dev/extensions/kubb-labs/plugin-zod/options#mini).

## Integers

| OpenAPI type and format                                  | Zod                                 | Zod Mini                                    | Notes                                                                                                              |
| :------------------------------------------------------- | :---------------------------------- | :------------------------------------------ | :----------------------------------------------------------------------------------------------------------------- |
| `integer`                                                | `z.int()`                           | `z.int()`                                   | Coerced with [`coercion.numbers`](https://kubb.dev/extensions/kubb-labs/plugin-zod/guides/coercion#coerce-numbers) |
| `integer`, `format: int32`                               | `z.int32()`                         | `z.int32()`                                 | 32-bit signed integer                                                                                              |
| `integer`, `format: uint32`                              | `z.uint32()`                        | `z.uint32()`                                | 32-bit unsigned integer                                                                                            |
| `integer`, `format: int8` / `int16` / `uint8` / `uint16` | `z.int().min(…).max(…)`             | `z.int().check(z.minimum(…), z.maximum(…))` | Zod has no schema for these, so the range prints as bounds                                                         |
| `integer`, `format: int64` / `uint64`                    | `z.coerce.bigint().pipe(z.int64())` | `z.pipe(z.coerce.bigint(), z.int64())`      | Converts first, because JSON holds a number, then `z.int64()` or `z.uint64()` checks the range.                    |
| `string`, `format: int32` / `int64`                      | `z.string().regex(/^-?\d+$/)`       | `z.string().check(z.regex(/^-?\d+$/))`      | An integer sent as a JSON string. `uint64` uses `/^\d+$/`. A `pattern` in the spec wins.                           |

With [`integerType: 'number'`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#integertype) on the adapter, `format: int64` prints `z.int()`.

## Strings

| OpenAPI type and format                                | Zod                            | Zod Mini                          | Notes                                                                                  |
| :----------------------------------------------------- | :----------------------------- | :-------------------------------- | :------------------------------------------------------------------------------------- |
| `string`, `format: uuid`                               | `z.uuid()` or `z.guid()`       | `z.uuid()` or `z.guid()`          | Set by [`guidType`](https://kubb.dev/extensions/kubb-labs/plugin-zod/options#guidtype) |
| `string`, `format: email`                              | `z.email()`                    | `z.email()`                       | Email                                                                                  |
| `string`, `format: uri` / `url`                        | `z.url()`                      | `z.url()`                         | URL                                                                                    |
| `string`, `format: hostname`                           | `z.hostname()`                 | `z.hostname()`                    | Host name                                                                              |
| `string`, `format: ipv4` / `ipv6`                      | `z.ipv4()` / `z.ipv6()`        | `z.ipv4()` / `z.ipv6()`           | IP address                                                                             |
| `string`, `format: base64`                             | `z.base64()`                   | `z.base64()`                      | Base64 string                                                                          |
| `string`, `format: base64url`                          | `z.base64url()`                | `z.base64url()`                   | URL-safe base64 string                                                                 |
| `string`, `contentEncoding: base64` / `base64url`      | `z.base64()` / `z.base64url()` | `z.base64()` / `z.base64url()`    | Other encodings stay `z.string()`                                                      |
| `string`, `format: byte` / `binary`                    | `z.instanceof(Blob)`           | `z.instanceof(Blob)`              | Binary payload                                                                         |
| `string`, `format: jwt`                                | `z.jwt()`                      | `z.jwt()`                         | JSON Web Token                                                                         |
| `string`, `format: ulid`                               | `z.ulid()`                     | `z.ulid()`                        | ULID                                                                                   |
| `string`, `format: iban`                               | `z.iban()`                     | `z.iban()`                        | International Bank Account Number                                                      |
| `string`, `format: duration`                           | `z.iso.duration()`             | `z.iso.duration()`                | ISO 8601 duration                                                                      |
| `string`, JSON `contentMediaType` with `contentSchema` | `z.string().refine(...)`       | `z.string().check(z.refine(...))` | Must parse as JSON that passes the content schema. It stays a string.                  |

[`coercion.strings`](https://kubb.dev/extensions/kubb-labs/plugin-zod/guides/coercion#coerce-strings) replaces some of these validators with `z.coerce.string()`.

## Dates and times

| OpenAPI type and format       | Zod                | Zod Mini           | Notes              |
| :---------------------------- | :----------------- | :----------------- | :----------------- |
| `string`, `format: date`      | `z.iso.date()`     | `z.iso.date()`     | ISO 8601 date      |
| `string`, `format: date-time` | `z.iso.datetime()` | `z.iso.datetime()` | ISO 8601 date-time |
| `string`, `format: time`      | `z.iso.time()`     | `z.iso.time()`     | ISO 8601 time      |

These rows apply to the adapter's default `dateType: 'string'`.

## Objects

| OpenAPI type and format                    | Zod                            | Zod Mini                       | Notes                               |
| :----------------------------------------- | :----------------------------- | :----------------------------- | :---------------------------------- |
| `object`, `additionalProperties: <schema>` | `z.record(z.string(), schema)` | `z.record(z.string(), schema)` | Dictionary with no fixed properties |
| `object`, `additionalProperties: true`     | `z.looseObject(shape)`         | `z.looseObject(shape)`         | Allows extra keys                   |
| `object`, `additionalProperties: false`    | `z.strictObject(shape)`        | `z.strictObject(shape)`        | Rejects extra keys                  |

## JSON Schema keywords

These keywords print a `z.refine` check in both APIs:

| Keyword                                                      | Check                                                                            |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `if`/`then`/`else`, `dependentRequired`, `dependentSchemas`  | Checks the input before parsing, in `z.pipe(z.unknown().check(...), schema)`.    |
| `minProperties`, `maxProperties`                             | Counts the keys of the input before parsing, in the same `z.pipe(...)`.          |
| `propertyNames` on an object that also declares `properties` | Checks every key of the input. A dictionary keeps `z.record(keySchema, schema)`. |
| `contains` with `minContains` and `maxContains`              | Counts the matching items of an array.                                           |
| `uniqueItems`                                                | Rejects an array with duplicate entries.                                         |

To change the call for one type, replace its printer handler. See [Customize generated schemas](https://kubb.dev/extensions/kubb-labs/plugin-zod/guides/customization).
