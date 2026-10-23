---
'@kubb/plugin-msw': minor
---

Handlers take an optional `{ baseURL }` second argument that overrides the configured `baseURL`. With `handlers: true`, `handlers.ts` also exports `createHandlers({ baseURL })`:

```ts
setupServer(...createHandlers({ baseURL: getBaseURL() }))
```

A `${...}` expression in `baseURL` now also works with `parser: 'faker'`.
