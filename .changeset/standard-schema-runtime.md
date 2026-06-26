---
"@kubb/plugin-fetch": minor
---

Route parser hooks through the Standard Schema `~standard.validate` interface instead of calling `.parse(data)` directly.

Generated parser expressions now call `validateStandardSchema(Schema, data)` — a helper injected into `.kubb/standard-schema.ts` alongside the client. The helper normalizes sync and async `validate()` results and throws `ParseError({ issues })` on failure, so callers see a uniform `{ issues }` array rather than a raw `ZodError`. Because the contract is structural (any schema with `~standard.validate` qualifies), valibot and arktype schemas work without additional configuration.

Error-body validation now also runs on the throwing path: `parser.error` executes before `ResponseError` is constructed, so the validated error body is always available in `error.data` regardless of the `throwOnError` setting.
