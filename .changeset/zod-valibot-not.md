---
'@kubb/plugin-zod': minor
'@kubb/plugin-valibot': minor
---

Validate the `not` keyword. A schema with `not` was printed without it, so the validator accepted values the document forbids.

- `@kubb/plugin-zod` adds a `refine` that fails when the value matches the `not` schema. `zod/mini` gets the same check through `z.refine`.
- `@kubb/plugin-valibot` adds a `v.check` that fails when the value matches the `not` schema.
- `@kubb/plugin-zod` with `mini: true` prints `z.iso.datetime()` for a `date-time` string, with the `offset` and `local` flags, like the standard printer. It printed `z.string()`.
- A `pattern` that JavaScript cannot compile reports a `KUBB_INVALID_SPEC` diagnostic that names the pattern. It was a bare `SyntaxError`.
