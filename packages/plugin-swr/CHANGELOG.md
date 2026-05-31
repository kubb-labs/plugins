# @kubb/plugin-swr

## 5.0.0-beta.35

### Patch Changes

- [`0aa1ff1`](https://github.com/kubb-labs/plugins/commit/0aa1ff1b9e74790931889a4569d91e66e47fabb1) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - sync packages with Kubb core

- Updated dependencies [[`0aa1ff1`](https://github.com/kubb-labs/plugins/commit/0aa1ff1b9e74790931889a4569d91e66e47fabb1)]:
  - @kubb/plugin-client@5.0.0-beta.35
  - @kubb/plugin-zod@5.0.0-beta.35
  - @kubb/plugin-ts@5.0.0-beta.35

## 5.0.0-beta.33

### Patch Changes

- [#164](https://github.com/kubb-labs/plugins/pull/164) [`7cf78fe`](https://github.com/kubb-labs/plugins/commit/7cf78fea60cc058ee8b963c57c8c58e0e95cfb7b) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Align `@kubb/plugin-swr` with the React Query / Vue Query plugins:
  - Make enabled-guarded params optional in the generated `queryKey`, `queryOptions`, and hook signatures, asserting non-null at the client call. Because SWR has no `enabled` option, the param-presence check is folded into the null-key gate (`useSWR(shouldFetch && !!(petId) ? queryKey : null, ...)`), so passing `undefined` disables the request.
  - Import the generated client as `client` (matching the current `@kubb/plugin-client` output) instead of `fetch`, and bundle it as `.kubb/client.ts`.
  - Default the `client` `parser` option to `false` instead of the removed `'client'` value.

- Updated dependencies []:
  - @kubb/plugin-client@5.0.0-beta.33
  - @kubb/plugin-ts@5.0.0-beta.33
  - @kubb/plugin-zod@5.0.0-beta.33
