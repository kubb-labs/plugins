---
'@kubb/plugin-msw': minor
---

Let generated handlers resolve their base URL at runtime.

- When `handlers: true` is configured, `handlers.ts` now exports a `createHandlers(options?: { baseURL?: string })` factory function alongside the default `handlers` collection, allowing you to supply a runtime `baseURL` (e.g. from your API client's config) when setting up MSW.
- Every handler takes an optional second argument, `{ baseURL }`, which overrides the configured one: `listPetsHandler(data, { baseURL: 'https://pets.example.com' })` or `listPetsHandler(undefined, { baseURL: 'https://pets.example.com' })` to keep default mock data. Two services that expose the same path can then be mocked side by side.
- Static `baseURL` strings are emitted as clean string literals, while dynamic template expressions (such as `${...}`) continue to evaluate at runtime.
- Handlers built with `parser: 'faker'` now write the URL as a template literal like the others, so a template expression in `baseURL` works with both parsers.
- Base URLs should omit trailing slashes because OpenAPI operation paths always start with a leading slash.
