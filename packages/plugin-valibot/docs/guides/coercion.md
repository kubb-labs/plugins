# Coerce input with Valibot

Set `coercion` to convert form data and query strings before Valibot validates them, and see which checks each key changes.

## Turn on coercion

Pass `true` to coerce strings, numbers, and dates, or an object to pick the primitives. A coerced schema starts from `v.unknown()` and converts with a `to*` action. See [toNumber](https://valibot.dev/api/toNumber/) in the Valibot docs.

::code-group

```typescript [kubb.config.ts]
import { pluginValibot } from '@kubb/plugin-valibot'

pluginValibot({ coercion: { numbers: true } })
```

```typescript [Before]
limit: v.optional(v.pipe(v.number(), v.integer())),
```

```typescript [After]
limit: v.optional(v.pipe(v.unknown(), v.toNumber(), v.integer())),
```

::

| Value                            | Effect                                                                                                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `false` (default)                | No coercion, except `format: int64` fields, which use `v.toBigint()` because JSON holds a number or a string. With the adapter's `integerType: 'number'`, they print `v.pipe(v.number(), v.integer())`. |
| `true`                           | Coerces strings, numbers, and dates with `v.toString()`, `v.toNumber()`, and `v.toDate()`.                                                                                                              |
| `{ dates?, strings?, numbers? }` | Coerces only the primitives you pick.                                                                                                                                                                   |

## Coerce strings

`strings` prints a plain `string` field as `v.pipe(v.unknown(), v.toString())`.

- Length and `pattern` checks stay, and run on the converted string.
- `email`, `url`, `uuid`, `ipv4`, and `ipv6` fields keep `v.string()` and are not coerced.

## Coerce numbers

`numbers` prints number and integer fields as `v.pipe(v.unknown(), v.toNumber())`.

- Integers keep `v.integer()`, and `format: int32` and `uint32` keep the `v.minValue()` and `v.maxValue()` of the format's range.
- `format: int64` fields typed as `bigint`, the adapter default, keep `v.toBigint()` with or without this option.

## Coerce dates

`dates` coerces only response fields typed as `Date`, which needs `dateType: 'date'` on the adapter.

- Fields kept as ISO strings are never coerced.
- A request schema writes a `Date` back to a string, so it is not coerced either.
