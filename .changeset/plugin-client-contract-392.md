---
"@kubb/plugin-client": minor
"@kubb/plugin-react-query": minor
"@kubb/plugin-vue-query": minor
"@kubb/plugin-swr": minor
"@kubb/plugin-cypress": minor
"@kubb/plugin-mcp": minor
---

Migrate the client plugins to the shared `RequestResult` contract and remove `dataReturnType` (#392).

`@kubb/plugin-client` now generates operations that return `RequestResult` — `{ data, error, request, response }` — with `throwOnError` defaulting to `true`, the same contract `@kubb/plugin-fetch` and `@kubb/plugin-axios` already ship. The query plugins (react-query, vue-query, swr) take a single `client: 'fetch' | 'axios'` option: `'fetch'`/`'axios'` (or any registered contract client, including `@kubb/plugin-client`) route through the contract. `@kubb/plugin-mcp` and `@kubb/plugin-cypress` drop `dataReturnType` as well.

**Breaking. Migration:**

- `dataReturnType: 'data'` → destructure the result: `const { data } = await getPet(1)`. fetch users now get the throw-on-error contract axios users already had.
- `dataReturnType: 'full'` → pass `throwOnError: false` and read `error` / `response.status` off the result.
- Query plugins: the deprecated `client` object is removed. Use `client: 'fetch' | 'axios'` with the matching client plugin registered.
- `@kubb/plugin-cypress`: every helper now yields the response body (`Cypress.Chainable<T>`); the `'full'` `Cypress.Response` variant is gone.
- `@kubb/plugin-mcp`: handlers call the contract client and read `res.data`; form-data follows the contract runtime's serializer (the `buildFormData` helper is gone).
- `@kubb/plugin-client`: the `urlType` option and its `get<Operation>Url` URL helpers are removed, along with the `resolveUrlName` resolver method.
