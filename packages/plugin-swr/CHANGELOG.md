# @kubb/plugin-swr

## 5.0.0-beta.57

### Major Changes

- [#408](https://github.com/kubb-labs/plugins/pull/408) [`d0dc716`](https://github.com/kubb-labs/plugins/commit/d0dc716d746cd7c64d9b75597ebe9312ba51051d) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Migrate the plugins to the reshaped `@kubb/ast` param and type model.

  A parameter type is now a plain `string`, so the `ast.createParamsType({ variant: 'reference', name })` wrapper is gone from every component. The query, header, and path grouping helpers (`resolveParamType`, `resolveGroupType`, `buildGroupParam`, `buildTypeLiteral`) are imported from `@kubb/ast` instead of being redefined in `internals/tanstack-query`. The `functionPrinter` keeps two modes, `declaration` and `call`; the `keys` and `values` modes are removed, and a destructured group renders from a single `FunctionParameter` whose name is an `ObjectBindingPattern` and whose type is a `TypeLiteral`. `@kubb/plugin-ts` now exports `renderType` for turning a type expression into source.

  Generated output is unchanged.

### Patch Changes

- [#413](https://github.com/kubb-labs/plugins/pull/413) [`0eabb97`](https://github.com/kubb-labs/plugins/commit/0eabb97b08188772b10a348c2144d51d0e4d6077) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Import `createOperationParams` from `@kubb/ast/utils` instead of `ast.factory`. The helper moved off the `@kubb/ast` factory namespace because it is a high-level builder, not a `ts.factory` primitive. Generated output is unchanged.

- Updated dependencies [[`0eabb97`](https://github.com/kubb-labs/plugins/commit/0eabb97b08188772b10a348c2144d51d0e4d6077), [`d0dc716`](https://github.com/kubb-labs/plugins/commit/d0dc716d746cd7c64d9b75597ebe9312ba51051d), [`451f3b7`](https://github.com/kubb-labs/plugins/commit/451f3b7a24eb95fb4881bee8de59839e81686386)]:
  - @kubb/plugin-client@5.0.0-beta.57
  - @kubb/plugin-ts@5.0.0-beta.57
  - @kubb/plugin-zod@5.0.0-beta.57

## 5.0.0-beta.56

### Major Changes

- [#374](https://github.com/kubb-labs/plugins/pull/374) [`501899f`](https://github.com/kubb-labs/plugins/commit/501899fc2445f3cbb302d4126142d45818b62986) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Adopt the explicit `output.mode` option from `@kubb/core`.

  Kubb no longer infers a single file from an `output.path` ending in `.ts`. Set `output.mode: 'file'` to write everything into one file, `output.mode: 'group'` to write one file per group (which requires the `group` option), or leave it as the default `output.mode: 'directory'` for one file per operation or schema. A config that used a file-style `output.path` (e.g. `path: 'models.ts'`) now needs `output.mode: 'file'` to keep that layout.

  Each plugin's `Options` type now uses the `OutputOptions` union, so `output.mode: 'group'` statically requires the `group` option. The generators no longer gate imports on `ctx.getMode`, since `@kubb/ast` strips self-imports for the consolidated modes.

### Patch Changes

- [#328](https://github.com/kubb-labs/plugins/pull/328) [`47713fa`](https://github.com/kubb-labs/plugins/commit/47713fa4d933484fd4661782025e098be2300889) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Replace the stale v4 `barrelType: 'named'` key in every plugin's `output` destructuring default with the v5 `barrel: { type: 'named' }` object. Generated output is unchanged: `@kubb/plugin-barrel` never read the dead key and already fell back to `{ type: 'named' }`. The code now matches the documented default in each plugin's option docs.

  Docs metadata fixes in the same pass: `@kubb/plugin-zod` documents that `importPath` defaults to `'zod/mini'` when `mini` is enabled, and `@kubb/plugin-swr` documents the `parser` default as the boolean `false` instead of the string `'false'`.

- [#362](https://github.com/kubb-labs/plugins/pull/362) [`efee68f`](https://github.com/kubb-labs/plugins/commit/efee68f7c6c750e6197f00714473a60746093d06) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Fix type mismatch when `parser: 'zod'` is used with request schemas that have transforms. The generated `request<>` call now uses `z.output<typeof schema>` for the request body generic instead of the TypeScript input type, so schemas with transforms (e.g. date coercion: `Date` → `string`) no longer raise `Type 'string' is not assignable to type 'Date'`. Generated files that inline a Zod request schema now include `import type { z } from 'zod'`.

- [#365](https://github.com/kubb-labs/plugins/pull/365) [`ed2c8ae`](https://github.com/kubb-labs/plugins/commit/ed2c8ae14591e546ec27f52690180a7334821662) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - **plugin-client**: extend `parser` option to support per-direction Zod validation.

  The `parser` option now accepts an object form `{ request?: 'zod'; response?: 'zod' }` in addition to the existing `false | 'zod'` shorthand.

  - `parser: 'zod'` keeps existing behavior, validating response bodies and request bodies via `@kubb/plugin-zod` schemas.
  - `parser: { request: 'zod' }` validates the request body and query parameters before the call. Use this for coercion (`z.coerce.number()` converts stringified query parameters to numbers).
  - `parser: { response: 'zod' }` validates response bodies only.
  - `parser: { request: 'zod', response: 'zod' }` validates all directions, including query parameters.

  Generated call site with `parser: { request: 'zod', response: 'zod' }`:

  ```ts
  const requestData = createVehicleDataSchema.parse(data)
  const requestParams = listVehiclesQueryParamsSchema.parse(params)
  const res = await request({ data: requestData, params: requestParams, ... })
  return listVehiclesResponseSchema.parse(res.data)
  ```

  Operations without query params skip the `requestParams` line.

  plugin-react-query, plugin-swr, and plugin-vue-query pass the new option shape through unchanged.

- [#398](https://github.com/kubb-labs/plugins/pull/398) [`d7b6152`](https://github.com/kubb-labs/plugins/commit/d7b615277ffc94c157471a39f92cfd0c4f60e42f) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Stop shipping `extension.yaml` in the npm packages and remove the yaml generator (`plugins/` sources and `scripts/build-extension-yaml.ts`). Extension metadata now lives in the platform repo (`kubb-labs/platform`, `extensions/` at the repo root) and the options are documented on each plugin's kubb.dev page.

- [#374](https://github.com/kubb-labs/plugins/pull/374) [`83db03f`](https://github.com/kubb-labs/plugins/commit/83db03ffe3c93d961ae54e052e908e462d46608a) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Drop the `'group'` value from the documented `output.mode` option. `output.mode` now accepts `'directory' | 'file'`, and the `group` option organizes `'directory'` output into per-tag or per-path subdirectories. This tracks the removal of the per-group consolidation mode in `@kubb/core`.

- Updated dependencies [[`696e974`](https://github.com/kubb-labs/plugins/commit/696e974fecfc1efcb48f88a1f1c19da7e20bfbb5), [`47713fa`](https://github.com/kubb-labs/plugins/commit/47713fa4d933484fd4661782025e098be2300889), [`efee68f`](https://github.com/kubb-labs/plugins/commit/efee68f7c6c750e6197f00714473a60746093d06), [`35a600d`](https://github.com/kubb-labs/plugins/commit/35a600d7516f11270afbda25ed89e5bb8a9c9603), [`fdd85ac`](https://github.com/kubb-labs/plugins/commit/fdd85acb9f6989dbf332eee204e4a8da238d0a74), [`d5ee139`](https://github.com/kubb-labs/plugins/commit/d5ee1391ea1f66b27f8c37fc89b14bb3895af920), [`501899f`](https://github.com/kubb-labs/plugins/commit/501899fc2445f3cbb302d4126142d45818b62986), [`414e204`](https://github.com/kubb-labs/plugins/commit/414e204f71a21a5b093b2a60278a5298f3cd1d00), [`ed2c8ae`](https://github.com/kubb-labs/plugins/commit/ed2c8ae14591e546ec27f52690180a7334821662), [`4458b2f`](https://github.com/kubb-labs/plugins/commit/4458b2fe9f69860351f1ba8ca03ff83f37ff5f36), [`d7b6152`](https://github.com/kubb-labs/plugins/commit/d7b615277ffc94c157471a39f92cfd0c4f60e42f), [`83db03f`](https://github.com/kubb-labs/plugins/commit/83db03ffe3c93d961ae54e052e908e462d46608a), [`1de83e0`](https://github.com/kubb-labs/plugins/commit/1de83e076bf302b82a3ecbb8b63808016f01d268)]:
  - @kubb/plugin-client@5.0.0-beta.56
  - @kubb/plugin-ts@5.0.0-beta.56
  - @kubb/plugin-zod@5.0.0-beta.56

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
