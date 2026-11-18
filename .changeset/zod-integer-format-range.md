---
'@kubb/plugin-zod': patch
---

Check the range of 64-bit integer formats. A `format: int64` or `uint64` field now prints `z.coerce.bigint().pipe(z.int64())` or `.pipe(z.uint64())`, so a value such as `9223372036854775808` no longer passes as an `int64`. The schema is a `ZodPipe` instead of a `ZodBigInt`, so chain extra checks inside the pipe. With `coercion` on, `format: int32` and `uint32` fields keep their range too, which the coerced call used to drop.

A `minimum` or `maximum` on a bigint field now prints as `BigInt('…')` instead of a literal such as `1n`, so the generated code also compiles with a TypeScript `target` below ES2020.
