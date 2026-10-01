---
'@kubb/plugin-msw': minor
---

Let generated handlers resolve their base URL at runtime.

- `baseURL` also accepts `{ importPath, name }`: each handler file imports `name` from `importPath` and calls it when the handler is created, so the base URL can come from your API client's config instead of being fixed at generation time.
- Every handler takes an optional second argument, `{ baseURL }`, which wins over the configured one: `listPetsHandler(data, { baseURL: 'https://pets.example.com' })`. Two services that expose the same path can then be mocked side by side.
- Handlers built with `parser: 'faker'` now write the URL as a template literal like the others, so a template expression in `baseURL` works with both parsers.
