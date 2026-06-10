# @kubb/plugin-swr

## 5.0.0-beta.45

### Patch Changes

- [#328](https://github.com/kubb-labs/plugins/pull/328) [`47713fa`](https://github.com/kubb-labs/plugins/commit/47713fa4d933484fd4661782025e098be2300889) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Replace the stale v4 `barrelType: 'named'` key in every plugin's `output` destructuring default with the v5 `barrel: { type: 'named' }` object. Generated output is unchanged: `@kubb/middleware-barrel` never read the dead key and already fell back to `{ type: 'named' }`. The code now matches the documented default in each plugin's option docs.

  Docs metadata fixes in the same pass: `@kubb/plugin-zod` documents that `importPath` defaults to `'zod/mini'` when `mini` is enabled, and `@kubb/plugin-swr` documents the `parser` default as the boolean `false` instead of the string `'false'`.

- Updated dependencies [[`696e974`](https://github.com/kubb-labs/plugins/commit/696e974fecfc1efcb48f88a1f1c19da7e20bfbb5), [`47713fa`](https://github.com/kubb-labs/plugins/commit/47713fa4d933484fd4661782025e098be2300889), [`35a600d`](https://github.com/kubb-labs/plugins/commit/35a600d7516f11270afbda25ed89e5bb8a9c9603), [`fdd85ac`](https://github.com/kubb-labs/plugins/commit/fdd85acb9f6989dbf332eee204e4a8da238d0a74), [`84c6208`](https://github.com/kubb-labs/plugins/commit/84c62089eaeb00bd0411a4064ee21ad397ada994), [`4458b2f`](https://github.com/kubb-labs/plugins/commit/4458b2fe9f69860351f1ba8ca03ff83f37ff5f36), [`1de83e0`](https://github.com/kubb-labs/plugins/commit/1de83e076bf302b82a3ecbb8b63808016f01d268)]:
  - @kubb/plugin-client@5.0.0-beta.45
  - @kubb/plugin-ts@5.0.0-beta.45
  - @kubb/plugin-zod@5.0.0-beta.45

## 5.0.0-beta.44

### Patch Changes

- [#319](https://github.com/kubb-labs/plugins/pull/319) [`27fbf2f`](https://github.com/kubb-labs/plugins/commit/27fbf2f16bf4da0aba6e0966f521bb350c675681) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Import the renderer as `jsxRenderer` from `@kubb/renderer-jsx`. The `jsxRendererSync` and `jsxRenderer` exports were the same function behind two names, and the next `@kubb/renderer-jsx` major keeps only `jsxRenderer`. Generated output is unchanged.

- [#319](https://github.com/kubb-labs/plugins/pull/319) [`27fbf2f`](https://github.com/kubb-labs/plugins/commit/27fbf2f16bf4da0aba6e0966f521bb350c675681) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Share the query-options parameter builder across the TanStack plugins. The duplicated `getQueryOptionsParams` body now lives in `@internals/tanstack-query` as `buildQueryOptionsParams`, and each plugin delegates to it (vue-query keeps its `MaybeRefOrGetter` wrapping). No change to generated output.

- Updated dependencies [[`27fbf2f`](https://github.com/kubb-labs/plugins/commit/27fbf2f16bf4da0aba6e0966f521bb350c675681), [`92482b1`](https://github.com/kubb-labs/plugins/commit/92482b1ee0a0b70c2bc0293f5d3d8dbd5519af75), [`27fbf2f`](https://github.com/kubb-labs/plugins/commit/27fbf2f16bf4da0aba6e0966f521bb350c675681), [`92482b1`](https://github.com/kubb-labs/plugins/commit/92482b1ee0a0b70c2bc0293f5d3d8dbd5519af75), [`92482b1`](https://github.com/kubb-labs/plugins/commit/92482b1ee0a0b70c2bc0293f5d3d8dbd5519af75)]:
  - @kubb/plugin-client@5.0.0-beta.44
  - @kubb/plugin-ts@5.0.0-beta.44
  - @kubb/plugin-zod@5.0.0-beta.44

## 5.0.0-beta.42

### Patch Changes

- [#310](https://github.com/kubb-labs/plugins/pull/310) [`e2e83ad`](https://github.com/kubb-labs/plugins/commit/e2e83ada993bcc02f2a382862cf2fb3a930fc405) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Adopt native Node 22 features and drop the `remeda` dependency. The query and mutation generators now resolve their HTTP methods through a `Set` instead of `remeda`'s `difference`, `plugin-ts` sorts imports and exports with `Array.prototype.toSorted` and a local numeric guard, and `plugin-redoc` resolves its template path through `import.meta.dirname`. The shared TypeScript config moves to an ES2024 target with the ES2025 collection and iterator libraries.

- Updated dependencies [[`e2e83ad`](https://github.com/kubb-labs/plugins/commit/e2e83ada993bcc02f2a382862cf2fb3a930fc405), [`7075bff`](https://github.com/kubb-labs/plugins/commit/7075bffb7c06f6b04c8470c0761ef808615f45eb)]:
  - @kubb/plugin-ts@5.0.0-beta.42
  - @kubb/plugin-zod@5.0.0-beta.42
  - @kubb/plugin-client@5.0.0-beta.42

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
