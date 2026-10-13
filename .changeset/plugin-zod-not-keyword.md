---
'@kubb/plugin-zod': minor
---

Validate the OpenAPI `not` keyword. A schema with `not` gets `.refine((value) => !<not schema>.safeParse(value).success)` (`.check(z.refine(...))` with `mini: true`), and schemas referenced only inside `not` are imported. An `allOf` member or base with `not` composes with `.and(...)` instead of `.extend(...)`, and `keysToOmit` omits keys before the refinement, because Zod rejects `.omit()` and key-overriding `.extend()` on refined objects. Needs `@kubb/adapter-oas` with `not` support.
