---
"@kubb/plugin-swr": patch
---

Align `@kubb/plugin-swr` with the React Query / Vue Query plugins:

- Make enabled-guarded params optional in the generated `queryKey`, `queryOptions`, and hook signatures, asserting non-null at the client call. Because SWR has no `enabled` option, the param-presence check is folded into the null-key gate (`useSWR(shouldFetch && !!(petId) ? queryKey : null, ...)`), so passing `undefined` disables the request.
- Import the generated client as `client` (matching the current `@kubb/plugin-client` output) instead of `fetch`, and bundle it as `.kubb/client.ts`.
- Default the `client` `parser` option to `false` instead of the removed `'client'` value.
