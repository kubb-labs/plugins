---
'@kubb/plugin-msw': minor
---

Let generated handlers resolve their base URL at runtime.

- Every handler takes an optional second argument, `{ baseURL }`, which overrides the configured `baseURL`: `listPetsHandler(undefined, { baseURL: 'https://pets.example.com' })`. Two services that share a path can now be mocked side by side.
- With `handlers: true`, `handlers.ts` also exports `createHandlers({ baseURL })`, so you can pass a runtime base URL to every handler: `setupServer(...createHandlers({ baseURL: getBaseURL() }))`.
- Handlers built with `parser: 'faker'` now write the URL as a template literal, so a `${...}` expression in `baseURL` works with both parsers.
