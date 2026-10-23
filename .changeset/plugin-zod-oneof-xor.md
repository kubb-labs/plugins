---
'@kubb/plugin-zod': minor
---

Add the `oneOfType` option. Set it to `'xor'` to print a `oneOf` as `z.xor([...])`, which passes only when exactly one member matches. Members keep their own `additionalProperties`. The default `'union'` keeps the current output: `z.union([...])` with strict object members. A `oneOf` that prints as `z.discriminatedUnion(...)` is unchanged. `'xor'` needs Zod v4.2.0 or higher.
