---
'@kubb/plugin-mcp': patch
'@kubb/plugin-msw': patch
'@kubb/plugin-zod': patch
'@kubb/plugin-faker': patch
'@kubb/plugin-ts': patch
'@kubb/plugin-cypress': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
'@kubb/plugin-react-query': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-swr': patch
'@kubb/plugin-client': patch
---

Fail with a clear error on a missing required plugin or an invalid option value, instead of silently generating different output.

- Require `@kubb/plugin-zod` in `@kubb/plugin-mcp`, and `@kubb/plugin-faker` in `@kubb/plugin-msw` when `parser: 'faker'` is set.
- Require `@kubb/plugin-ts` in cypress, faker, mcp, msw, react-query, swr, and vue-query. A config without it now fails at setup instead of generating nothing.
- Reject unknown `enum.type`, `syntaxType`, `arrayType`, and `optionalType` values in `@kubb/plugin-ts`, and an unknown `client` in react-query, vue-query, swr, and mcp.
- Apply `coercion` in `@kubb/plugin-zod` when `mini: true` is set.
- Keep an object factory's signature and body together in `@kubb/plugin-faker` output.
- Correct the `baseURL` docs in msw, cypress, fetch, and axios, which claimed a fallback to the adapter's server URL that no plugin implements.
