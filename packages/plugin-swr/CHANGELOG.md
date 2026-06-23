# @kubb/plugin-swr

## 5.0.0-beta.74

### Patch Changes

- [#493](https://github.com/kubb-labs/plugins/pull/493) [`f475ce6`](https://github.com/kubb-labs/plugins/commit/f475ce639a667d626a36979fcca55c667c9dbe2d) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Target `@kubb/core` `5.0.0-beta.74` and register generators in a single `ctx.addGenerator` call now that it accepts multiple generators, dropping the per-generator loop.

- Updated dependencies []:
  - @kubb/plugin-ts@5.0.0-beta.74
  - @kubb/plugin-zod@5.0.0-beta.74

## 5.0.0-beta.73

### Major Changes

- [#457](https://github.com/kubb-labs/plugins/pull/457) [`6d27528`](https://github.com/kubb-labs/plugins/commit/6d2752810ef46328bcb6b9495e4ff068c5ec43e8) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - **Breaking:** Remove the `generators` plugin option.

  Plugins no longer accept a `generators` array of custom `Generator` objects. To add or replace generated output, build your own plugin instead. See [Creating plugins](https://kubb.dev/docs/5.x/guides/creating-plugins) for the full walkthrough.

### Minor Changes

- [#459](https://github.com/kubb-labs/plugins/pull/459) [`c29bd39`](https://github.com/kubb-labs/plugins/commit/c29bd3949c07ffd23be20a2a6b98eb5de887d913) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Every client now takes one grouped `{ path, query, body, headers }` options object with camelCase parameter names, matching `@kubb/plugin-fetch`. This replaces the old per-argument signatures, the `params`/`data` keys, and the three options that produced them.

  Removed `paramsType`, `pathParamsType`, and `paramsCasing` from `@kubb/plugin-client`, `@kubb/plugin-react-query`, `@kubb/plugin-vue-query`, `@kubb/plugin-swr`, and `@kubb/plugin-cypress`. Removed `paramsCasing` from `@kubb/plugin-ts`, `@kubb/plugin-zod`, `@kubb/plugin-faker`, and `@kubb/plugin-mcp`.

  Generated functions, class methods, SDK methods, and query hooks now take the grouped object typed from the operation's `XxxRequestConfig`, and always camelCase the parameter names. The HTTP request still sends the original spec names, Kubb writes the mapping for you. Each `path`, `query`, and `headers` group is required when the operation has a required parameter in that group, so callers get a compile-time error before sending an incomplete request.

  The axios and fetch runtimes shipped by `@kubb/plugin-client` rename their `RequestConfig` fields `params` to `query` and `data` to `body` (mapped to axios's native fields internally). Update any custom client or low-level `client({ ... })` call accordingly.

  Update call sites to the grouped object, for example `getPet({ path: { petId } })`, `addPet({ body })`, and `useFindPetsByStatus({ query: { status } })`.

- [#475](https://github.com/kubb-labs/plugins/pull/475) [`52345a6`](https://github.com/kubb-labs/plugins/commit/52345a6302c0e9fab5b1e87ee03446e99dc4273d) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Migrate the client plugins to the shared `RequestResult` contract and remove `dataReturnType` ([#392](https://github.com/kubb-labs/plugins/issues/392)).

  `@kubb/plugin-client` now generates operations that return `RequestResult` — `{ data, error, request, response }` — with `throwOnError` defaulting to `true`, the same contract `@kubb/plugin-fetch` and `@kubb/plugin-axios` already ship. The query plugins (react-query, vue-query, swr) take a single `client: 'fetch' | 'axios'` option: `'fetch'`/`'axios'` (or any registered contract client, including `@kubb/plugin-client`) route through the contract. `@kubb/plugin-mcp` and `@kubb/plugin-cypress` drop `dataReturnType` as well.

  **Breaking. Migration:**

  - `dataReturnType: 'data'` → destructure the result: `const { data } = await getPet(1)`. fetch users now get the throw-on-error contract axios users already had.
  - `dataReturnType: 'full'` → pass `throwOnError: false` and read `error` / `response.status` off the result.
  - Query plugins: the deprecated `client` object is removed. Use `client: 'fetch' | 'axios'` with the matching client plugin registered.
  - `@kubb/plugin-cypress`: every helper now yields the response body (`Cypress.Chainable<T>`); the `'full'` `Cypress.Response` variant is gone.
  - `@kubb/plugin-mcp`: handlers call the contract client and read `res.data`; form-data follows the contract runtime's serializer (the `buildFormData` helper is gone).
  - `@kubb/plugin-client`: the `urlType` option and its `get<Operation>Url` URL helpers are removed, along with the `resolveUrlName` resolver method.

- [#475](https://github.com/kubb-labs/plugins/pull/475) [`e0f0138`](https://github.com/kubb-labs/plugins/commit/e0f013848d4d42d59db8de6b7a7595409950f726) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Query hooks can now call the client plugins directly. Register `@kubb/plugin-fetch` or `@kubb/plugin-axios` and set `client: 'fetch' | 'axios'` — or register a single client plugin and it is auto-detected — and the generated hooks import its operation functions, return the response body, and surface `ResponseError` from the bundled `.kubb/client.ts`.

- [#478](https://github.com/kubb-labs/plugins/pull/478) [`239d92c`](https://github.com/kubb-labs/plugins/commit/239d92c3b18751ba9a60a990602e1f1269c629cf) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Remove the inline client fallback. The query plugins and `@kubb/plugin-mcp` no longer emit their own bundled `.kubb/client.ts`; they always call a registered `@kubb/plugin-axios` or `@kubb/plugin-fetch` (auto-detected when one is registered, or selected with `client: 'axios' | 'fetch'`).

  Register a client plugin alongside the query/mcp plugin. Transport options such as `baseURL` live on that client plugin, so the `baseURL` option was removed from `@kubb/plugin-mcp`.

  ```ts
  plugins: [
    pluginTs(),
    pluginAxios({ baseURL: "https://api.example.com" }),
    pluginReactQuery(),
  ];
  ```

- [#478](https://github.com/kubb-labs/plugins/pull/478) [`39f6760`](https://github.com/kubb-labs/plugins/commit/39f67602ac2a5c1c48afb26ecaaf4f2cd19070ec) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Remove the `@kubb/plugin-client` package. Its axios and fetch runtimes now ship as the dedicated `@kubb/plugin-axios` and `@kubb/plugin-fetch` packages, which speak the same `RequestResult` contract.

  Migrate by swapping the plugin you register:

  ```ts
  // before
  import { pluginClient } from "@kubb/plugin-client";
  pluginClient({ client: "axios" });

  // after
  import { pluginAxios } from "@kubb/plugin-axios";
  pluginAxios({});
  ```

  The query plugins (`plugin-react-query`, `plugin-vue-query`, `plugin-swr`) and `plugin-mcp` now read their bundled client runtime from `@kubb/plugin-axios` and `@kubb/plugin-fetch` instead of `@kubb/plugin-client`. Register one of those packages, or let the hooks emit their own inline contract client when none is registered.

  `plugin-axios` and `plugin-fetch` now export `axiosClientTemplatePath` and `fetchClientTemplatePath` so other plugins can inject the matching runtime.

  Three `plugin-client` options have no equivalent and are dropped: `operations` (the `operations.ts` re-export file), `clientType: 'staticClass'`, and `importPath` for a custom client module. Use the `sdk` option on `plugin-axios` / `plugin-fetch` for class-based output.

### Patch Changes

- [#443](https://github.com/kubb-labs/plugins/pull/443) [`ce1e109`](https://github.com/kubb-labs/plugins/commit/ce1e1093490a0bc3459276d25a8d8f39eaf1d981) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Emit the client templates by copying the real `.ts` files into the generated folder instead of inlining their source as strings at build time. The templates ship as real files and `@kubb/plugin-client` exposes them through `@kubb/plugin-client/templates` (resolved absolute paths for the new `copy` file field) and the `@kubb/plugin-client/templates/*` subpath (the raw files). This replaces the build-time `importAttributeTextPlugin` and the `templates/*.source` wrapper exports.

  Remove the `bundle` option. The client runtime is now always bundled into the generated output. Generated code no longer imports from `@kubb/plugin-client/clients/{client}` by default. The selected client is emitted into `.kubb/client.ts` and imported locally, and a custom `importPath` imports it from an external module instead.

- [#484](https://github.com/kubb-labs/plugins/pull/484) [`c1a51f8`](https://github.com/kubb-labs/plugins/commit/c1a51f85c45dc313d57925b68e66ee92037a52ed) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Bundle the private internal helper packages into the published output instead of declaring them as runtime dependencies. The published packages no longer reference workspace-only packages that are not on npm, and the release step can version the plugins again.

- [#473](https://github.com/kubb-labs/plugins/pull/473) [`fca3007`](https://github.com/kubb-labs/plugins/commit/fca3007ceda865f7576157e57bcc70d9cbe37add) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Move the TypeScript function-parameter model and the `createOperationParams` builder into `@kubb/plugin-ts`, next to `functionPrinter`. `@kubb/plugin-ts` now exports `createFunctionParameter`, `createFunctionParameters`, `createTypeLiteral`, `createIndexedAccessType`, `createObjectBindingPattern`, and `createOperationParams` along with their types. Plugins import these from `@kubb/plugin-ts` instead of `@kubb/ast`, and the `caseParams` helper and `OperationParamsResolver` contract now come from the shared internals. Generated output is unchanged.

- [#439](https://github.com/kubb-labs/plugins/pull/439) [`7364067`](https://github.com/kubb-labs/plugins/commit/7364067a2800d70822f530c6ab29b3d007cbd4e2) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Reframe each plugin description and its keywords around Kubb instead of naming OpenAPI. The READMEs use the same wording.

- Updated dependencies [[`c29bd39`](https://github.com/kubb-labs/plugins/commit/c29bd3949c07ffd23be20a2a6b98eb5de887d913), [`fca3007`](https://github.com/kubb-labs/plugins/commit/fca3007ceda865f7576157e57bcc70d9cbe37add), [`8864aa7`](https://github.com/kubb-labs/plugins/commit/8864aa72ae813c24028989b320b3c6947331f80f), [`7f3a055`](https://github.com/kubb-labs/plugins/commit/7f3a0556b967af0d468c5f9946455b073a1716c8), [`aa7ba7f`](https://github.com/kubb-labs/plugins/commit/aa7ba7f433ecb6ef5004cc2094f9ee7bed45a358), [`7364067`](https://github.com/kubb-labs/plugins/commit/7364067a2800d70822f530c6ab29b3d007cbd4e2), [`6d27528`](https://github.com/kubb-labs/plugins/commit/6d2752810ef46328bcb6b9495e4ff068c5ec43e8), [`4390631`](https://github.com/kubb-labs/plugins/commit/439063187de7b6d6b3fbeafe09a5391ab136bd20)]:
  - @kubb/plugin-ts@5.0.0-beta.73
  - @kubb/plugin-zod@5.0.0-beta.73

## 5.0.0-beta.65

### Patch Changes

- Updated dependencies [[`f324806`](https://github.com/kubb-labs/plugins/commit/f32480645960533b8dffe5af273c5382fa0e4964), [`f324806`](https://github.com/kubb-labs/plugins/commit/f32480645960533b8dffe5af273c5382fa0e4964)]:
  - @kubb/plugin-ts@5.0.0-beta.65
  - @kubb/plugin-zod@5.0.0-beta.65
  - @kubb/plugin-client@5.0.0-beta.65

## 5.0.0-beta.64

### Major Changes

- [#408](https://github.com/kubb-labs/plugins/pull/408) [`d0dc716`](https://github.com/kubb-labs/plugins/commit/d0dc716d746cd7c64d9b75597ebe9312ba51051d) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Migrate the plugins to the reshaped `@kubb/ast` param and type model.

  A parameter type is now a plain `string`, so the `ast.createParamsType({ variant: 'reference', name })` wrapper is gone from every component. The query, header, and path grouping helpers (`resolveParamType`, `resolveGroupType`, `buildGroupParam`, `buildTypeLiteral`) are imported from `@kubb/ast` instead of being redefined in `internals/tanstack-query`. The `functionPrinter` keeps two modes, `declaration` and `call`; the `keys` and `values` modes are removed, and a destructured group renders from a single `FunctionParameter` whose name is an `ObjectBindingPattern` and whose type is a `TypeLiteral`. `@kubb/plugin-ts` now exports `renderType` for turning a type expression into source.

  Generated output is unchanged.

- [#417](https://github.com/kubb-labs/plugins/pull/417) [`0aa9573`](https://github.com/kubb-labs/plugins/commit/0aa9573825f6eff87e3301377016085ff334bc39) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Replace the `transformer` option with `macros`.

  Every plugin now takes `macros?: Array<ast.Macro>` instead of `transformer?: ast.Visitor`, and registers them with `ctx.setMacros` in `kubb:plugin:setup`. Macros are named and composable, so a list runs in order and a later macro sees the output of an earlier one. Move a single visitor into a macro by wrapping it: `macros: [{ name: 'my-macro', schema(node) { … } }]`.

### Patch Changes

- [#413](https://github.com/kubb-labs/plugins/pull/413) [`0eabb97`](https://github.com/kubb-labs/plugins/commit/0eabb97b08188772b10a348c2144d51d0e4d6077) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Import `createOperationParams` from `@kubb/ast/utils` instead of `ast.factory`. The helper moved off the `@kubb/ast` factory namespace because it is a high-level builder, not a `ts.factory` primitive. Generated output is unchanged.

- Updated dependencies [[`0eabb97`](https://github.com/kubb-labs/plugins/commit/0eabb97b08188772b10a348c2144d51d0e4d6077), [`058c7ff`](https://github.com/kubb-labs/plugins/commit/058c7ffe6d8959c718543782f95d4f7bbef1cbe7), [`d0dc716`](https://github.com/kubb-labs/plugins/commit/d0dc716d746cd7c64d9b75597ebe9312ba51051d), [`1d58e1a`](https://github.com/kubb-labs/plugins/commit/1d58e1a6bf6514930bb8bbb214c6435bcb608530), [`0aa9573`](https://github.com/kubb-labs/plugins/commit/0aa9573825f6eff87e3301377016085ff334bc39), [`451f3b7`](https://github.com/kubb-labs/plugins/commit/451f3b7a24eb95fb4881bee8de59839e81686386), [`0aa9573`](https://github.com/kubb-labs/plugins/commit/0aa9573825f6eff87e3301377016085ff334bc39)]:
  - @kubb/plugin-client@5.0.0-beta.64
  - @kubb/plugin-ts@5.0.0-beta.64
  - @kubb/plugin-zod@5.0.0-beta.64

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
