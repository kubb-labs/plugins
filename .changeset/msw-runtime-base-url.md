---
'@kubb/plugin-msw': minor
---

Let generated handlers resolve their base URL at runtime.

- `baseURL` also accepts `{ importPath, name }`: each handler file imports `name` from `importPath` and calls it when the handler is created, so the base URL can come from your API client's config instead of being fixed at generation time. If the function returns `undefined` or an empty string, the handler safely falls back to matching relative paths.
- Every handler takes an optional second argument, `{ baseURL }`, which wins over the configured one: `listPetsHandler(data, { baseURL: 'https://pets.example.com' })` or `listPetsHandler(undefined, { baseURL: 'https://pets.example.com' })` to keep default mock data. Two services that expose the same path can then be mocked side by side.
- Static `baseURL` strings are emitted as clean string literals without unnecessary nested template literals, while dynamic template expressions (such as `${...}`) continue to evaluate at runtime.
- Handlers built with `parser: 'faker'` now write the URL as a template literal like the others, so a template expression in `baseURL` works with both parsers.
- Base URLs should omit trailing slashes because OpenAPI operation paths always start with a leading slash.
