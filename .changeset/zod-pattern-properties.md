---
"@kubb/plugin-zod": minor
---

Add `patternProperties` support to the Zod and Zod Mini printers.

- Without fixed `properties`, an object emits `z.record(z.string().regex(<pattern>), <value>)` (`z.record(z.string().check(z.regex(...)), ...)` in mini), so the generated schema validates both the key pattern and the value. Multiple patterns combine into one alternation key regex with a union value.
- With fixed `properties`, the object falls back to `.catchall(<value>)` (`z.catchall(...)` in mini), because a regex-constrained `z.record` inside an intersection rejects the fixed keys at runtime.
- `additionalProperties: false` combined with `patternProperties` now keeps the pattern record instead of emitting `.strict()`, which would have rejected the pattern-matched keys.
- `additionalProperties` still takes precedence when both are present.

The Zod Mini printer also now honors `additionalProperties` itself: a schema maps to `z.catchall(...)`, `true` to `z.catchall(object, z.unknown())`, and `false` to `z.strictObject(...)`.
