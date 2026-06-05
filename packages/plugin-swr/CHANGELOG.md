# @kubb/plugin-swr

## 5.0.0-beta.37

### Patch Changes

- [#310](https://github.com/kubb-labs/plugins/pull/310) [`e2e83ad`](https://github.com/kubb-labs/plugins/commit/e2e83ada993bcc02f2a382862cf2fb3a930fc405) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Adopt native Node 22 features and drop the `remeda` dependency. The query and mutation generators now resolve their HTTP methods through a `Set` instead of `remeda`'s `difference`, `plugin-ts` sorts imports and exports with `Array.prototype.toSorted` and a local numeric guard, and `plugin-redoc` resolves its template path through `import.meta.dirname`. The shared TypeScript config moves to an ES2024 target with the ES2025 collection and iterator libraries.

- Updated dependencies [[`e2e83ad`](https://github.com/kubb-labs/plugins/commit/e2e83ada993bcc02f2a382862cf2fb3a930fc405), [`7075bff`](https://github.com/kubb-labs/plugins/commit/7075bffb7c06f6b04c8470c0761ef808615f45eb)]:
  - @kubb/plugin-ts@5.0.0-beta.37
  - @kubb/plugin-zod@5.0.0-beta.37
  - @kubb/plugin-client@5.0.0-beta.37

## 5.0.0-beta.36

### Patch Changes

- Updated dependencies [[`9f9e0fa`](https://github.com/kubb-labs/plugins/commit/9f9e0fae5d361ad1fd1465af2f34b4876b89ad0b)]:
  - @kubb/plugin-ts@5.0.0-beta.36
  - @kubb/plugin-zod@5.0.0-beta.36
  - @kubb/plugin-client@5.0.0-beta.36

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
