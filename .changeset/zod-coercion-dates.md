---
"@kubb/plugin-zod": minor
---

Make `coercion.dates` effective for `Date`-typed fields. With `dateType: 'date'` on the adapter, a date field now validates with `z.coerce.date()` instead of the `z.iso.datetime().transform(...)` decode codec when `coercion: true` or `coercion: { dates: true }` is set. The request-direction `InputSchema` variant keeps encoding `Date` back to a wire string. Fields kept as ISO strings (`z.iso.date()`, `z.iso.datetime()`) are never coerced.
