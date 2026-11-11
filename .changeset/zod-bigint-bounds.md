---
'@kubb/plugin-zod': patch
---

An `int64` schema keeps its bounds in the `zod` output: `exclusiveMinimum: 0` prints `z.coerce.bigint().gt(0n)`, as `zod/mini` already did.
