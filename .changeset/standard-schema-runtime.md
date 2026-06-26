---
"@kubb/plugin-fetch": minor
"@kubb/plugin-axios": minor
"@kubb/plugin-react-query": minor
"@kubb/plugin-swr": minor
"@kubb/plugin-vue-query": minor
---

The `parser` option is renamed to `validator` across the client and query plugins. Set `validator: 'zod'` (or `{ request: 'zod', response: 'zod' }`) where you previously set `parser`. The accepted values are unchanged.

Generated clients pass the schema straight to the `validator` slot instead of wrapping it in a `.parse(data)` call. The slot takes a Standard Schema validator, and only `client.ts` calls `validateStandardSchema`, so the helper stays in one place instead of being imported into every operation file.

A `validateStandardSchema` helper is injected into `.kubb/standardSchema.ts` next to the client. It handles sync and async `validate()` results and throws `ParseError({ issues })` on failure, so callers get a consistent `{ issues }` array instead of a raw `ZodError`. Any schema that exposes `~standard.validate` works, including zod, valibot, and arktype.

Error-body validation now runs on the throwing path too. `validator.error` executes before `ResponseError` is constructed, so `error.data` always holds the validated body regardless of the `throwOnError` setting.
