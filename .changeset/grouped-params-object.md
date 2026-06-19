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

Every client now takes one grouped `{ body, path, query, headers }` options object with camelCase parameter names, matching `@kubb/plugin-fetch`. This replaces the old per-argument signatures and the three options that produced them.

Removed `paramsType`, `pathParamsType`, and `paramsCasing` from `@kubb/plugin-client`, `@kubb/plugin-react-query`, `@kubb/plugin-vue-query`, `@kubb/plugin-swr`, and `@kubb/plugin-cypress`. Removed `paramsCasing` from `@kubb/plugin-ts`, `@kubb/plugin-zod`, `@kubb/plugin-faker`, and `@kubb/plugin-mcp`.

Generated functions, class methods, and SDK methods now always group parameters into a single object and always camelCase the parameter names. The HTTP request still sends the original spec names, Kubb writes the mapping for you. Drop the three options from your `kubb.config` and update call sites to pass the grouped object, for example `getPet({ path: { petId } })` and `useFindPetsByStatus({ params: { status } })`.
