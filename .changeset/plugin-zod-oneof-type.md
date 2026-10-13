---
'@kubb/plugin-zod': minor
---

Add `oneOfType`. Set it to `'xor'` to print a `oneOf` without a discriminator as `z.xor([...])`, which passes only when exactly one member matches. Members keep their own `additionalProperties`. The default `'strict'` keeps today's output: `z.union([...])` with strict object members. `'xor'` needs Zod v4.2.0 or above.
