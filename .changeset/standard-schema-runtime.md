---
"@kubb/plugin-fetch": minor
"@kubb/plugin-axios": minor
---

Generated clients now pass the schema straight to the `parser` slot instead of wrapping it in a `.parse(data)` call. The `client.ts` runtime runs it through `validateStandardSchema`, so the helper stays in one place and never leaks into each operation file.

A `validateStandardSchema` helper is injected into `.kubb/standardSchema.ts` alongside the client. It handles both sync and async `validate()` results and throws `ParseError({ issues })` on failure. Callers get a consistent `{ issues }` array instead of a raw `ZodError`. Any schema that exposes `~standard.validate` works: zod, valibot, arktype.

Error-body validation now runs on the throwing path too. `parser.error` executes before `ResponseError` is constructed, so `error.data` always holds the validated body regardless of the `throwOnError` setting.
