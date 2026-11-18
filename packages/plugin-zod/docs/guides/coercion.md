# Coerce input with Zod

Set `coercion` to convert form data and query strings with `z.coerce` before Zod validates them, and see which format checks each key turns off.

## Turn on coercion

Pass `true` to coerce strings, numbers, and dates, or an object to pick the primitives. See [Coercion for primitives](https://zod.dev/?id=coercion-for-primitives) in the Zod docs.

::code-group

```typescript [kubb.config.ts]
import { pluginZod } from '@kubb/plugin-zod'

pluginZod({ coercion: { numbers: true } })
```

```typescript [Before]
limit: z.int().optional(),
```

```typescript [After]
limit: z.coerce.number().int().optional(),
```

::

| Value                            | Effect                                                                                                                                                                                   |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `false` (default)                | No coercion, except `format: int64` fields, which use `z.coerce.bigint().pipe(z.int64())` because JSON holds a number. With the adapter's `integerType: 'number'`, they print `z.int()`. |
| `true`                           | Coerces strings, numbers, and dates with `z.coerce.string()`, `z.coerce.number()`, and `z.coerce.date()`.                                                                                |
| `{ dates?, strings?, numbers? }` | Coerces only the primitives you pick.                                                                                                                                                    |

## Coerce strings

`strings` prints string fields as `z.coerce.string()`.

- It replaces the `base64`, `base64url`, `jwt`, `ulid`, `iban`, `duration`, and `hostname` validators, so Zod no longer checks those formats.
- `email`, `uri`, `uuid`, `ipv4`, and `ipv6` keep their validator and are not coerced.

## Coerce numbers

`numbers` coerces number and integer fields, and enums with a numeric `format` such as `int32`.

- Integers typed as `number` print as `z.coerce.number().int()`, or `z.coerce.number().check(z.int())` with Zod Mini. A `format: int32` or `uint32` field adds `.min()` and `.max()` for the format's range.
- `format: int64` fields typed as `bigint`, the adapter default, keep `z.coerce.bigint().pipe(z.int64())`, which converts and then checks the 64-bit range.
- When a coerced enum is the discriminator of a `oneOf`, the union prints as `z.union`, because `z.discriminatedUnion` cannot read coerced values.
- Other enums are not coerced.

## Coerce dates

`dates` coerces only fields typed as `Date`, which needs `dateType: 'date'` on the adapter.

- Fields kept as ISO strings are never coerced.
- `format: time` fields are never coerced, because `new Date()` cannot parse a bare `HH:mm:ss`. For a time-of-day type such as `Temporal.PlainTime`, see [Encode custom types](https://kubb.dev/extensions/kubb-labs/plugin-zod/guides/customization#encode-custom-types).

> [!NOTE]
> Coerced fields run on Zod's interpreter when you turn on `compile`. See [Compile Zod schemas](https://kubb.dev/extensions/kubb-labs/plugin-zod/guides/compiled-schemas#coerced-and-int64-fields).
