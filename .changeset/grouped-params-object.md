---
"@kubb/plugin-ts": minor
"@kubb/plugin-client": minor
"@kubb/plugin-react-query": minor
"@kubb/plugin-vue-query": minor
"@kubb/plugin-swr": minor
"@kubb/plugin-cypress": minor
"@kubb/plugin-zod": minor
"@kubb/plugin-faker": minor
"@kubb/plugin-mcp": minor
---

Every client now takes one grouped `{ path, query, body, headers }` options object with camelCase parameter names, matching `@kubb/plugin-fetch`. This replaces the old per-argument signatures, the `params`/`data` keys, and the three options that produced them.

Removed `paramsType`, `pathParamsType`, and `paramsCasing` from `@kubb/plugin-client`, `@kubb/plugin-react-query`, `@kubb/plugin-vue-query`, `@kubb/plugin-swr`, and `@kubb/plugin-cypress`. Removed `paramsCasing` from `@kubb/plugin-ts`, `@kubb/plugin-zod`, `@kubb/plugin-faker`, and `@kubb/plugin-mcp`.

Generated functions, class methods, SDK methods, and query hooks now take the grouped object typed from the operation's `RequestConfig` (`Omit<XxxRequestConfig, 'url'>`), and always camelCase the parameter names. The HTTP request still sends the original spec names, Kubb writes the mapping for you. The `path` group is required when an operation has required path parameters.

The axios and fetch runtimes shipped by `@kubb/plugin-client` rename their `RequestConfig` fields `params` to `query` and `data` to `body` (mapped to axios's native fields internally). Update any custom client or low-level `client({ ... })` call accordingly.

Update call sites to the grouped object, for example `getPet({ path: { petId } })`, `addPet({ body })`, and `useFindPetsByStatus({ query: { status } })`.
