# Valibot schemas for OpenAPI formats

Look up the Valibot call Kubb writes for each OpenAPI type and format, such as `v.uuid()` for `format: uuid`, and the keywords the plugin does not check.

`@kubb/plugin-valibot` reads the `type` and `format` of each schema and prints the matching Valibot call. Constraints such as `minLength` and `maximum` go into the same `v.pipe(...)`.

## Numbers

| OpenAPI type and format                | Valibot                                                               | Notes                                                           |
| :------------------------------------- | :-------------------------------------------------------------------- | :-------------------------------------------------------------- |
| `number`                               | `v.number()`                                                          |                                                                 |
| `integer`                              | `v.pipe(v.number(), v.integer())`                                     | Also for `format: int32`                                        |
| `integer`, `format: int64`             | `v.pipe(v.union([v.bigint(), v.number(), v.string()]), v.toBigint())` | Converts, because JSON holds a number or a string               |
| `string`, `format: int32` / `int64`    | `v.pipe(v.string(), v.regex(/^-?\d+$/))`                              | An integer sent as a JSON string. A `pattern` in the spec wins. |
| `minimum`, `maximum`                   | `v.minValue(n)`, `v.maxValue(n)`                                      |                                                                 |
| `exclusiveMinimum`, `exclusiveMaximum` | `v.gtValue(n)`, `v.ltValue(n)`                                        |                                                                 |
| `multipleOf`                           | `v.multipleOf(n)`                                                     |                                                                 |

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

| OpenAPI type and format       | Valibot                                | Notes                                                 |
| :---------------------------- | :------------------------------------- | :---------------------------------------------------- |
| `string`, `format: date`      | `v.pipe(v.string(), v.isoDate())`      | ISO 8601 date                                         |
| `string`, `format: date-time` | `v.pipe(v.string(), v.isoTimestamp())` | Needs a `Z` or an offset                              |
| `string`, `format: time`      | `v.string()`                           | Not checked. Valibot's time actions reject an offset. |

These rows apply to the adapter's default `dateType: 'string'`.

- With `dateType: 'date'`, a date, date-time, or time prints `v.date()`. The schema then expects a `Date` and does not convert the JSON string. To convert, replace the handler with [`printer`](https://kubb.dev/extensions/kubb-labs/plugin-valibot/options#printer).
- With `dateType: 'stringLocal'`, a date-time prints `v.string()`, because Valibot has no check for a date-time without an offset.

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

## Keywords the plugin does not check

Valibot has no direct call for these, so the generated schema accepts any value for them:

- `if`/`then`/`else`, `dependentRequired`, and `dependentSchemas`
- `minProperties` and `maxProperties`
- `propertyNames` on an object that also declares `properties`
- `contains`, `minContains`, and `maxContains`
- `contentSchema` on a string that holds JSON
- The key patterns of `patternProperties` on an object that also declares `properties`. The values are checked.
- `propertyNames` next to `patternProperties`
- `readOnly` on a request body that is a circular schema. The body schema keeps those keys.

The plugin also does not write `description` or `examples` into the schemas.

To add a check for one type, replace its handler with [`printer`](https://kubb.dev/extensions/kubb-labs/plugin-valibot/options#printer).
