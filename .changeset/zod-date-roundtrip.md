---
"@kubb/plugin-zod": minor
---

Round-trip `Date` fields at the Zod validation boundary when `@kubb/adapter-oas` uses `dateType: 'date'`.

Date fields are typed as `Date` by `@kubb/plugin-ts`, but the wire value is always an ISO `string`. Previously these emitted `z.date()` (or `z.coerce.date()`), which cannot validate a response string. Now:

- **Response schemas decode** the ISO `string` into a `Date` — `z.iso.datetime().transform((value) => new Date(value))` (or `z.iso.date().transform(...)` for `format: date`).
- **Request bodies encode** a `Date` back into the wire `string`. Each date-bearing component emits an `${name}InputSchema` variant — `z.date().transform((value) => value.toISOString())` (or `.slice(0, 10)` for `format: date`) — and request schemas (`<op>Data`) reference it.

Pairs with `@kubb/plugin-client` `parser: 'zod'` to parse both directions automatically. `coercion.dates` no longer affects `dateType: 'date'` fields. Applies to the standard (chainable) printer; `zod/mini` is unchanged.
