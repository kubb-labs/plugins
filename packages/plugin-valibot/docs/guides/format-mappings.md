# Valibot schemas for OpenAPI formats

Look up the Valibot call Kubb writes for each OpenAPI type and format, such as `v.uuid()` for `format: uuid`, and the keywords that add a `v.check`.

`@kubb/plugin-valibot` reads the `type` and `format` of each schema and prints the matching Valibot call. Constraints such as `minLength` and `maximum` go into the same `v.pipe(...)`.

## Numbers

| OpenAPI type and format                | Valibot                                                                                                                 | Notes                                                                                     |
| :------------------------------------- | :---------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------- |
| `number`                               | `v.number()`                                                                                                            |                                                                                           |
| `integer`                              | `v.pipe(v.number(), v.integer())`                                                                                       | `format: int32` and `uint32` add `v.minValue()` and `v.maxValue()` for the format's range |
| `integer`, `format: int64` / `uint64`  | `v.pipe(v.union([v.bigint(), v.number(), v.string()]), v.toBigint(), v.minValue(BigInt('…')), v.maxValue(BigInt('…')))` | Converts, because JSON holds a number or a string, then checks the format's range         |
| `string`, `format: int32` / `int64`    | `v.pipe(v.string(), v.regex(/^-?\d+$/))`                                                                                | An integer sent as a JSON string. A `pattern` in the spec wins.                           |
| `minimum`, `maximum`                   | `v.minValue(n)`, `v.maxValue(n)`                                                                                        |                                                                                           |
| `exclusiveMinimum`, `exclusiveMaximum` | `v.gtValue(n)`, `v.ltValue(n)`                                                                                          |                                                                                           |
| `multipleOf`                           | `v.multipleOf(n)`                                                                                                       |                                                                                           |

With [`integerType: 'number'`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#integertype) on the adapter, `format: int64` prints `v.pipe(v.number(), v.integer())`.

## Strings

| OpenAPI type and format             | Valibot                                            | Notes                                                                                         |
| :---------------------------------- | :------------------------------------------------- | :-------------------------------------------------------------------------------------------- |
| `string`                            | `v.string()`                                       |                                                                                               |
| `string`, `format: uuid`            | `v.pipe(v.string(), v.uuid())`                     |                                                                                               |
| `string`, `format: email`           | `v.pipe(v.string(), v.email())`                    |                                                                                               |
| `string`, `format: uri`             | `v.pipe(v.string(), v.url())`                      |                                                                                               |
| `string`, `format: ipv4` / `ipv6`   | `v.pipe(v.string(), v.ipv4())`                     | `v.ipv6()` for `ipv6`                                                                         |
| `string`, `format: byte`            | `v.pipe(v.string(), v.base64())`                   | Also for `contentEncoding: base64`                                                            |
| `string`, `format: ulid`            | `v.pipe(v.string(), v.ulid())`                     |                                                                                               |
| `string`, `format: binary`          | `v.blob()`                                         |                                                                                               |
| `minLength`, `maxLength`, `pattern` | `v.minLength(n)`, `v.maxLength(n)`, `v.regex(...)` | See [`regexType`](https://kubb.dev/extensions/kubb-labs/plugin-valibot/options#regextype)     |
| `enum`                              | `v.picklist([...])`                                | A single value prints `v.literal(...)`. A boolean or mixed set prints a `v.union` of literals |

Any other string format prints `v.string()`.

## Dates and times

| OpenAPI type and format       | Valibot                                | Notes                                                          |
| :---------------------------- | :------------------------------------- | :------------------------------------------------------------- |
| `string`, `format: date`      | `v.pipe(v.string(), v.isoDate())`      | ISO 8601 date                                                  |
| `string`, `format: date-time` | `v.pipe(v.string(), v.isoTimestamp())` | Needs a `Z` or an offset                                       |
| `string`, `format: time`      | `v.string()`                           | Not checked. Valibot's time actions reject fractional seconds. |

These rows apply to the adapter's default `dateType: 'string'`. With `dateType: 'stringLocal'`, a date-time prints `v.string()`, because Valibot has no check for a date-time without an offset.

### Date fields

With `dateType: 'date'`, a date, date-time, or time is a `Date` in your code and a string on the wire. A response schema converts the string to a `Date`, and a request schema converts it back:

| OpenAPI type and format       | Response schema                                                            | Request schema                                                               |
| :---------------------------- | :------------------------------------------------------------------------- | :--------------------------------------------------------------------------- |
| `string`, `format: date`      | `v.pipe(v.string(), v.isoDate(), v.transform((value) => new Date(value)))` | `v.pipe(v.date(), v.transform((value) => value.toISOString().slice(0, 10)))` |
| `string`, `format: date-time` | `v.pipe(v.string(), v.isoTimestamp(), v.transform(...))`                   | `v.pipe(v.date(), v.transform((value) => value.toISOString()))`              |
| `string`, `format: time`      | Parses onto `1970-01-01`, as UTC when the value has no offset              | Writes `HH:mm:ssZ`, with milliseconds when the value has them                |

A component schema with such a field is generated twice: `petSchema` for responses and `petInputSchema` for requests. With [`coercion`](https://kubb.dev/extensions/kubb-labs/plugin-valibot/options#coercion) for dates, the response schema prints `v.pipe(v.unknown(), v.toDate())`.

## Objects, arrays, and unions

| OpenAPI                                    | Valibot                              | Notes                                                                                                      |
| :----------------------------------------- | :----------------------------------- | :--------------------------------------------------------------------------------------------------------- |
| `object`                                   | `v.object(entries)`                  | Drops unknown keys from the output                                                                         |
| `object`, `additionalProperties: false`    | `v.strictObject(entries)`            | Rejects extra keys                                                                                         |
| `object`, `additionalProperties: true`     | `v.looseObject(entries)`             | Keeps extra keys                                                                                           |
| `object`, `additionalProperties: <schema>` | `v.record(v.string(), schema)`       | `v.objectWithRest(entries, schema)` next to `properties`                                                   |
| Optional property                          | `v.optional(schema)`                 | A `default` prints `v.optional(schema, value)`                                                             |
| `nullable: true`                           | `v.nullable(schema)`                 |                                                                                                            |
| `array`                                    | `v.array(schema)`                    | `uniqueItems` adds a `v.check(...)`                                                                        |
| `prefixItems`                              | `v.tuple([...])`                     | `v.tupleWithRest([...], schema)` with `items`                                                              |
| `anyOf`                                    | `v.union([...])`                     |                                                                                                            |
| `oneOf`                                    | `v.union([...])`                     | Plain object members are strict, so a value with another member's keys does not match them                 |
| `oneOf` with a `discriminator`             | `v.variant(key, [...])`              | `v.union` when a member is not a plain object                                                              |
| `allOf` of objects                         | `v.object({ ...base.entries, ... })` | Other members print `v.intersect([...])`, or extra actions in the pipe when a member only adds constraints |
| `$ref`                                     | The schema's const                   | `v.lazy(() => schema)` for a circular reference                                                            |

## JSON Schema keywords

These keywords print a `v.check`:

| Keyword                                                                    | Check                                                                            |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `if`/`then`/`else`, `dependentRequired`, `dependentSchemas`                | Checks the input before parsing, in `v.pipe(v.unknown(), v.check(...), schema)`. |
| `minProperties`, `maxProperties`                                           | Counts the keys of the input before parsing, in the same `v.pipe(...)`.          |
| `propertyNames` on an object that also declares `properties`               | Checks every key of the input. A dictionary keeps `v.record(keySchema, schema)`. |
| `patternProperties` next to `properties` and `additionalProperties: false` | Rejects a key that is not declared and matches no pattern.                       |
| `contains` with `minContains` and `maxContains`                            | Counts the matching items of an array.                                           |
| `contentSchema` on a string that holds JSON                                | Parses the string and checks the result.                                         |
| `uniqueItems`                                                              | Rejects an array with duplicate entries.                                         |

A request body that is a circular schema prints inline without its `readOnly` keys. In a circular `allOf`, a `$ref` member that declares such a key prints inline too.

A schema with a check on the input is a `v.pipe`, so it is no member of a `v.variant` and does not merge into an `allOf` object. A request body that drops `readOnly` keys from such a schema leaves the input checks out.

The plugin does not write `description` or `examples` into the schemas.

To change the call for one type, replace its handler with [`printer`](https://kubb.dev/extensions/kubb-labs/plugin-valibot/options#printer).
