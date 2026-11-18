---
'@kubb/plugin-zod': patch
---

Check the range of 64-bit integer formats. A `format: int64` or `uint64` field now prints `z.coerce.bigint()` with `.min()` and `.max()` for the format's range, so a value such as `9223372036854775808` no longer passes as an `int64`. With `coercion` on, `format: int32` and `uint32` fields keep their range too, which the coerced call used to drop. A tighter `minimum` or `maximum` from your spec still wins.
