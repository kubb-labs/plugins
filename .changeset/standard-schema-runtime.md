---
"@kubb/plugin-fetch": minor
---

Generated parser expressions now call `validateStandardSchema(Schema, data)` instead of `.parse(data)`.

A `validateStandardSchema` helper is injected into `.kubb/standard-schema.ts` alongside the client. It handles both sync and async `validate()` results and throws `ParseError({ issues })` on failure. Callers get a consistent `{ issues }` array instead of a raw `ZodError`. Any schema that exposes `~standard.validate` works: zod, valibot, arktype.

Error-body validation now runs on the throwing path too. `parser.error` executes before `ResponseError` is constructed, so `error.data` always holds the validated body regardless of the `throwOnError` setting.
