---
"@kubb/plugin-swr": patch
---

Align `@kubb/plugin-swr` with the React Query / Vue Query plugins:

- Require the spec-required `path`, `query`, and `header` params in the generated `queryKey`, `queryOptions`, and hook signatures, and drop the path-presence gate. The hook now keys off `shouldFetch` alone (`useSWR(shouldFetch ? queryKey : null, ...)`); set `shouldFetch` to `false` to disable the request.
- Import the generated client as `client` (matching the current `@kubb/plugin-client` output) instead of `fetch`, and bundle it as `.kubb/client.ts`.
- Default the `client` `parser` option to `false` instead of the removed `'client'` value.
