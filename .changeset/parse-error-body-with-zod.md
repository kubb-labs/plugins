---
"@kubb/plugin-fetch": minor
"@kubb/plugin-axios": minor
"@kubb/plugin-zod": minor
---

Validate the error body with zod on the non-throw path (kubb-labs/plugins#369).

When a call resolves with a non-2xx status and `throwOnError: false`, the generated client now parses the error body against a new error-only `<operation>ErrorSchema` (a union of the documented non-2xx statuses), so `result.error` has a known, validated shape instead of being surfaced raw.

- **plugin-zod**: emits `<operation>ErrorSchema` alongside the success-only `<operation>ResponseSchema` for every operation that documents an error response with a schema. The success path is unchanged.
- **plugin-fetch / plugin-axios**: the `parser: 'zod'` shorthand (and the object form's `response: 'zod'`) now also wires an `error` parser hook; the runtime runs it on the error body only when a non-2xx call does not throw. The default `throwOnError: true` path still throws a raw `ResponseError`.

This is a small behavioral change for existing `parser: 'zod'` users: error bodies on non-throw calls are now validated and can surface a `ZodError` when the server's error response does not match the spec.
