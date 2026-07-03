# @kubb/plugin-mcp

## 5.0.0-beta.82

### Major Changes

- [#618](https://github.com/kubb-labs/plugins/pull/618) [`5db1f7a`](https://github.com/kubb-labs/plugins/commit/5db1f7a8eb8501489c40949423f7debf5f8ed26a) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Depend on `kubb` instead of `@kubb/core` and `@kubb/renderer-jsx` directly. Every plugin's `peerDependencies` now list a single `kubb` entry. This matches the `kubb-labs/kubb` `5.0.0-beta.81` release, which adds `kubb/kit`, `kubb/ast`, and `kubb/jsx` subpaths that re-export the plugin authoring API.

  If you install a plugin directly (rather than only through `kubb`), update its peer to `kubb` and drop any standalone `@kubb/core` or `@kubb/renderer-jsx` install:

  ```diff
  - pnpm add @kubb/core @kubb/renderer-jsx
  + pnpm add kubb
  ```

  Custom generators and plugins that build on these packages' internals should follow the same
  `@kubb/core` → `kubb/kit`, `@kubb/ast` → `kubb/ast`, `@kubb/renderer-jsx` → `kubb/jsx` mapping.
  `@kubb/parser-ts` (used by `plugin-ts` and `plugin-faker`) and `@kubb/adapter-oas` (used by
  `plugin-redoc`, and for the `AdapterOas` type in `plugin-ts`/`plugin-zod`/`plugin-faker`) are
  unaffected and stay direct dependencies.

### Minor Changes

- [#613](https://github.com/kubb-labs/plugins/pull/613) [`756830d`](https://github.com/kubb-labs/plugins/commit/756830d28ec98fde78e63e397d0214fed7b46a34) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Add `@kubb/core` as a `peerDependency`, alongside its existing `dependencies` entry, matching the pattern used by Vite and Vue plugin ecosystems. Plugins run against a single shared `@kubb/core` instance owned by the host CLI, so a mismatched version risks `instanceof` errors and other subtle bugs across plugin boundaries. The peer range signals that constraint to package managers, while keeping `@kubb/core` in `dependencies` too keeps install working out of the box across npm, Yarn, and pnpm without requiring consumers to install `@kubb/core` themselves.

### Patch Changes

- Updated dependencies [[`756830d`](https://github.com/kubb-labs/plugins/commit/756830d28ec98fde78e63e397d0214fed7b46a34), [`5db1f7a`](https://github.com/kubb-labs/plugins/commit/5db1f7a8eb8501489c40949423f7debf5f8ed26a)]:
  - @kubb/plugin-ts@5.0.0-beta.82
  - @kubb/plugin-zod@5.0.0-beta.82

## 5.0.0-beta.81

### Patch Changes

- Updated dependencies [[`9126149`](https://github.com/kubb-labs/plugins/commit/9126149b997970d336c1fcf2789576966270c86e), [`238d48c`](https://github.com/kubb-labs/plugins/commit/238d48cb0169d79e0a86d5cd7625575dde5bf9dd), [`238d48c`](https://github.com/kubb-labs/plugins/commit/238d48cb0169d79e0a86d5cd7625575dde5bf9dd), [`238d48c`](https://github.com/kubb-labs/plugins/commit/238d48cb0169d79e0a86d5cd7625575dde5bf9dd)]:
  - @kubb/plugin-zod@5.0.0-beta.81
  - @kubb/plugin-ts@5.0.0-beta.81

## 5.0.0-beta.80

### Patch Changes

- Updated dependencies []:
  - @kubb/plugin-ts@5.0.0-beta.80
  - @kubb/plugin-zod@5.0.0-beta.80

## 5.0.0-beta.79

### Patch Changes

- Updated dependencies [[`e20770b`](https://github.com/kubb-labs/plugins/commit/e20770b6baf5f5274e3dd8005a06580787274e3e), [`4309b83`](https://github.com/kubb-labs/plugins/commit/4309b83abcbe322bad76fedd466396ba32bdcd4f), [`4e0906b`](https://github.com/kubb-labs/plugins/commit/4e0906b93bcb3d37441857380e119204264afb3a), [`ba80c04`](https://github.com/kubb-labs/plugins/commit/ba80c0427d6a42ce3131323b3f48fa16f2965aad), [`3992fde`](https://github.com/kubb-labs/plugins/commit/3992fde9273c175148dd3286161eb22338256f7d), [`5e03a70`](https://github.com/kubb-labs/plugins/commit/5e03a70f44c845e4230ca64665db4fdc226af746), [`a0fe6bd`](https://github.com/kubb-labs/plugins/commit/a0fe6bdcb1e619957c1e797218ba2adc774c7ec0), [`62cae59`](https://github.com/kubb-labs/plugins/commit/62cae5965912a17533dbf3a2ade1c64f1b305e95), [`8a6dce0`](https://github.com/kubb-labs/plugins/commit/8a6dce03ba62fc6b180cc870487556927024ffff)]:
  - @kubb/plugin-ts@5.0.0-beta.79
  - @kubb/plugin-zod@5.0.0-beta.79

## 5.0.0-beta.77

### Patch Changes

- Updated dependencies [[`fae9f47`](https://github.com/kubb-labs/plugins/commit/fae9f470468870ed7015f2c910fd817c7e7daeef), [`455e6f1`](https://github.com/kubb-labs/plugins/commit/455e6f1c1f9047fb5cb7d4d12038dc2b5eb4422a)]:
  - @kubb/plugin-ts@5.0.0-beta.77
  - @kubb/plugin-zod@5.0.0-beta.77

## 5.0.0-beta.76

### Patch Changes

- Updated dependencies [[`3fe9268`](https://github.com/kubb-labs/plugins/commit/3fe92680b3a624cec83db06dd42ebb57acab505d), [`4c7e449`](https://github.com/kubb-labs/plugins/commit/4c7e449383a8888273b1e7f32222a5d869d9c4d8), [`e64ff08`](https://github.com/kubb-labs/plugins/commit/e64ff085c2ad3676291d7c81cfb9be1761012798)]:
  - @kubb/plugin-zod@5.0.0-beta.76
  - @kubb/plugin-ts@5.0.0-beta.76

## 5.0.0-beta.75

### Patch Changes

- Updated dependencies [[`6cabaa0`](https://github.com/kubb-labs/plugins/commit/6cabaa0f3bb219a789b5b31b97b65524ff855b30)]:
  - @kubb/plugin-zod@5.0.0-beta.75
  - @kubb/plugin-ts@5.0.0-beta.75

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

- [#478](https://github.com/kubb-labs/plugins/pull/478) [`e823790`](https://github.com/kubb-labs/plugins/commit/e823790285532fb75a34df6454a4dfb1bce5f9ba) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Align `@kubb/plugin-mcp` with the other client consumers. Each tool handler now takes the grouped `{ path, query, headers, body }` config (matching the contract `<op>` and the cypress request shape) and forwards it to the resolved client function instead of re-building the request inline.

  The `client` option is now a `'axios' | 'fetch'` selector, the same one the query plugins use. When `@kubb/plugin-axios` or `@kubb/plugin-fetch` is registered, the handlers import and call its generated `<op>`; otherwise they emit their own inline contract client. Set `baseURL` on the plugin for the inline case.

  ```ts
  // before
  pluginMcp({
    client: { client: "axios", baseURL: "https://api.example.com" },
  });

  // after — delegate to a registered client plugin
  pluginAxios({ baseURL: "https://api.example.com" });
  pluginMcp({});

  // after — no client plugin, inline runtime
  pluginMcp({ client: "axios", baseURL: "https://api.example.com" });
  ```

  The generated MCP tool `inputSchema` now nests its params under `path` / `query` / `headers` / `body` to match the handler shape. The `client.clientType` and `client.importPath` options are gone.

- [#475](https://github.com/kubb-labs/plugins/pull/475) [`52345a6`](https://github.com/kubb-labs/plugins/commit/52345a6302c0e9fab5b1e87ee03446e99dc4273d) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Migrate the client plugins to the shared `RequestResult` contract and remove `dataReturnType` ([#392](https://github.com/kubb-labs/plugins/issues/392)).

  `@kubb/plugin-client` now generates operations that return `RequestResult` — `{ data, error, request, response }` — with `throwOnError` defaulting to `true`, the same contract `@kubb/plugin-fetch` and `@kubb/plugin-axios` already ship. The query plugins (react-query, vue-query, swr) take a single `client: 'fetch' | 'axios'` option: `'fetch'`/`'axios'` (or any registered contract client, including `@kubb/plugin-client`) route through the contract. `@kubb/plugin-mcp` and `@kubb/plugin-cypress` drop `dataReturnType` as well.

  **Breaking. Migration:**

  - `dataReturnType: 'data'` → destructure the result: `const { data } = await getPet(1)`. fetch users now get the throw-on-error contract axios users already had.
  - `dataReturnType: 'full'` → pass `throwOnError: false` and read `error` / `response.status` off the result.
  - Query plugins: the deprecated `client` object is removed. Use `client: 'fetch' | 'axios'` with the matching client plugin registered.
  - `@kubb/plugin-cypress`: every helper now yields the response body (`Cypress.Chainable<T>`); the `'full'` `Cypress.Response` variant is gone.
  - `@kubb/plugin-mcp`: handlers call the contract client and read `res.data`; form-data follows the contract runtime's serializer (the `buildFormData` helper is gone).
  - `@kubb/plugin-client`: the `urlType` option and its `get<Operation>Url` URL helpers are removed, along with the `resolveUrlName` resolver method.

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

### Minor Changes

- [#350](https://github.com/kubb-labs/plugins/pull/350) [`35a600d`](https://github.com/kubb-labs/plugins/commit/35a600d7516f11270afbda25ed89e5bb8a9c9603) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Default tag group folders to the plain camelCased tag.

  With `group: { type: 'tag' }`, every plugin now writes to `pet/` instead of `petController/` (and the Cypress and MCP plugins drop the `Requests` suffix too). The suffixes were a leftover convention nothing in the output referenced. To keep the old layout, pass `group: { type: 'tag', name: ({ group }) => \`${group}Controller\` }`.

### Patch Changes

- [#326](https://github.com/kubb-labs/plugins/pull/326) [`2d6e478`](https://github.com/kubb-labs/plugins/commit/2d6e4787d61a959ce56b06ecdecbfab4b20de324) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Clean up whitespace in the raw generated output (the source emitted before any external formatter runs):

  - **react-query / vue-query**: empty conditional fragments (`enabled`, `customOptions`) no longer leave stray blank lines. This removes the double blank line in mutation/query hooks and the blank line that appeared right after `queryOptions<…, typeof queryKey>({`.
  - **mcp**: the handler `return { content: […], structuredContent: {…} }` block is now indented at the function-body baseline instead of being over-indented.

- [#328](https://github.com/kubb-labs/plugins/pull/328) [`47713fa`](https://github.com/kubb-labs/plugins/commit/47713fa4d933484fd4661782025e098be2300889) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Replace the stale v4 `barrelType: 'named'` key in every plugin's `output` destructuring default with the v5 `barrel: { type: 'named' }` object. Generated output is unchanged: `@kubb/plugin-barrel` never read the dead key and already fell back to `{ type: 'named' }`. The code now matches the documented default in each plugin's option docs.

  Docs metadata fixes in the same pass: `@kubb/plugin-zod` documents that `importPath` defaults to `'zod/mini'` when `mini` is enabled, and `@kubb/plugin-swr` documents the `parser` default as the boolean `false` instead of the string `'false'`.

- [#398](https://github.com/kubb-labs/plugins/pull/398) [`d7b6152`](https://github.com/kubb-labs/plugins/commit/d7b615277ffc94c157471a39f92cfd0c4f60e42f) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Stop shipping `extension.yaml` in the npm packages and remove the yaml generator (`plugins/` sources and `scripts/build-extension-yaml.ts`). Extension metadata now lives in the platform repo (`kubb-labs/platform`, `extensions/` at the repo root) and the options are documented on each plugin's kubb.dev page.

- [#374](https://github.com/kubb-labs/plugins/pull/374) [`83db03f`](https://github.com/kubb-labs/plugins/commit/83db03ffe3c93d961ae54e052e908e462d46608a) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Drop the `'group'` value from the documented `output.mode` option. `output.mode` now accepts `'directory' | 'file'`, and the `group` option organizes `'directory'` output into per-tag or per-path subdirectories. This tracks the removal of the per-group consolidation mode in `@kubb/core`.

- Updated dependencies [[`696e974`](https://github.com/kubb-labs/plugins/commit/696e974fecfc1efcb48f88a1f1c19da7e20bfbb5), [`47713fa`](https://github.com/kubb-labs/plugins/commit/47713fa4d933484fd4661782025e098be2300889), [`efee68f`](https://github.com/kubb-labs/plugins/commit/efee68f7c6c750e6197f00714473a60746093d06), [`35a600d`](https://github.com/kubb-labs/plugins/commit/35a600d7516f11270afbda25ed89e5bb8a9c9603), [`fdd85ac`](https://github.com/kubb-labs/plugins/commit/fdd85acb9f6989dbf332eee204e4a8da238d0a74), [`d5ee139`](https://github.com/kubb-labs/plugins/commit/d5ee1391ea1f66b27f8c37fc89b14bb3895af920), [`501899f`](https://github.com/kubb-labs/plugins/commit/501899fc2445f3cbb302d4126142d45818b62986), [`414e204`](https://github.com/kubb-labs/plugins/commit/414e204f71a21a5b093b2a60278a5298f3cd1d00), [`ed2c8ae`](https://github.com/kubb-labs/plugins/commit/ed2c8ae14591e546ec27f52690180a7334821662), [`4458b2f`](https://github.com/kubb-labs/plugins/commit/4458b2fe9f69860351f1ba8ca03ff83f37ff5f36), [`d7b6152`](https://github.com/kubb-labs/plugins/commit/d7b615277ffc94c157471a39f92cfd0c4f60e42f), [`83db03f`](https://github.com/kubb-labs/plugins/commit/83db03ffe3c93d961ae54e052e908e462d46608a), [`1de83e0`](https://github.com/kubb-labs/plugins/commit/1de83e076bf302b82a3ecbb8b63808016f01d268)]:
  - @kubb/plugin-client@5.0.0-beta.56
  - @kubb/plugin-ts@5.0.0-beta.56
  - @kubb/plugin-zod@5.0.0-beta.56

## 5.0.0-beta.44

### Patch Changes

- [#319](https://github.com/kubb-labs/plugins/pull/319) [`27fbf2f`](https://github.com/kubb-labs/plugins/commit/27fbf2f16bf4da0aba6e0966f521bb350c675681) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Import the renderer as `jsxRenderer` from `@kubb/renderer-jsx`. The `jsxRendererSync` and `jsxRenderer` exports were the same function behind two names, and the next `@kubb/renderer-jsx` major keeps only `jsxRenderer`. Generated output is unchanged.

- Updated dependencies [[`27fbf2f`](https://github.com/kubb-labs/plugins/commit/27fbf2f16bf4da0aba6e0966f521bb350c675681), [`92482b1`](https://github.com/kubb-labs/plugins/commit/92482b1ee0a0b70c2bc0293f5d3d8dbd5519af75), [`27fbf2f`](https://github.com/kubb-labs/plugins/commit/27fbf2f16bf4da0aba6e0966f521bb350c675681), [`92482b1`](https://github.com/kubb-labs/plugins/commit/92482b1ee0a0b70c2bc0293f5d3d8dbd5519af75), [`92482b1`](https://github.com/kubb-labs/plugins/commit/92482b1ee0a0b70c2bc0293f5d3d8dbd5519af75)]:
  - @kubb/plugin-client@5.0.0-beta.44
  - @kubb/plugin-ts@5.0.0-beta.44
  - @kubb/plugin-zod@5.0.0-beta.44

## 5.0.0-beta.42

### Patch Changes

- [#315](https://github.com/kubb-labs/plugins/pull/315) [`b1c6bda`](https://github.com/kubb-labs/plugins/commit/b1c6bda0a88ce3557f25dbf9be80f6df2a46dcfa) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Generated MCP `server.ts` now exports `getServer()` and `startServer()` factories that build a fresh `McpServer` per call. The previous singleton was unusable for HTTP transports, where each session needs its own server instance ([kubb-labs/kubb#3481](https://github.com/kubb-labs/kubb/issues/3481)).

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

- Updated dependencies []:
  - @kubb/plugin-client@5.0.0-beta.33
  - @kubb/plugin-ts@5.0.0-beta.33
  - @kubb/plugin-zod@5.0.0-beta.33

## 5.0.0-beta.31

### Patch Changes

- [#238](https://github.com/kubb-labs/plugins/pull/238) [`12084a7`](https://github.com/kubb-labs/plugins/commit/12084a75e4539c9c416a33657c86b699f885c374) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Adopt `@kubb/ast`'s `HttpOperationNode` union. Each operation generator narrows the incoming node with `ast.isHttpOperationNode` (HTTP-only plugins), and shared helpers/components accept `ast.HttpOperationNode`, so `method`/`path` are non-nullable without manual assertions. OpenAPI output is unchanged.

- [#241](https://github.com/kubb-labs/plugins/pull/241) [`7bf4c87`](https://github.com/kubb-labs/plugins/commit/7bf4c87304143708f7c7619b4af5013f40fb81cf) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Replace the per-plugin `group` naming block (duplicated verbatim across nine plugins) with a shared `createGroupConfig` helper from `@internals/shared`. Each plugin's grouping behavior is preserved exactly — the `Controller`/`Requests` suffix and whether a user-provided `group.name` is honored are passed as options — so generated output is unchanged. Internal refactor only.

- Updated dependencies [[`682b463`](https://github.com/kubb-labs/plugins/commit/682b4634ffcff48d8e1c6622e514ab49f2eae381), [`8a5e800`](https://github.com/kubb-labs/plugins/commit/8a5e8004e49d2125e9b89598e09d47645b7ad8ea), [`12084a7`](https://github.com/kubb-labs/plugins/commit/12084a75e4539c9c416a33657c86b699f885c374), [`7bf4c87`](https://github.com/kubb-labs/plugins/commit/7bf4c87304143708f7c7619b4af5013f40fb81cf), [`0ca63ab`](https://github.com/kubb-labs/plugins/commit/0ca63ab8f6c34a51936d355969a3d1b6f6c98708), [`4c08e4c`](https://github.com/kubb-labs/plugins/commit/4c08e4c5082410871e0ccb7274343738d1f7b3ff)]:
  - @kubb/plugin-client@5.0.0-beta.31
  - @kubb/plugin-ts@5.0.0-beta.31
  - @kubb/plugin-zod@5.0.0-beta.31

## 5.0.0-beta.30

### Patch Changes

- Updated dependencies [[`21accf1`](https://github.com/kubb-labs/plugins/commit/21accf11be058a252aded049a5d98e30eb6b4c32)]:
  - @kubb/plugin-ts@5.0.0-beta.30
  - @kubb/plugin-client@5.0.0-beta.30
  - @kubb/plugin-zod@5.0.0-beta.30

## 5.0.0-beta.29

### Patch Changes

- [#226](https://github.com/kubb-labs/plugins/pull/226) [`299eede`](https://github.com/kubb-labs/plugins/commit/299eede6647b12684459c503addff704a1ead55a) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Align plugin release flow with the beta.29 core dependency update.

- Updated dependencies [[`299eede`](https://github.com/kubb-labs/plugins/commit/299eede6647b12684459c503addff704a1ead55a)]:
  - @kubb/plugin-client@5.0.0-beta.29
  - @kubb/plugin-ts@5.0.0-beta.29
  - @kubb/plugin-zod@5.0.0-beta.29

## 5.0.0-beta.28

### Minor Changes

- [#218](https://github.com/kubb-labs/plugins/pull/218) [`c97c8cf`](https://github.com/kubb-labs/plugins/commit/c97c8cf7b8e5c3d29293056f586d4591f8414a9d) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Forward per-file context to `output.banner`/`output.footer` so a directive like `'use server'` can be skipped on re-export files.

  Every generator now passes the file it renders into (`filePath`, `baseName`) to the banner/footer resolver, and the grouped client generator (`@kubb/plugin-client`) flags its group `[dir]/[dir].ts` files as `isAggregation`. Combined with the `BannerMeta` context added in `@kubb/core`, a banner function can branch per file:

  ```ts
  pluginClient({
    output: {
      banner: (meta) =>
        meta.isBarrel || meta.isAggregation ? "" : "'use server'",
    },
  });
  ```

  Requires `@kubb/core` with `BannerMeta` per-file banner context.

### Patch Changes

- [#212](https://github.com/kubb-labs/plugins/pull/212) [`7209687`](https://github.com/kubb-labs/plugins/commit/720968712147d1483682471dd5557082d0ff41fd) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Standardize the generated HTTP-client runtime on the export name `client`.

  Previously the request function was exported under mismatched names (`fetch` in some places, `client` in others), so with `bundle: true` the generated root barrel emitted `export { client } from './.kubb/client.ts'` while the runtime only exported `fetch`, causing `TS2724`. The runtime now consistently exports `client` across the `fetch` and `axios` adapters, and the bundled client file is always written to `.kubb/client.ts` (react-query, vue-query, and mcp previously wrote `.kubb/fetch.ts`). Generated code imports and calls `client` accordingly.

- Updated dependencies [[`c97c8cf`](https://github.com/kubb-labs/plugins/commit/c97c8cf7b8e5c3d29293056f586d4591f8414a9d), [`7209687`](https://github.com/kubb-labs/plugins/commit/720968712147d1483682471dd5557082d0ff41fd)]:
  - @kubb/plugin-client@5.0.0-beta.28
  - @kubb/plugin-ts@5.0.0-beta.28
  - @kubb/plugin-zod@5.0.0-beta.28

## 5.0.0-beta.27

### Patch Changes

- Updated dependencies [[`84af283`](https://github.com/kubb-labs/plugins/commit/84af2838968a34c764655280622ed68ad63b84d7), [`3871c83`](https://github.com/kubb-labs/plugins/commit/3871c83f4d949335915ede38efd8b3474e252877), [`0e96b81`](https://github.com/kubb-labs/plugins/commit/0e96b81e861bd2e07340fda3a17c3a72b020317c)]:
  - @kubb/plugin-client@5.0.0-beta.27
  - @kubb/plugin-ts@5.0.0-beta.27
  - @kubb/plugin-zod@5.0.0-beta.27

## 5.0.0-beta.25

### Patch Changes

- [#195](https://github.com/kubb-labs/plugins/pull/195) [`0446ce8`](https://github.com/kubb-labs/plugins/commit/0446ce881472c49bc66886c13066c8ae246e9a65) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Enforce `Array<T>` syntax (over `T[]`) via the oxlint `typescript/array-type` rule. Internal-only change; no runtime or API impact.

- [#188](https://github.com/kubb-labs/plugins/pull/188) [`57d79a2`](https://github.com/kubb-labs/plugins/commit/57d79a23ca628abad86c65ecca4aa282fa170aac) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Align plugin release flow with the beta.23 core dependency update.

- [#192](https://github.com/kubb-labs/plugins/pull/192) [`4ae19db`](https://github.com/kubb-labs/plugins/commit/4ae19db071d08514ff5f9c153d3c9adea30a253c) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Align plugin release flow with the beta.24 core dependency update.

- [`e7670fa`](https://github.com/kubb-labs/plugins/commit/e7670fadf2a822c71299ad9a827fd4226eaae55b) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - sync with kubb

- Updated dependencies [[`0446ce8`](https://github.com/kubb-labs/plugins/commit/0446ce881472c49bc66886c13066c8ae246e9a65), [`57d79a2`](https://github.com/kubb-labs/plugins/commit/57d79a23ca628abad86c65ecca4aa282fa170aac), [`4ae19db`](https://github.com/kubb-labs/plugins/commit/4ae19db071d08514ff5f9c153d3c9adea30a253c), [`e7670fa`](https://github.com/kubb-labs/plugins/commit/e7670fadf2a822c71299ad9a827fd4226eaae55b), [`9de6534`](https://github.com/kubb-labs/plugins/commit/9de653476daefd588633ec4b12551c72b8c88965), [`eeefb2b`](https://github.com/kubb-labs/plugins/commit/eeefb2beb38ffe294bea771907baea026d2879b3)]:
  - @kubb/plugin-client@5.0.0-beta.25
  - @kubb/plugin-ts@5.0.0-beta.25
  - @kubb/plugin-zod@5.0.0-beta.25

## 5.0.0-beta.22

### Patch Changes

- [`b528b32`](https://github.com/kubb-labs/plugins/commit/b528b3226d796a6aab5f1f6d45b575921da1341b) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - sync between core with same version

- Updated dependencies [[`b528b32`](https://github.com/kubb-labs/plugins/commit/b528b3226d796a6aab5f1f6d45b575921da1341b)]:
  - @kubb/plugin-client@5.0.0-beta.22
  - @kubb/plugin-ts@5.0.0-beta.22
  - @kubb/plugin-zod@5.0.0-beta.22

## 5.0.0-beta.15

### Patch Changes

- [#163](https://github.com/kubb-labs/plugins/pull/163) [`234a4d7`](https://github.com/kubb-labs/plugins/commit/234a4d7c9dccb1f756447e8d70d4a5bec4dcf72f) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Align plugin release flow with the beta.12 core dependency update and run E2E CI against all schemas by default except isolated heavy schemas.

- Updated dependencies [[`234a4d7`](https://github.com/kubb-labs/plugins/commit/234a4d7c9dccb1f756447e8d70d4a5bec4dcf72f)]:
  - @kubb/plugin-client@5.0.0-beta.15
  - @kubb/plugin-ts@5.0.0-beta.15
  - @kubb/plugin-zod@5.0.0-beta.15

## 5.0.0-beta.10

### Patch Changes

- Updated dependencies []:
  - @kubb/plugin-client@5.0.0-beta.10
  - @kubb/plugin-ts@5.0.0-beta.10
  - @kubb/plugin-zod@5.0.0-beta.10

## 5.0.0-beta.4

### Minor Changes

- [#125](https://github.com/kubb-labs/plugins/pull/125) [`3be0fc5`](https://github.com/kubb-labs/plugins/commit/3be0fc5fba830d6dae6f37e134f29e7191f480f2) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Each plugin package now ships an `extension.yaml` file describing its options and metadata.

  The file is self-contained — no `extends:` references — so third-party plugin authors can follow the same pattern in their own packages without access to this monorepo. Add `extension.yaml` to the `files` array in `package.json` and reference the unified schema for IDE validation:

  ```yaml
  $schema: "https://kubb.dev/schemas/extension.json"
  kind: plugin
  ```

  A `build:plugin-yaml` script resolves shared authoring templates and regenerates all ten files:

  ```bash
  pnpm build:plugin-yaml
  ```

### Patch Changes

- Updated dependencies [[`3be0fc5`](https://github.com/kubb-labs/plugins/commit/3be0fc5fba830d6dae6f37e134f29e7191f480f2)]:
  - @kubb/plugin-client@5.0.0-beta.4
  - @kubb/plugin-ts@5.0.0-beta.4
  - @kubb/plugin-zod@5.0.0-beta.4

## 5.0.0-beta.3

### Patch Changes

- Updated dependencies []:
  - @kubb/plugin-client@5.0.0-beta.3
  - @kubb/plugin-ts@5.0.0-beta.3
  - @kubb/plugin-zod@5.0.0-beta.3

## 5.0.0-alpha.56

### Patch Changes

- [#84](https://github.com/kubb-labs/plugins/pull/84) [`447ae38`](https://github.com/kubb-labs/plugins/commit/447ae380e5e5adf329c9d6d0fd5c460d88d8aee0) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Fix MCP not passing headers to fetch: the `RequestHandlerExtra` request object is now forwarded from the MCP tool callback to each generated handler function and subsequently to the fetch client call, allowing downstream clients to access headers (auth tokens, traceIds, etc.) from the MCP request context.

- Updated dependencies [[`436abe3`](https://github.com/kubb-labs/plugins/commit/436abe33c34c1db8078c8df3f96e8c93414c168b)]:
  - @kubb/plugin-client@5.0.0-alpha.56
  - @kubb/plugin-ts@5.0.0-alpha.56
  - @kubb/plugin-zod@5.0.0-alpha.56

## 5.0.0-alpha.55

### Patch Changes

- Updated dependencies [[`dd9c91a`](https://github.com/kubb-labs/plugins/commit/dd9c91a7c4deba02b6751e9965455674bfacc703)]:
  - @kubb/plugin-zod@5.0.0-alpha.55
  - @kubb/plugin-client@5.0.0-alpha.55
  - @kubb/plugin-ts@5.0.0-alpha.55

## 5.0.0-alpha.54

### Patch Changes

- Updated dependencies [[`825007c`](https://github.com/kubb-labs/plugins/commit/825007cf4e79baa63d846f59859587a233d5f1d4)]:
  - @kubb/plugin-zod@5.0.0-alpha.54
  - @kubb/plugin-client@5.0.0-alpha.54
  - @kubb/plugin-ts@5.0.0-alpha.54

## 5.0.0-alpha.52

### Minor Changes

- [#51](https://github.com/kubb-labs/plugins/pull/51) [`ad69c52`](https://github.com/kubb-labs/plugins/commit/ad69c52cfb1a1f0c15aecd771af9ae883d617133) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Remove unused `TContext` and `TResolvePathOptions` generics from each plugin's `PluginFactoryOptions` type alias.

  Follows the `@kubb/core` cleanup — all plugins previously passed `never, object` for those positions.

  **Before**

  ```ts
  type PluginZod = PluginFactoryOptions<
    "plugin-zod",
    Options,
    ResolvedOptions,
    never,
    object,
    ResolverZod
  >;
  ```

  **After**

  ```ts
  type PluginZod = PluginFactoryOptions<
    "plugin-zod",
    Options,
    ResolvedOptions,
    ResolverZod
  >;
  ```

### Patch Changes

- Updated dependencies [[`af627c2`](https://github.com/kubb-labs/plugins/commit/af627c21674dcf9afe2c3b9e74dee092cb9a2ae5), [`ad69c52`](https://github.com/kubb-labs/plugins/commit/ad69c52cfb1a1f0c15aecd771af9ae883d617133)]:
  - @kubb/plugin-client@5.0.0-alpha.52
  - @kubb/plugin-ts@5.0.0-alpha.52
  - @kubb/plugin-zod@5.0.0-alpha.52

## 5.0.0-alpha.35

### Patch Changes

- [#3025](https://github.com/kubb-labs/kubb/pull/3025) [`964067f`](https://github.com/kubb-labs/kubb/commit/964067ff1a21713af2b2c86795ff2ec59a12d0d6) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - ## Replace `pre`/`post` with `dependencies` on plugins

  The `pre` and `post` ordering fields on plugins have been replaced by a single `dependencies` array.

  `dependencies` declares which plugins the current plugin depends on (i.e. must run before it), which is equivalent to the old `pre` field but with a clearer name.

  ### Migration

  ```ts
  // Before
  pluginClient({
    pre: ["@kubb/plugin-ts", "@kubb/plugin-zod"],
  });

  // After
  pluginClient({
    dependencies: ["@kubb/plugin-ts", "@kubb/plugin-zod"],
  });
  ```

  All built-in plugins have been updated automatically. If you were setting `pre` or `post` directly on a custom plugin, update them to use `dependencies` instead.

- Updated dependencies [[`c8a1efb`](https://github.com/kubb-labs/kubb/commit/c8a1efb4e71d475eb383a93ebf02da9afda33f79), [`25db26e`](https://github.com/kubb-labs/kubb/commit/25db26eb9a91ab8e43f83df8b94a912067e46ce5), [`964067f`](https://github.com/kubb-labs/kubb/commit/964067ff1a21713af2b2c86795ff2ec59a12d0d6), [`e877926`](https://github.com/kubb-labs/kubb/commit/e877926222b4e3d56c7ccf07caaf7cdaba71bcd6)]:
  - @kubb/core@5.0.0-alpha.35
  - @kubb/plugin-client@5.0.0-alpha.35
  - @kubb/plugin-ts@5.0.0-alpha.35
  - @kubb/plugin-zod@5.0.0-alpha.35
  - @kubb/renderer-jsx@5.0.0-alpha.35

## 5.0.0-alpha.34

### Patch Changes

- [#2998](https://github.com/kubb-labs/kubb/pull/2998) [`f5099b8`](https://github.com/kubb-labs/kubb/commit/f5099b87f8cf603e70bc15568af2c80f2883661b) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Fix enum path parameters generating `z.string()` instead of `z.enum([...])` in `inputSchema`.

  When an OpenAPI path parameter had an `enum` constraint, `zodExprFromSchemaNode` fell through to `z.string()`. String enums now generate `z.enum(["VALUE1", "VALUE2"])` and number/boolean enums generate `z.union([z.literal(...)])`.

- Updated dependencies []:
  - @kubb/ast@5.0.0-alpha.34
  - @kubb/core@5.0.0-alpha.34
  - @kubb/plugin-client@5.0.0-alpha.34
  - @kubb/plugin-ts@5.0.0-alpha.34
  - @kubb/plugin-zod@5.0.0-alpha.34
  - @kubb/renderer-jsx@5.0.0-alpha.34

## 5.0.0-alpha.33

### Patch Changes

- Updated dependencies [[`3ac7d1f`](https://github.com/kubb-labs/kubb/commit/3ac7d1f9b75099bfe793e35152e5c322e65aa6ad), [`9e6a772`](https://github.com/kubb-labs/kubb/commit/9e6a772c7ca1ee54e931d2dbf0f2448f67707c0e)]:
  - @kubb/core@5.0.0-alpha.33
  - @kubb/renderer-jsx@5.0.0-alpha.33
  - @kubb/plugin-client@5.0.0-alpha.33
  - @kubb/plugin-ts@5.0.0-alpha.33
  - @kubb/plugin-zod@5.0.0-alpha.33
  - @kubb/ast@5.0.0-alpha.33

## 5.0.0-alpha.32

### Patch Changes

- Updated dependencies [[`6c6d2b6`](https://github.com/kubb-labs/kubb/commit/6c6d2b6b9f0dcfc7826cf9000ed835f274a6a7af)]:
  - @kubb/ast@5.0.0-alpha.32
  - @kubb/plugin-ts@5.0.0-alpha.32
  - @kubb/plugin-client@5.0.0-alpha.32
  - @kubb/core@5.0.0-alpha.32
  - @kubb/plugin-zod@5.0.0-alpha.32

## 5.0.0-alpha.31

### Patch Changes

- Updated dependencies [[`6c49d8d`](https://github.com/kubb-labs/kubb/commit/6c49d8d02d7c4bf5341fb6f0114f6aa2ee735e1e)]:
  - @kubb/core@5.0.0-alpha.31
  - @kubb/plugin-client@5.0.0-alpha.31
  - @kubb/plugin-ts@5.0.0-alpha.31
  - @kubb/plugin-zod@5.0.0-alpha.31
  - @kubb/ast@5.0.0-alpha.31

## 5.0.0-alpha.30

### Patch Changes

- [#2966](https://github.com/kubb-labs/kubb/pull/2966) [`e2bc27f`](https://github.com/kubb-labs/kubb/commit/e2bc27f59382a0771c08774933f70c5316636bd7) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - ## Generator API v5

  ### New: `GeneratorContext<TOptions>`

  Generators now receive a typed `this` context that guarantees `adapter` and `rootNode` are always present (non-optional). Use it instead of the raw `PluginContext` to avoid null-checks in every hook:

  ```ts
  import { defineGenerator } from "@kubb/core";

  export const myGenerator = defineGenerator<PluginMyPlugin>({
    async schema(node, options) {
      const { adapter, rootNode } = this; // always present, no null-check needed
      // ...
    },
  });
  ```

  ### New: `mergeGenerators(generators)`

  Combines an array of generators into a single merged generator. Each hook runs in sequence and applies its result via `applyHookResult`. Use this inside plugin hooks to delegate to all generators in the preset:

  ```ts
  import { mergeGenerators } from "@kubb/core";

  export const myPlugin = createPlugin<MyPlugin>((options) => {
    const generators = [generatorA, generatorB];
    const mergedGenerator = mergeGenerators(generators);

    return {
      name: "my-plugin",
      async schema(node, opts) {
        return mergedGenerator.schema?.call(this, node, opts);
      },
      async operation(node, opts) {
        return mergedGenerator.operation?.call(this, node, opts);
      },
      async operations(nodes, opts) {
        return mergedGenerator.operations?.call(this, nodes, opts);
      },
    };
  });
  ```

  ### New: `PluginRegistry` augmentation

  Every plugin now augments the global `Kubb.PluginRegistry` interface, enabling automatic typing for `getPlugin` and `requirePlugin`:

  ```ts
  const tsPlugin = context.getPlugin("plugin-ts");
  // tsPlugin is typed as PluginTs automatically
  ```

  ### New: `version` field on plugins

  All plugins now expose their package version via the `version` field on the plugin object. This is used in diagnostic messages and version-conflict detection.

  ### Renamed: `renderHookResult` → `applyHookResult`

  The internal helper for dispatching generator return values has been renamed to better reflect its purpose. If you were importing it directly, update your imports.

  ### Renamed: `install` → `buildStart`

  The per-plugin lifecycle hook `install` has been renamed to `buildStart`, aligning with Rollup/Vite naming conventions. Update all plugins that define this hook:

  ```ts
  // Before
  async install() {
    await this.getOas()
  }

  // After
  async buildStart() {
    await this.getOas()
  }
  ```

  ### New: `buildEnd` hook

  A new optional `buildEnd` hook is now available on every plugin. It is called once per plugin **after all files have been written to disk** — ideal for post-processing, copying assets, or generating summary reports:

  ```ts
  async buildEnd() {
    this.info('All files written, running post-processing...')
  }
  ```

- Updated dependencies [[`e2bc27f`](https://github.com/kubb-labs/kubb/commit/e2bc27f59382a0771c08774933f70c5316636bd7)]:
  - @kubb/core@5.0.0-alpha.30
  - @kubb/plugin-ts@5.0.0-alpha.30
  - @kubb/plugin-zod@5.0.0-alpha.30
  - @kubb/plugin-client@5.0.0-alpha.30
  - @kubb/ast@5.0.0-alpha.30

## 5.0.0-alpha.29

### Patch Changes

- Updated dependencies [[`62551ae`](https://github.com/kubb-labs/kubb/commit/62551ae7de327e2a502e5365d5bf56ecb8f21b47)]:
  - @kubb/plugin-client@5.0.0-alpha.29
  - @kubb/ast@5.0.0-alpha.29
  - @kubb/core@5.0.0-alpha.29
  - @kubb/plugin-ts@5.0.0-alpha.29
  - @kubb/plugin-zod@5.0.0-alpha.29

## 5.0.0-alpha.28

### Minor Changes

- [#2962](https://github.com/kubb-labs/kubb/pull/2962) [`d46e725`](https://github.com/kubb-labs/kubb/commit/d46e7255c2419e412ace2e090205d552a885c6ca) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - ### `@kubb/plugin-mcp`
  - Migrate to v5 architecture with `defineResolver`, `definePresets`, and `defineGenerator`.
  - Add `compatibilityPreset` support: `'default'` (v5) and `'kubbV4'` (legacy naming).
  - Add `McpHandler` component using `createOperationParams` from `@kubb/ast` for automatic v5/v4 param handling.
  - Add `Server` component for MCP tool registration with zod schema validation.
  - Add `serverGeneratorLegacy` for kubbV4 preset using grouped zod schemas (`QueryParamsSchema`, `HeaderParamsSchema`, `ResponseSchema`).
  - Default preset uses individual zod schemas (`createPetsPathUuidSchema`, `createPetsQueryOffsetSchema`) composed into `z.object()`.
  - Add `resolverMcp` with `Handler` suffix naming convention.
  - Add `resolver`, `transformer`, and `printer` options following the v5 plugin pattern.
  - **Breaking:** Replace `resolvers?: Array<ResolverMcp>` with `resolver?: Partial<ResolverMcp> & ThisType<ResolverMcp>`.
  - **Breaking:** Replace `transformers?: Array<Visitor>` with `transformer?: Visitor`.

  ### `@kubb/plugin-ts`
  - Fix `functionPrinter` struct property name quoting: property names with special characters (e.g. `X-EXAMPLE`) are now properly quoted in output.

### Patch Changes

- Updated dependencies [[`d46e725`](https://github.com/kubb-labs/kubb/commit/d46e7255c2419e412ace2e090205d552a885c6ca)]:
  - @kubb/plugin-ts@5.0.0-alpha.28
  - @kubb/plugin-client@5.0.0-alpha.28
  - @kubb/ast@5.0.0-alpha.28
  - @kubb/core@5.0.0-alpha.28
  - @kubb/plugin-zod@5.0.0-alpha.28

## 5.0.0-alpha.27

### Patch Changes

- Updated dependencies [[`795cac8`](https://github.com/kubb-labs/kubb/commit/795cac8edd6dd456185b7da90db9fd422c2b8330)]:
  - @kubb/core@5.0.0-alpha.27
  - @kubb/plugin-ts@5.0.0-alpha.27
  - @kubb/plugin-zod@5.0.0-alpha.27
  - @kubb/oas@5.0.0-alpha.27
  - @kubb/plugin-client@5.0.0-alpha.27
  - @kubb/plugin-oas@5.0.0-alpha.27

## 5.0.0-alpha.26

### Patch Changes

- Updated dependencies [[`035a2ea`](https://github.com/kubb-labs/kubb/commit/035a2ea01b88246c8642fead92029a955599f9cd)]:
  - @kubb/plugin-client@5.0.0-alpha.26
  - @kubb/core@5.0.0-alpha.26
  - @kubb/oas@5.0.0-alpha.26
  - @kubb/plugin-oas@5.0.0-alpha.26
  - @kubb/plugin-ts@5.0.0-alpha.26
  - @kubb/plugin-zod@5.0.0-alpha.26

## 5.0.0-alpha.25

### Patch Changes

- Updated dependencies [[`7b34c72`](https://github.com/kubb-labs/kubb/commit/7b34c7255a51ea0ababe6ca285703287193e702c), [`c1e9257`](https://github.com/kubb-labs/kubb/commit/c1e92572c04cf82ddb4df2e9e72e1551287a21fa)]:
  - @kubb/plugin-zod@5.0.0-alpha.25
  - @kubb/core@5.0.0-alpha.25
  - @kubb/plugin-ts@5.0.0-alpha.25
  - @kubb/plugin-client@5.0.0-alpha.25
  - @kubb/oas@5.0.0-alpha.25
  - @kubb/plugin-oas@5.0.0-alpha.25

## 5.0.0-alpha.24

### Patch Changes

- Updated dependencies []:
  - @kubb/core@5.0.0-alpha.24
  - @kubb/oas@5.0.0-alpha.24
  - @kubb/plugin-client@5.0.0-alpha.24
  - @kubb/plugin-oas@5.0.0-alpha.24
  - @kubb/plugin-ts@5.0.0-alpha.24
  - @kubb/plugin-zod@5.0.0-alpha.24

## 5.0.0-alpha.23

### Patch Changes

- Updated dependencies [[`8cfa19a`](https://github.com/kubb-labs/kubb/commit/8cfa19adbe681d4466f0ff97a8c14ece8ba1e5d8)]:
  - @kubb/plugin-ts@5.0.0-alpha.23
  - @kubb/core@5.0.0-alpha.23
  - @kubb/oas@5.0.0-alpha.23
  - @kubb/plugin-client@5.0.0-alpha.23
  - @kubb/plugin-zod@5.0.0-alpha.23
  - @kubb/plugin-oas@5.0.0-alpha.23

## 5.0.0-alpha.22

### Patch Changes

- Updated dependencies [[`1792af2`](https://github.com/kubb-labs/kubb/commit/1792af257ef9c7399959319aa4be28a46cb730fe)]:
  - @kubb/plugin-ts@5.0.0-alpha.22
  - @kubb/plugin-client@5.0.0-alpha.22
  - @kubb/plugin-zod@5.0.0-alpha.22
  - @kubb/core@5.0.0-alpha.22
  - @kubb/oas@5.0.0-alpha.22
  - @kubb/plugin-oas@5.0.0-alpha.22

## 5.0.0-alpha.21

### Patch Changes

- Updated dependencies []:
  - @kubb/core@5.0.0-alpha.21
  - @kubb/oas@5.0.0-alpha.21
  - @kubb/plugin-client@5.0.0-alpha.21
  - @kubb/plugin-oas@5.0.0-alpha.21
  - @kubb/plugin-ts@5.0.0-alpha.21
  - @kubb/plugin-zod@5.0.0-alpha.21

## 5.0.0-alpha.20

### Patch Changes

- Updated dependencies [[`f596e47`](https://github.com/kubb-labs/kubb/commit/f596e47e353c18ef11c4531acd12641c52c00435)]:
  - @kubb/core@5.0.0-alpha.20
  - @kubb/oas@5.0.0-alpha.20
  - @kubb/plugin-client@5.0.0-alpha.20
  - @kubb/plugin-oas@5.0.0-alpha.20
  - @kubb/plugin-ts@5.0.0-alpha.20
  - @kubb/plugin-zod@5.0.0-alpha.20

## 5.0.0-alpha.19

### Patch Changes

- Updated dependencies []:
  - @kubb/core@5.0.0-alpha.19
  - @kubb/oas@5.0.0-alpha.19
  - @kubb/plugin-client@5.0.0-alpha.19
  - @kubb/plugin-oas@5.0.0-alpha.19
  - @kubb/plugin-ts@5.0.0-alpha.19
  - @kubb/plugin-zod@5.0.0-alpha.19

## 5.0.0-alpha.18

### Patch Changes

- Updated dependencies [[`fa7f554`](https://github.com/kubb-labs/kubb/commit/fa7f55423e9d81773a2f168954bf682a866de65c)]:
  - @kubb/plugin-client@5.0.0-alpha.18
  - @kubb/plugin-oas@5.0.0-alpha.18
  - @kubb/plugin-ts@5.0.0-alpha.18
  - @kubb/core@5.0.0-alpha.18
  - @kubb/oas@5.0.0-alpha.18
  - @kubb/plugin-zod@5.0.0-alpha.18

## 5.0.0-alpha.17

### Patch Changes

- Updated dependencies []:
  - @kubb/core@5.0.0-alpha.17
  - @kubb/oas@5.0.0-alpha.17
  - @kubb/plugin-ts@5.0.0-alpha.17
  - @kubb/plugin-client@5.0.0-alpha.17
  - @kubb/plugin-oas@5.0.0-alpha.17
  - @kubb/plugin-zod@5.0.0-alpha.17

## 5.0.0-alpha.16

### Patch Changes

- Updated dependencies [[`f1b2596`](https://github.com/kubb-labs/kubb/commit/f1b2596a36adc73de6aeea6f0843786dfc630426)]:
  - @kubb/plugin-ts@5.0.0-alpha.16
  - @kubb/plugin-client@5.0.0-alpha.16
  - @kubb/plugin-zod@5.0.0-alpha.16
  - @kubb/core@5.0.0-alpha.16
  - @kubb/oas@5.0.0-alpha.16
  - @kubb/plugin-oas@5.0.0-alpha.16

## 5.0.0-alpha.15

### Patch Changes

- Updated dependencies []:
  - @kubb/core@5.0.0-alpha.15
  - @kubb/oas@5.0.0-alpha.15
  - @kubb/plugin-client@5.0.0-alpha.15
  - @kubb/plugin-oas@5.0.0-alpha.15
  - @kubb/plugin-ts@5.0.0-alpha.15
  - @kubb/plugin-zod@5.0.0-alpha.15

## 5.0.0-alpha.14

### Patch Changes

- Updated dependencies [[`591977c`](https://github.com/kubb-labs/kubb/commit/591977c5c2f167736d6e43126ed0387a1e5e0ce5)]:
  - @kubb/core@5.0.0-alpha.14
  - @kubb/plugin-ts@5.0.0-alpha.14
  - @kubb/oas@5.0.0-alpha.14
  - @kubb/plugin-client@5.0.0-alpha.14
  - @kubb/plugin-oas@5.0.0-alpha.14
  - @kubb/plugin-zod@5.0.0-alpha.14

## 5.0.0-alpha.13

### Patch Changes

- Updated dependencies [[`975717e`](https://github.com/kubb-labs/kubb/commit/975717e2c8cf8d33f5d9d641be4bb164fd36f423), [`b5d83e2`](https://github.com/kubb-labs/kubb/commit/b5d83e2a2c8a325f953b9e353bdb1b730dbdd305), [`33d0507`](https://github.com/kubb-labs/kubb/commit/33d050714fa24ae6aa1042a8aa12fc4925399007), [`ed7a2cb`](https://github.com/kubb-labs/kubb/commit/ed7a2cb6d008e880a955e8fefc1eee6859c06240), [`68a3bdd`](https://github.com/kubb-labs/kubb/commit/68a3bdd2eb85b3bd78e278ba9e4a0b691b580c7e), [`9968516`](https://github.com/kubb-labs/kubb/commit/99685169dc85f4f23fae6af0872dbd2f13e8012e)]:
  - @kubb/plugin-ts@5.0.0-alpha.13
  - @kubb/core@5.0.0-alpha.13
  - @kubb/oas@5.0.0-alpha.13
  - @kubb/plugin-client@5.0.0-alpha.13
  - @kubb/plugin-zod@5.0.0-alpha.13
  - @kubb/plugin-oas@5.0.0-alpha.13

## 5.0.0-alpha.12

### Patch Changes

- Updated dependencies [[`d97bf00`](https://github.com/kubb-labs/kubb/commit/d97bf007db4fa3a5341463dab0e891afeaf82fff), [`ebe0774`](https://github.com/kubb-labs/kubb/commit/ebe07749c5e3ef16d0e53daf11dd3954a582216b), [`f4105fe`](https://github.com/kubb-labs/kubb/commit/f4105fe44e46ec2846e665fd6079290e6d6ce6c6), [`ebe0774`](https://github.com/kubb-labs/kubb/commit/ebe07749c5e3ef16d0e53daf11dd3954a582216b)]:
  - @kubb/plugin-ts@5.0.0-alpha.12
  - @kubb/plugin-client@5.0.0-alpha.12
  - @kubb/plugin-zod@5.0.0-alpha.12
  - @kubb/core@5.0.0-alpha.12
  - @kubb/oas@5.0.0-alpha.12
  - @kubb/plugin-oas@5.0.0-alpha.12

## 5.0.0-alpha.11

### Patch Changes

- Updated dependencies [[`4cfcb62`](https://github.com/kubb-labs/kubb/commit/4cfcb6290ffa11c93f19345c93906af65ec18339), [`4cfcb62`](https://github.com/kubb-labs/kubb/commit/4cfcb6290ffa11c93f19345c93906af65ec18339)]:
  - @kubb/core@5.0.0-alpha.11
  - @kubb/plugin-oas@5.0.0-alpha.11
  - @kubb/oas@5.0.0-alpha.11
  - @kubb/plugin-ts@5.0.0-alpha.11
  - @kubb/plugin-client@5.0.0-alpha.11
  - @kubb/plugin-zod@5.0.0-alpha.11

## 5.0.0-alpha.10

### Patch Changes

- Updated dependencies []:
  - @kubb/core@5.0.0-alpha.10
  - @kubb/oas@5.0.0-alpha.10
  - @kubb/plugin-ts@5.0.0-alpha.10
  - @kubb/plugin-client@5.0.0-alpha.10
  - @kubb/plugin-oas@5.0.0-alpha.10
  - @kubb/plugin-zod@5.0.0-alpha.10

## 5.0.0-alpha.9

### Patch Changes

- Updated dependencies [[`617aa20`](https://github.com/kubb-labs/kubb/commit/617aa203608222aba2a022ab998ced16f4216ed3)]:
  - @kubb/core@5.0.0-alpha.9
  - @kubb/oas@5.0.0-alpha.9
  - @kubb/plugin-client@5.0.0-alpha.9
  - @kubb/plugin-oas@5.0.0-alpha.9
  - @kubb/plugin-ts@5.0.0-alpha.9
  - @kubb/plugin-zod@5.0.0-alpha.9

## 5.0.0-alpha.8

### Major Changes

- [#2803](https://github.com/kubb-labs/kubb/pull/2803) [`978b0d1`](https://github.com/kubb-labs/kubb/commit/978b0d1cb6fadcb08dd71b65bbd1542a02a7a517) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Rename factory functions from `define*` to `create*` to align with Vite ecosystem conventions.

  **Rule:** `define*` is reserved for pure identity/type helpers (no runtime behavior — removing the call doesn't change the value, only loses type inference). `create*` is used for functions that produce instances, wrap builders, or apply logic.

  `defineConfig` is unchanged — it is a pure identity helper.

  | Before            | After             |
  | ----------------- | ----------------- |
  | `definePlugin`    | `createPlugin`    |
  | `defineAdapter`   | `createAdapter`   |
  | `defineGenerator` | `createGenerator` |
  | `defineLogger`    | `createLogger`    |
  | `defineStorage`   | `createStorage`   |

### Patch Changes

- Updated dependencies [[`978b0d1`](https://github.com/kubb-labs/kubb/commit/978b0d1cb6fadcb08dd71b65bbd1542a02a7a517)]:
  - @kubb/core@5.0.0-alpha.8
  - @kubb/plugin-oas@5.0.0-alpha.8
  - @kubb/plugin-ts@5.0.0-alpha.8
  - @kubb/plugin-client@5.0.0-alpha.8
  - @kubb/plugin-zod@5.0.0-alpha.8
  - @kubb/oas@5.0.0-alpha.8

## 5.0.0-alpha.7

### Major Changes

- [#2794](https://github.com/kubb-labs/kubb/pull/2794) [`bf5f955`](https://github.com/kubb-labs/kubb/commit/bf5f955ec285badb0d99a3950b0a880622180ec2) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Rename `PluginManager` to `PluginDriver`. The `pluginManager` property in context/meta is now `driver`. The hook `usePluginManager` is now `usePluginDriver`.

### Patch Changes

- Updated dependencies [[`bf5f955`](https://github.com/kubb-labs/kubb/commit/bf5f955ec285badb0d99a3950b0a880622180ec2)]:
  - @kubb/core@5.0.0-alpha.7
  - @kubb/plugin-oas@5.0.0-alpha.7
  - @kubb/plugin-ts@5.0.0-alpha.7
  - @kubb/plugin-client@5.0.0-alpha.7
  - @kubb/plugin-zod@5.0.0-alpha.7
  - @kubb/oas@5.0.0-alpha.7

## 5.0.0-alpha.6

### Patch Changes

- Updated dependencies [[`0aba63f`](https://github.com/kubb-labs/kubb/commit/0aba63f026e7e93bf1057b7a3740bbfe9ee07c00)]:
  - @kubb/plugin-ts@5.0.0-alpha.6
  - @kubb/plugin-client@5.0.0-alpha.6
  - @kubb/plugin-zod@5.0.0-alpha.6
  - @kubb/core@5.0.0-alpha.6
  - @kubb/oas@5.0.0-alpha.6
  - @kubb/plugin-oas@5.0.0-alpha.6

## 5.0.0-alpha.5

### Patch Changes

- Updated dependencies [[`f373168`](https://github.com/kubb-labs/kubb/commit/f37316845ef3f8753a93e04a946b333ee4e42073)]:
  - @kubb/core@5.0.0-alpha.5
  - @kubb/plugin-ts@5.0.0-alpha.5
  - @kubb/oas@5.0.0-alpha.5
  - @kubb/plugin-client@5.0.0-alpha.5
  - @kubb/plugin-oas@5.0.0-alpha.5
  - @kubb/plugin-zod@5.0.0-alpha.5

## 5.0.0-alpha.4

### Patch Changes

- Updated dependencies [[`64e3d85`](https://github.com/kubb-labs/kubb/commit/64e3d8583c50c073bfe8945dcda5e700d262d9d9)]:
  - @kubb/plugin-oas@5.0.0-alpha.4
  - @kubb/plugin-ts@5.0.0-alpha.4
  - @kubb/core@5.0.0-alpha.4
  - @kubb/oas@5.0.0-alpha.4
  - @kubb/plugin-client@5.0.0-alpha.4
  - @kubb/plugin-zod@5.0.0-alpha.4

## 5.0.0-alpha.3

### Patch Changes

- Updated dependencies [[`827b444`](https://github.com/kubb-labs/kubb/commit/827b444e7c7c62d36ba9eaed7303ed0d18a7fa45)]:
  - @kubb/plugin-ts@5.0.0-alpha.3
  - @kubb/core@5.0.0-alpha.3
  - @kubb/oas@5.0.0-alpha.3
  - @kubb/plugin-client@5.0.0-alpha.3
  - @kubb/plugin-zod@5.0.0-alpha.3
  - @kubb/plugin-oas@5.0.0-alpha.3

## 5.0.0-alpha.2

### Major Changes

- [#2768](https://github.com/kubb-labs/kubb/pull/2768) [`4f5a4ef`](https://github.com/kubb-labs/kubb/commit/4f5a4efc6169e9e5ef2cfd629a8ed7ff5714727b) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Remove `pluginKey` in favour of `pluginName`. Each plugin can now only be used once, adding duplicate plugins throws an error.

### Patch Changes

- Updated dependencies [[`4f5a4ef`](https://github.com/kubb-labs/kubb/commit/4f5a4efc6169e9e5ef2cfd629a8ed7ff5714727b)]:
  - @kubb/core@5.0.0-alpha.2
  - @kubb/plugin-oas@5.0.0-alpha.2
  - @kubb/plugin-ts@5.0.0-alpha.2
  - @kubb/plugin-client@5.0.0-alpha.2
  - @kubb/plugin-zod@5.0.0-alpha.2
  - @kubb/oas@5.0.0-alpha.2

## 5.0.0-alpha.1

### Major Changes

- [`a4682ea`](https://github.com/kubb-labs/kubb/commit/a4682ea8896ef7d9ccae1b6e9abd6ed7bcaac073) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - The minimum required Node.js version is 22.

### Patch Changes

- Updated dependencies [[`a4682ea`](https://github.com/kubb-labs/kubb/commit/a4682ea8896ef7d9ccae1b6e9abd6ed7bcaac073)]:
  - @kubb/plugin-client@5.0.0-alpha.1
  - @kubb/plugin-oas@5.0.0-alpha.1
  - @kubb/plugin-zod@5.0.0-alpha.1
  - @kubb/plugin-ts@5.0.0-alpha.1
  - @kubb/core@5.0.0-alpha.1
  - @kubb/oas@5.0.0-alpha.1

## 5.0.0-alpha.0

### Patch Changes

- Updated dependencies [[`2d474ef`](https://github.com/kubb-labs/kubb/commit/2d474ef68bad43e13ec34e762194048cd2a194d9)]:
  - @kubb/core@5.0.0-alpha.0
  - @kubb/oas@5.0.0-alpha.0
  - @kubb/plugin-client@5.0.0-alpha.0
  - @kubb/plugin-oas@5.0.0-alpha.0
  - @kubb/plugin-ts@5.0.0-alpha.0
  - @kubb/plugin-zod@5.0.0-alpha.0

## 4.36.1

### Patch Changes

- Updated dependencies [[`a4ac8d2`](https://github.com/kubb-labs/kubb/commit/a4ac8d28d4b17f5275c3fbe3dedfff0ac3bc3357)]:
  - @kubb/core@4.36.1
  - @kubb/oas@4.36.1
  - @kubb/plugin-client@4.36.1
  - @kubb/plugin-oas@4.36.1
  - @kubb/plugin-ts@4.36.1
  - @kubb/plugin-zod@4.36.1

## 4.36.0

### Patch Changes

- Updated dependencies [[`4e06911`](https://github.com/kubb-labs/kubb/commit/4e0691160314ff3b9054fbba3efcaeb4c9b10008)]:
  - @kubb/core@4.36.0
  - @kubb/oas@4.36.0
  - @kubb/plugin-client@4.36.0
  - @kubb/plugin-oas@4.36.0
  - @kubb/plugin-ts@4.36.0
  - @kubb/plugin-zod@4.36.0

## 4.35.1

### Patch Changes

- Updated dependencies [[`e24fe13`](https://github.com/kubb-labs/kubb/commit/e24fe135aba61f56d3ff218735cb616a627027b9)]:
  - @kubb/plugin-ts@4.35.1
  - @kubb/plugin-client@4.35.1
  - @kubb/plugin-zod@4.35.1
  - @kubb/core@4.35.1
  - @kubb/oas@4.35.1
  - @kubb/plugin-oas@4.35.1

## 4.35.0

### Patch Changes

- Updated dependencies [[`4d8616c`](https://github.com/kubb-labs/kubb/commit/4d8616c7120acea5deb057a2e8fd337bdab6b26d)]:
  - @kubb/plugin-client@4.35.0
  - @kubb/core@4.35.0
  - @kubb/oas@4.35.0
  - @kubb/plugin-oas@4.35.0
  - @kubb/plugin-ts@4.35.0
  - @kubb/plugin-zod@4.35.0

## 4.34.0

### Patch Changes

- Updated dependencies []:
  - @kubb/oas@4.34.0
  - @kubb/plugin-client@4.34.0
  - @kubb/plugin-oas@4.34.0
  - @kubb/plugin-ts@4.34.0
  - @kubb/plugin-zod@4.34.0
  - @kubb/core@4.34.0

## 4.33.5

### Patch Changes

- Updated dependencies [[`45b7dc7`](https://github.com/kubb-labs/kubb/commit/45b7dc7939621a29a342af36db34c5f9bee3e155)]:
  - @kubb/oas@4.33.5
  - @kubb/plugin-oas@4.33.5
  - @kubb/plugin-client@4.33.5
  - @kubb/plugin-ts@4.33.5
  - @kubb/plugin-zod@4.33.5
  - @kubb/core@4.33.5

## 4.33.4

### Patch Changes

- Updated dependencies [[`711e6a3`](https://github.com/kubb-labs/kubb/commit/711e6a3fe4373dba49c2dbdbfaa38e0c1bce0d8c)]:
  - @kubb/core@4.33.4
  - @kubb/oas@4.33.4
  - @kubb/plugin-client@4.33.4
  - @kubb/plugin-oas@4.33.4
  - @kubb/plugin-ts@4.33.4
  - @kubb/plugin-zod@4.33.4

## 4.33.3

### Patch Changes

- Updated dependencies [[`b221f9a`](https://github.com/kubb-labs/kubb/commit/b221f9aac6b94a725b86349cf8e8009c337ed23b)]:
  - @kubb/oas@4.33.3
  - @kubb/plugin-client@4.33.3
  - @kubb/plugin-oas@4.33.3
  - @kubb/plugin-ts@4.33.3
  - @kubb/plugin-zod@4.33.3
  - @kubb/core@4.33.3

## 4.33.2

### Patch Changes

- Updated dependencies [[`29f6d1b`](https://github.com/kubb-labs/kubb/commit/29f6d1b31e0bc922eb5b0ba8e5149241a3a37305)]:
  - @kubb/plugin-oas@4.33.2
  - @kubb/plugin-zod@4.33.2
  - @kubb/plugin-client@4.33.2
  - @kubb/plugin-ts@4.33.2
  - @kubb/core@4.33.2
  - @kubb/oas@4.33.2

## 4.33.1

### Patch Changes

- Updated dependencies [[`856fa78`](https://github.com/kubb-labs/kubb/commit/856fa78e5cc281ef3cd1b66a38e2deeca69f1b6e)]:
  - @kubb/core@4.33.1
  - @kubb/oas@4.33.1
  - @kubb/plugin-oas@4.33.1
  - @kubb/plugin-client@4.33.1
  - @kubb/plugin-ts@4.33.1
  - @kubb/plugin-zod@4.33.1

## 4.33.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.33.0
  - @kubb/oas@4.33.0
  - @kubb/plugin-client@4.33.0
  - @kubb/plugin-oas@4.33.0
  - @kubb/plugin-ts@4.33.0
  - @kubb/plugin-zod@4.33.0

## 4.32.4

### Patch Changes

- Updated dependencies [[`1f51e6e`](https://github.com/kubb-labs/kubb/commit/1f51e6e4cd8982653c4992929eae009cee1ec2db)]:
  - @kubb/plugin-zod@4.32.4
  - @kubb/plugin-client@4.32.4
  - @kubb/core@4.32.4
  - @kubb/oas@4.32.4
  - @kubb/plugin-oas@4.32.4
  - @kubb/plugin-ts@4.32.4

## 4.32.3

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.32.3
  - @kubb/oas@4.32.3
  - @kubb/plugin-client@4.32.3
  - @kubb/plugin-oas@4.32.3
  - @kubb/plugin-ts@4.32.3
  - @kubb/plugin-zod@4.32.3

## 4.32.2

### Patch Changes

- Updated dependencies [[`7346e64`](https://github.com/kubb-labs/kubb/commit/7346e645de64892abe4fcd06310639333dbd1f9f)]:
  - @kubb/core@4.32.2
  - @kubb/oas@4.32.2
  - @kubb/plugin-client@4.32.2
  - @kubb/plugin-oas@4.32.2
  - @kubb/plugin-ts@4.32.2
  - @kubb/plugin-zod@4.32.2

## 4.32.1

### Patch Changes

- Updated dependencies [[`df6dba6`](https://github.com/kubb-labs/kubb/commit/df6dba6f16ba62fed751baebb6dec74baae6cae1)]:
  - @kubb/plugin-client@4.32.1
  - @kubb/core@4.32.1
  - @kubb/oas@4.32.1
  - @kubb/plugin-oas@4.32.1
  - @kubb/plugin-ts@4.32.1
  - @kubb/plugin-zod@4.32.1

## 4.32.0

### Patch Changes

- Updated dependencies [[`95c4649`](https://github.com/kubb-labs/kubb/commit/95c4649eb01a0348424c779046d8312a6af09d51)]:
  - @kubb/plugin-oas@4.32.0
  - @kubb/plugin-client@4.32.0
  - @kubb/plugin-ts@4.32.0
  - @kubb/plugin-zod@4.32.0
  - @kubb/core@4.32.0
  - @kubb/oas@4.32.0

## 4.31.6

### Patch Changes

- Updated dependencies [[`4e151b7`](https://github.com/kubb-labs/kubb/commit/4e151b7182393d870d51fe5377610e05928ccf14), [`edfa8fe`](https://github.com/kubb-labs/kubb/commit/edfa8fe016c0ea5bbc4535c68e4cfaeb3a29217b)]:
  - @kubb/plugin-ts@4.31.6
  - @kubb/plugin-zod@4.31.6
  - @kubb/plugin-client@4.31.6
  - @kubb/core@4.31.6
  - @kubb/oas@4.31.6
  - @kubb/plugin-oas@4.31.6

## 4.31.5

### Patch Changes

- Updated dependencies [[`b81718f`](https://github.com/kubb-labs/kubb/commit/b81718fa2410275227fe07345ffa41a4811e0459)]:
  - @kubb/plugin-oas@4.31.5
  - @kubb/plugin-client@4.31.5
  - @kubb/plugin-ts@4.31.5
  - @kubb/plugin-zod@4.31.5
  - @kubb/core@4.31.5
  - @kubb/oas@4.31.5

## 4.31.4

### Patch Changes

- Updated dependencies [[`0a873dd`](https://github.com/kubb-labs/kubb/commit/0a873dd1b37d42167288970aa8f819e8ad5a78a5)]:
  - @kubb/plugin-oas@4.31.4
  - @kubb/plugin-client@4.31.4
  - @kubb/plugin-ts@4.31.4
  - @kubb/plugin-zod@4.31.4
  - @kubb/core@4.31.4
  - @kubb/oas@4.31.4

## 4.31.3

### Patch Changes

- [`78925b7`](https://github.com/kubb-labs/kubb/commit/78925b7f302b35312995b7ec6fd119d696275e7a) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Use `registerTool` helper and include `structuredContent` in MCP handler responses

- Updated dependencies []:
  - @kubb/core@4.31.3
  - @kubb/oas@4.31.3
  - @kubb/plugin-client@4.31.3
  - @kubb/plugin-oas@4.31.3
  - @kubb/plugin-ts@4.31.3
  - @kubb/plugin-zod@4.31.3

## 4.31.2

### Patch Changes

- Updated dependencies [[`adadc15`](https://github.com/kubb-labs/kubb/commit/adadc1536f0fafdc15f095a8e42cc92977c2139a)]:
  - @kubb/oas@4.31.2
  - @kubb/plugin-client@4.31.2
  - @kubb/plugin-oas@4.31.2
  - @kubb/plugin-ts@4.31.2
  - @kubb/plugin-zod@4.31.2
  - @kubb/core@4.31.2

## 4.31.1

### Patch Changes

- Updated dependencies [[`fa031c4`](https://github.com/kubb-labs/kubb/commit/fa031c4f8d0a259478848f251c771f5aa834610d)]:
  - @kubb/plugin-client@4.31.1
  - @kubb/core@4.31.1
  - @kubb/oas@4.31.1
  - @kubb/plugin-oas@4.31.1
  - @kubb/plugin-ts@4.31.1
  - @kubb/plugin-zod@4.31.1

## 4.31.0

### Patch Changes

- Updated dependencies [[`43626b4`](https://github.com/kubb-labs/kubb/commit/43626b4a7d5e8420bc441b90de06a804a5c9efe1)]:
  - @kubb/plugin-oas@4.31.0
  - @kubb/plugin-client@4.31.0
  - @kubb/plugin-ts@4.31.0
  - @kubb/plugin-zod@4.31.0
  - @kubb/core@4.31.0
  - @kubb/oas@4.31.0

## 4.30.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.30.0
  - @kubb/oas@4.30.0
  - @kubb/plugin-client@4.30.0
  - @kubb/plugin-oas@4.30.0
  - @kubb/plugin-ts@4.30.0
  - @kubb/plugin-zod@4.30.0

## 4.29.1

### Patch Changes

- Updated dependencies [[`d6fc5ad`](https://github.com/kubb-labs/kubb/commit/d6fc5ad851195330367ebecbc08e19ec1658ca40)]:
  - @kubb/plugin-ts@4.29.1
  - @kubb/plugin-client@4.29.1
  - @kubb/plugin-zod@4.29.1
  - @kubb/core@4.29.1
  - @kubb/oas@4.29.1
  - @kubb/plugin-oas@4.29.1

## 4.29.0

### Patch Changes

- [#2577](https://github.com/kubb-labs/kubb/pull/2577) [`9529af1`](https://github.com/kubb-labs/kubb/commit/9529af145dca72991fe7d2a529c717cce0993ea3) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Total size change: -6.7 MB

- Updated dependencies [[`bb6f915`](https://github.com/kubb-labs/kubb/commit/bb6f915e0c0d59a417b0891b8bcf7bbfe9db502e), [`9529af1`](https://github.com/kubb-labs/kubb/commit/9529af145dca72991fe7d2a529c717cce0993ea3)]:
  - @kubb/plugin-client@4.29.0
  - @kubb/plugin-oas@4.29.0
  - @kubb/plugin-ts@4.29.0
  - @kubb/core@4.29.0
  - @kubb/oas@4.29.0
  - @kubb/plugin-zod@4.29.0

## 4.28.1

### Patch Changes

- Updated dependencies [[`e9ddbf0`](https://github.com/kubb-labs/kubb/commit/e9ddbf05d3c29ac293a0402e7678c6c02beef3f8)]:
  - @kubb/oas@4.28.1
  - @kubb/plugin-client@4.28.1
  - @kubb/plugin-oas@4.28.1
  - @kubb/plugin-ts@4.28.1
  - @kubb/plugin-zod@4.28.1
  - @kubb/core@4.28.1

## 4.28.0

### Patch Changes

- Updated dependencies [[`d34236f`](https://github.com/kubb-labs/kubb/commit/d34236fae3f46f6f0a79b7792898421f5f5a4d9d)]:
  - @kubb/plugin-oas@4.28.0
  - @kubb/plugin-ts@4.28.0
  - @kubb/plugin-client@4.28.0
  - @kubb/plugin-zod@4.28.0
  - @kubb/core@4.28.0
  - @kubb/oas@4.28.0

## 4.27.4

### Patch Changes

- Updated dependencies [[`3690d37`](https://github.com/kubb-labs/kubb/commit/3690d3778cb8e2c48841bf13b73c82c165242ef4)]:
  - @kubb/core@4.27.4
  - @kubb/plugin-client@4.27.4
  - @kubb/plugin-zod@4.27.4
  - @kubb/oas@4.27.4
  - @kubb/plugin-oas@4.27.4
  - @kubb/plugin-ts@4.27.4

## 4.27.3

### Patch Changes

- Updated dependencies [[`2213d3a`](https://github.com/kubb-labs/kubb/commit/2213d3ab14894c96e1f69780ea480b5e3457bf6b), [`669b07e`](https://github.com/kubb-labs/kubb/commit/669b07ed66f0dded0e028a3dfe1c5e669c53e53a)]:
  - @kubb/plugin-client@4.27.3
  - @kubb/oas@4.27.3
  - @kubb/plugin-oas@4.27.3
  - @kubb/plugin-ts@4.27.3
  - @kubb/plugin-zod@4.27.3
  - @kubb/core@4.27.3

## 4.27.2

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.27.2
  - @kubb/oas@4.27.2
  - @kubb/plugin-client@4.27.2
  - @kubb/plugin-oas@4.27.2
  - @kubb/plugin-ts@4.27.2
  - @kubb/plugin-zod@4.27.2

## 4.27.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.27.1
  - @kubb/oas@4.27.1
  - @kubb/plugin-client@4.27.1
  - @kubb/plugin-oas@4.27.1
  - @kubb/plugin-ts@4.27.1
  - @kubb/plugin-zod@4.27.1

## 4.27.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.27.0
  - @kubb/oas@4.27.0
  - @kubb/plugin-client@4.27.0
  - @kubb/plugin-oas@4.27.0
  - @kubb/plugin-ts@4.27.0
  - @kubb/plugin-zod@4.27.0

## 4.26.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.26.1
  - @kubb/oas@4.26.1
  - @kubb/plugin-client@4.26.1
  - @kubb/plugin-oas@4.26.1
  - @kubb/plugin-ts@4.26.1
  - @kubb/plugin-zod@4.26.1

## 4.26.0

### Minor Changes

- [#2515](https://github.com/kubb-labs/kubb/pull/2515) [`9f6cd4f`](https://github.com/kubb-labs/kubb/commit/9f6cd4f15262b57dad80c8d80843b5f840a000b1) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Export `startServer` function and remove auto-invocation to allow users to implement their own server logic and support more transports.

### Patch Changes

- Updated dependencies [[`af65cde`](https://github.com/kubb-labs/kubb/commit/af65cde624a74e68bfb5dede871e8d9324499114), [`0f8235c`](https://github.com/kubb-labs/kubb/commit/0f8235cf1dfbcdd436172752c9f94ff953732f3f)]:
  - @kubb/plugin-zod@4.26.0
  - @kubb/plugin-client@4.26.0
  - @kubb/core@4.26.0
  - @kubb/oas@4.26.0
  - @kubb/plugin-oas@4.26.0
  - @kubb/plugin-ts@4.26.0

## 4.25.2

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.25.2
  - @kubb/oas@4.25.2
  - @kubb/plugin-client@4.25.2
  - @kubb/plugin-oas@4.25.2
  - @kubb/plugin-ts@4.25.2
  - @kubb/plugin-zod@4.25.2

## 4.25.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.25.1
  - @kubb/oas@4.25.1
  - @kubb/plugin-client@4.25.1
  - @kubb/plugin-oas@4.25.1
  - @kubb/plugin-ts@4.25.1
  - @kubb/plugin-zod@4.25.1

## 4.25.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.25.0
  - @kubb/oas@4.25.0
  - @kubb/plugin-client@4.25.0
  - @kubb/plugin-oas@4.25.0
  - @kubb/plugin-ts@4.25.0
  - @kubb/plugin-zod@4.25.0

## 4.24.1

### Patch Changes

- Updated dependencies [[`d260f9a`](https://github.com/kubb-labs/kubb/commit/d260f9a1f8a24ad2f1999fbdb918bb47cca078d0)]:
  - @kubb/plugin-ts@4.24.1
  - @kubb/plugin-client@4.24.1
  - @kubb/plugin-zod@4.24.1
  - @kubb/core@4.24.1
  - @kubb/oas@4.24.1
  - @kubb/plugin-oas@4.24.1

## 4.24.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.24.0
  - @kubb/oas@4.24.0
  - @kubb/plugin-client@4.24.0
  - @kubb/plugin-oas@4.24.0
  - @kubb/plugin-ts@4.24.0
  - @kubb/plugin-zod@4.24.0

## 4.23.0

### Patch Changes

- Updated dependencies [[`d4f746b`](https://github.com/kubb-labs/kubb/commit/d4f746b33334e6d8379d45ccc09658c8d210e5cc)]:
  - @kubb/plugin-client@4.23.0
  - @kubb/core@4.23.0
  - @kubb/oas@4.23.0
  - @kubb/plugin-oas@4.23.0
  - @kubb/plugin-ts@4.23.0
  - @kubb/plugin-zod@4.23.0

## 4.22.3

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.22.3
  - @kubb/oas@4.22.3
  - @kubb/plugin-client@4.22.3
  - @kubb/plugin-oas@4.22.3
  - @kubb/plugin-ts@4.22.3
  - @kubb/plugin-zod@4.22.3

## 4.22.2

### Patch Changes

- Updated dependencies [[`b8630dc`](https://github.com/kubb-labs/kubb/commit/b8630dcb3fa43665305ca8b782a43307325dfe34)]:
  - @kubb/plugin-ts@4.22.2
  - @kubb/plugin-client@4.22.2
  - @kubb/plugin-zod@4.22.2
  - @kubb/core@4.22.2
  - @kubb/oas@4.22.2
  - @kubb/plugin-oas@4.22.2

## 4.22.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.22.1
  - @kubb/oas@4.22.1
  - @kubb/plugin-client@4.22.1
  - @kubb/plugin-oas@4.22.1
  - @kubb/plugin-ts@4.22.1
  - @kubb/plugin-zod@4.22.1

## 4.22.0

### Patch Changes

- [#2450](https://github.com/kubb-labs/kubb/pull/2450) [`5e475f2`](https://github.com/kubb-labs/kubb/commit/5e475f222fdfcebf74a7c82c5adf84cf970dcb8c) Thanks [@icholy](https://github.com/icholy)! - Externalize all @kubb/\* packages in tsdown configs to prevent duplicate type declarations across packages, fixing TypeScript type incompatibility errors caused by inlined #private class fields.

- Updated dependencies [[`68640ed`](https://github.com/kubb-labs/kubb/commit/68640ed75f1501887f913181bd268f3ea22a3fd4), [`5e475f2`](https://github.com/kubb-labs/kubb/commit/5e475f222fdfcebf74a7c82c5adf84cf970dcb8c), [`4486916`](https://github.com/kubb-labs/kubb/commit/4486916b59257c0ca41a440b0d09f6f7742c1b5e)]:
  - @kubb/plugin-client@4.22.0
  - @kubb/oas@4.22.0
  - @kubb/plugin-oas@4.22.0
  - @kubb/plugin-ts@4.22.0
  - @kubb/plugin-zod@4.22.0
  - @kubb/core@4.22.0

## 4.21.2

### Patch Changes

- Updated dependencies [[`99097c8`](https://github.com/kubb-labs/kubb/commit/99097c8d8401d2135dece43877223029137cf6a6)]:
  - @kubb/plugin-ts@4.21.2
  - @kubb/core@4.21.2
  - @kubb/plugin-client@4.21.2
  - @kubb/plugin-zod@4.21.2
  - @kubb/oas@4.21.2
  - @kubb/plugin-oas@4.21.2

## 4.21.1

### Patch Changes

- Updated dependencies [[`9592063`](https://github.com/kubb-labs/kubb/commit/9592063f91bf9d3604b508774fb7d8f7a09e47f8)]:
  - @kubb/plugin-ts@4.21.1
  - @kubb/plugin-client@4.21.1
  - @kubb/plugin-zod@4.21.1
  - @kubb/core@4.21.1
  - @kubb/oas@4.21.1
  - @kubb/plugin-oas@4.21.1

## 4.21.0

### Minor Changes

- [#2323](https://github.com/kubb-labs/kubb/pull/2323) [`f1dd5bf`](https://github.com/kubb-labs/kubb/commit/f1dd5bf3aebb73ba4c13ee48aea24284a62b2bd3) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Add `paramsCasing` support to transform parameter names to camelCase across all generated code.

  **New Feature: Parameter Casing**

  You can now transform API parameter names (path, query, and header parameters) to developer-friendly camelCase while maintaining full compatibility with your OpenAPI specification.

  **What's Changed:**
  - Added `paramsCasing: 'camelcase'` option to transform parameter names
  - Supported in: `@kubb/plugin-ts`, `@kubb/plugin-client`, all query plugins (`react-query`, `swr`, `solid-query`, `svelte-query`, `vue-query`), `@kubb/plugin-faker`, and `@kubb/plugin-mcp`
  - Client plugins automatically map camelCase names back to original API parameter names in HTTP requests
  - Only affects pathParams, queryParams, and headerParams (request/response bodies remain unchanged)

  **Usage:**

  ```typescript
  import { defineConfig } from "@kubb/core";
  import { pluginTs } from "@kubb/plugin-ts";
  import { pluginClient } from "@kubb/plugin-client";

  export default defineConfig({
    plugins: [
      pluginTs({
        paramsCasing: "camelcase", // Transform types
      }),
      pluginClient({
        paramsCasing: "camelcase", // Transform client code
      }),
    ],
  });
  ```

  **Example:**

  ```typescript
  // Before (original API naming)
  export async function findPet(pet_id: string) { ... }

  // After (with paramsCasing: 'camelcase')
  export async function findPet(petId: string) {
    const pet_id = petId // Automatically mapped
    ...
  }
  ```

  See the [Parameter Casing guide](/guide/parameter-casing) for detailed documentation.

### Patch Changes

- Updated dependencies [[`f1dd5bf`](https://github.com/kubb-labs/kubb/commit/f1dd5bf3aebb73ba4c13ee48aea24284a62b2bd3)]:
  - @kubb/plugin-ts@4.21.0
  - @kubb/plugin-client@4.21.0
  - @kubb/plugin-oas@4.21.0
  - @kubb/plugin-zod@4.21.0
  - @kubb/core@4.21.0
  - @kubb/oas@4.21.0

## 4.20.5

### Patch Changes

- [#2427](https://github.com/kubb-labs/kubb/pull/2427) [`f2bab83`](https://github.com/kubb-labs/kubb/commit/f2bab8381871b7c73e3b1bcdd29ddc5fd24fe2e6) Thanks [@icholy](https://github.com/icholy)! - Externalize @kubb/core in tsdown configs to prevent duplicate type declarations across packages, fixing TypeScript type incompatibility errors when using custom generators with pluginClient.

- Updated dependencies [[`f2bab83`](https://github.com/kubb-labs/kubb/commit/f2bab8381871b7c73e3b1bcdd29ddc5fd24fe2e6)]:
  - @kubb/oas@4.20.5
  - @kubb/plugin-client@4.20.5
  - @kubb/plugin-oas@4.20.5
  - @kubb/plugin-ts@4.20.5
  - @kubb/plugin-zod@4.20.5
  - @kubb/core@4.20.5

## 4.20.4

### Patch Changes

- Updated dependencies [[`fb12978`](https://github.com/kubb-labs/kubb/commit/fb12978c20634f3f849e62fbcae409000a6f90de)]:
  - @kubb/plugin-ts@4.20.4
  - @kubb/plugin-client@4.20.4
  - @kubb/plugin-zod@4.20.4
  - @kubb/core@4.20.4
  - @kubb/oas@4.20.4
  - @kubb/plugin-oas@4.20.4

## 4.20.3

### Patch Changes

- Updated dependencies [[`be8e4e6`](https://github.com/kubb-labs/kubb/commit/be8e4e68d57b161d592e646657dfddc52c2de133)]:
  - @kubb/plugin-zod@4.20.3
  - @kubb/plugin-client@4.20.3
  - @kubb/core@4.20.3
  - @kubb/oas@4.20.3
  - @kubb/plugin-oas@4.20.3
  - @kubb/plugin-ts@4.20.3

## 4.20.2

### Patch Changes

- Updated dependencies [[`6006dc3`](https://github.com/kubb-labs/kubb/commit/6006dc335d62dd9c1254bd31ecc90a5ccb70a116)]:
  - @kubb/core@4.20.2
  - @kubb/oas@4.20.2
  - @kubb/plugin-client@4.20.2
  - @kubb/plugin-oas@4.20.2
  - @kubb/plugin-ts@4.20.2
  - @kubb/plugin-zod@4.20.2

## 4.20.1

### Patch Changes

- [#2402](https://github.com/kubb-labs/kubb/pull/2402) [`5c50613`](https://github.com/kubb-labs/kubb/commit/5c50613504f05d1f5484dea4969182ecc7961cfb) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Fix: Preserve line breaks in JSDoc descriptions from OpenAPI schemas

  Line breaks (`\r\n`, `\n`) in OpenAPI schema descriptions were being stripped from generated JSDoc comments, collapsing multi-line documentation into single lines without whitespace separation. This fix preserves the line breaks so that multi-line descriptions are properly formatted in the generated code.

  **Before:**

  ```typescript
  /**
   * @description Creates a pet in the store.This is an arbitrary description...
   */
  ```

  **After:**

  ```typescript
  /**
   * @description Creates a pet in the store.
   * This is an arbitrary description...
   */
  ```

- Updated dependencies [[`5c50613`](https://github.com/kubb-labs/kubb/commit/5c50613504f05d1f5484dea4969182ecc7961cfb)]:
  - @kubb/core@4.20.1
  - @kubb/plugin-oas@4.20.1
  - @kubb/oas@4.20.1
  - @kubb/plugin-client@4.20.1
  - @kubb/plugin-ts@4.20.1
  - @kubb/plugin-zod@4.20.1

## 4.20.0

### Patch Changes

- [#2387](https://github.com/kubb-labs/kubb/pull/2387) [`d3acf9e`](https://github.com/kubb-labs/kubb/commit/d3acf9eb2b018595fadcc06380ef8419d8bbea8f) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Update fabric

- Updated dependencies [[`d3acf9e`](https://github.com/kubb-labs/kubb/commit/d3acf9eb2b018595fadcc06380ef8419d8bbea8f)]:
  - @kubb/plugin-client@4.20.0
  - @kubb/plugin-oas@4.20.0
  - @kubb/plugin-zod@4.20.0
  - @kubb/plugin-ts@4.20.0
  - @kubb/core@4.20.0
  - @kubb/oas@4.20.0

## 4.19.2

### Patch Changes

- Updated dependencies [[`d91549b`](https://github.com/kubb-labs/kubb/commit/d91549b906e0c8e37e1e06795e13daeaa9562682)]:
  - @kubb/plugin-zod@4.19.2
  - @kubb/plugin-client@4.19.2
  - @kubb/core@4.19.2
  - @kubb/oas@4.19.2
  - @kubb/plugin-oas@4.19.2
  - @kubb/plugin-ts@4.19.2

## 4.19.1

### Patch Changes

- Updated dependencies [[`996f3b2`](https://github.com/kubb-labs/kubb/commit/996f3b26d8c2167c3e77b734275c204e6c1b159c)]:
  - @kubb/plugin-oas@4.19.1
  - @kubb/plugin-ts@4.19.1
  - @kubb/plugin-zod@4.19.1
  - @kubb/plugin-client@4.19.1
  - @kubb/core@4.19.1
  - @kubb/oas@4.19.1

## 4.19.0

### Patch Changes

- Updated dependencies [[`f5f2dc1`](https://github.com/kubb-labs/kubb/commit/f5f2dc162556c9c1c05d97e29cb28cf79830885a)]:
  - @kubb/oas@4.19.0
  - @kubb/plugin-oas@4.19.0
  - @kubb/plugin-client@4.19.0
  - @kubb/plugin-ts@4.19.0
  - @kubb/plugin-zod@4.19.0
  - @kubb/core@4.19.0

## 4.18.5

### Patch Changes

- Updated dependencies [[`ea23bb4`](https://github.com/kubb-labs/kubb/commit/ea23bb4a2f5a121dd1192b05f0f4cf4207093dc5), [`77ec2fd`](https://github.com/kubb-labs/kubb/commit/77ec2fd6a2e9346667b70f31dc714ea1925fa68d)]:
  - @kubb/plugin-oas@4.18.5
  - @kubb/plugin-zod@4.18.5
  - @kubb/oas@4.18.5
  - @kubb/plugin-client@4.18.5
  - @kubb/plugin-ts@4.18.5
  - @kubb/core@4.18.5

## 4.18.4

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.18.4
  - @kubb/oas@4.18.4
  - @kubb/plugin-client@4.18.4
  - @kubb/plugin-oas@4.18.4
  - @kubb/plugin-ts@4.18.4
  - @kubb/plugin-zod@4.18.4

## 4.18.3

### Patch Changes

- Updated dependencies [[`5bff082`](https://github.com/kubb-labs/kubb/commit/5bff08211fb72476a6b8ffc703430ae4c6603ba5)]:
  - @kubb/plugin-ts@4.18.3
  - @kubb/plugin-client@4.18.3
  - @kubb/plugin-zod@4.18.3
  - @kubb/core@4.18.3
  - @kubb/oas@4.18.3
  - @kubb/plugin-oas@4.18.3

## 4.18.2

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.18.2
  - @kubb/oas@4.18.2
  - @kubb/plugin-client@4.18.2
  - @kubb/plugin-oas@4.18.2
  - @kubb/plugin-ts@4.18.2
  - @kubb/plugin-zod@4.18.2

## 4.18.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.18.1
  - @kubb/oas@4.18.1
  - @kubb/plugin-client@4.18.1
  - @kubb/plugin-oas@4.18.1
  - @kubb/plugin-ts@4.18.1
  - @kubb/plugin-zod@4.18.1

## 4.18.0

### Minor Changes

- [#2333](https://github.com/kubb-labs/kubb/pull/2333) [`ec5893e`](https://github.com/kubb-labs/kubb/commit/ec5893e056c67df2035f72492f54d1affc8f67b6) Thanks [@sebastianvitterso](https://github.com/sebastianvitterso)! - Add support for `staticClient` clients, with static methods (removing the need to instantiate the client before use)

### Patch Changes

- [#2330](https://github.com/kubb-labs/kubb/pull/2330) [`25f657a`](https://github.com/kubb-labs/kubb/commit/25f657a0076277a24932c2b977db252bd9108d77) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Updated tsdown from 0.18.4 to 0.19.0 and added `keepNames: true` in `outputOptions` for all packages. This preserves function and class names in bundled output, fixing React DevTools component inspection and improving debugging experience.

- Updated dependencies [[`ec5893e`](https://github.com/kubb-labs/kubb/commit/ec5893e056c67df2035f72492f54d1affc8f67b6), [`25f657a`](https://github.com/kubb-labs/kubb/commit/25f657a0076277a24932c2b977db252bd9108d77)]:
  - @kubb/plugin-client@4.18.0
  - @kubb/plugin-oas@4.18.0
  - @kubb/plugin-zod@4.18.0
  - @kubb/plugin-ts@4.18.0
  - @kubb/core@4.18.0
  - @kubb/oas@4.18.0

## 4.17.2

### Patch Changes

- Updated dependencies [[`6e15459`](https://github.com/kubb-labs/kubb/commit/6e154590905c6f626abbab35aa506054cccdf5b9)]:
  - @kubb/oas@4.17.2
  - @kubb/plugin-client@4.17.2
  - @kubb/plugin-oas@4.17.2
  - @kubb/plugin-ts@4.17.2
  - @kubb/plugin-zod@4.17.2
  - @kubb/core@4.17.2

## 4.17.1

### Patch Changes

- Updated dependencies [[`6d7c8c0`](https://github.com/kubb-labs/kubb/commit/6d7c8c0a21bb88ca4df8637bec5bb017350a8b68)]:
  - @kubb/plugin-oas@4.17.1
  - @kubb/plugin-client@4.17.1
  - @kubb/plugin-ts@4.17.1
  - @kubb/plugin-zod@4.17.1
  - @kubb/core@4.17.1
  - @kubb/oas@4.17.1

## 4.17.0

### Patch Changes

- Updated dependencies [[`18d1a2b`](https://github.com/kubb-labs/kubb/commit/18d1a2b46eb519cdfe9eaa8ef9f4507688975f78), [`e6da3a1`](https://github.com/kubb-labs/kubb/commit/e6da3a18b75a1391b28637e10893d575782b8edb)]:
  - @kubb/core@4.17.0
  - @kubb/plugin-ts@4.17.0
  - @kubb/oas@4.17.0
  - @kubb/plugin-client@4.17.0
  - @kubb/plugin-oas@4.17.0
  - @kubb/plugin-zod@4.17.0

## 4.16.0

### Patch Changes

- Updated dependencies [[`f263a20`](https://github.com/kubb-labs/kubb/commit/f263a20f1f31707092e2aca8058875e979b8517e)]:
  - @kubb/core@4.16.0
  - @kubb/oas@4.16.0
  - @kubb/plugin-client@4.16.0
  - @kubb/plugin-oas@4.16.0
  - @kubb/plugin-ts@4.16.0
  - @kubb/plugin-zod@4.16.0

## 4.15.2

### Patch Changes

- Updated dependencies [[`dfcc4fc`](https://github.com/kubb-labs/kubb/commit/dfcc4fcaf80e31fad6e10d886fdf87b79fc2817d)]:
  - @kubb/oas@4.15.2
  - @kubb/plugin-client@4.15.2
  - @kubb/plugin-oas@4.15.2
  - @kubb/plugin-ts@4.15.2
  - @kubb/plugin-zod@4.15.2
  - @kubb/core@4.15.2

## 4.15.1

### Patch Changes

- Updated dependencies [[`349a274`](https://github.com/kubb-labs/kubb/commit/349a274390adef38404be4fea5b54376f8d1dc40)]:
  - @kubb/plugin-ts@4.15.1
  - @kubb/plugin-client@4.15.1
  - @kubb/plugin-zod@4.15.1
  - @kubb/core@4.15.1
  - @kubb/oas@4.15.1
  - @kubb/plugin-oas@4.15.1

## 4.15.0

### Patch Changes

- Updated dependencies [[`4990f00`](https://github.com/kubb-labs/kubb/commit/4990f00c90367a5f1550ad4d54e76343a9c4d625)]:
  - @kubb/core@4.15.0
  - @kubb/plugin-oas@4.15.0
  - @kubb/oas@4.15.0
  - @kubb/plugin-client@4.15.0
  - @kubb/plugin-ts@4.15.0
  - @kubb/plugin-zod@4.15.0

## 4.14.1

### Patch Changes

- Updated dependencies [[`f66a49e`](https://github.com/kubb-labs/kubb/commit/f66a49e1a44726a1e8887df59ce531474deec7db)]:
  - @kubb/plugin-ts@4.14.1
  - @kubb/plugin-client@4.14.1
  - @kubb/plugin-zod@4.14.1
  - @kubb/core@4.14.1
  - @kubb/oas@4.14.1
  - @kubb/plugin-oas@4.14.1

## 4.14.0

### Patch Changes

- Updated dependencies [[`092f78c`](https://github.com/kubb-labs/kubb/commit/092f78c7a8432468c57599b156e9b23337a38120)]:
  - @kubb/plugin-ts@4.14.0
  - @kubb/plugin-client@4.14.0
  - @kubb/plugin-zod@4.14.0
  - @kubb/core@4.14.0
  - @kubb/oas@4.14.0
  - @kubb/plugin-oas@4.14.0

## 4.13.1

### Patch Changes

- Updated dependencies [[`77f931f`](https://github.com/kubb-labs/kubb/commit/77f931ff4cfa03fec479e8337b5913acf3c58384)]:
  - @kubb/plugin-ts@4.13.1
  - @kubb/plugin-client@4.13.1
  - @kubb/plugin-zod@4.13.1
  - @kubb/core@4.13.1
  - @kubb/oas@4.13.1
  - @kubb/plugin-oas@4.13.1

## 4.13.0

### Patch Changes

- Updated dependencies [[`f5a38da`](https://github.com/kubb-labs/kubb/commit/f5a38da05b1bf0553ee523628f7bedcccda51d94)]:
  - @kubb/core@4.13.0
  - @kubb/oas@4.13.0
  - @kubb/plugin-client@4.13.0
  - @kubb/plugin-oas@4.13.0
  - @kubb/plugin-ts@4.13.0
  - @kubb/plugin-zod@4.13.0

## 4.12.15

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.12.15
  - @kubb/oas@4.12.15
  - @kubb/plugin-client@4.12.15
  - @kubb/plugin-oas@4.12.15
  - @kubb/plugin-ts@4.12.15
  - @kubb/plugin-zod@4.12.15

## 4.12.14

### Patch Changes

- Updated dependencies [[`be95612`](https://github.com/kubb-labs/kubb/commit/be95612729e185d2919f9bf36093a809acb28924)]:
  - @kubb/plugin-zod@4.12.14
  - @kubb/plugin-client@4.12.14
  - @kubb/core@4.12.14
  - @kubb/oas@4.12.14
  - @kubb/plugin-oas@4.12.14
  - @kubb/plugin-ts@4.12.14

## 4.12.13

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.12.13
  - @kubb/oas@4.12.13
  - @kubb/plugin-client@4.12.13
  - @kubb/plugin-oas@4.12.13
  - @kubb/plugin-ts@4.12.13
  - @kubb/plugin-zod@4.12.13

## 4.12.12

### Patch Changes

- Updated dependencies [[`6e15732`](https://github.com/kubb-labs/kubb/commit/6e15732cc3fe4a5ae386d3dcff41527930755cb6)]:
  - @kubb/oas@4.12.12
  - @kubb/plugin-client@4.12.12
  - @kubb/plugin-oas@4.12.12
  - @kubb/plugin-ts@4.12.12
  - @kubb/plugin-zod@4.12.12
  - @kubb/core@4.12.12

## 4.12.11

### Patch Changes

- Updated dependencies [[`5334e6e`](https://github.com/kubb-labs/kubb/commit/5334e6eca99856560c46a774e30f4ddc085edbb0)]:
  - @kubb/oas@4.12.11
  - @kubb/plugin-oas@4.12.11
  - @kubb/plugin-client@4.12.11
  - @kubb/plugin-ts@4.12.11
  - @kubb/plugin-zod@4.12.11
  - @kubb/core@4.12.11

## 4.12.10

### Patch Changes

- Updated dependencies [[`028f5e8`](https://github.com/kubb-labs/kubb/commit/028f5e85109853b1d9a10a17ff0d2d269975b61f)]:
  - @kubb/plugin-ts@4.12.10
  - @kubb/plugin-client@4.12.10
  - @kubb/plugin-zod@4.12.10
  - @kubb/core@4.12.10
  - @kubb/oas@4.12.10
  - @kubb/plugin-oas@4.12.10

## 4.12.9

### Patch Changes

- Updated dependencies [[`600053d`](https://github.com/kubb-labs/kubb/commit/600053db677dc6ba1b60c822d6dad23d6da60507)]:
  - @kubb/plugin-oas@4.12.9
  - @kubb/plugin-zod@4.12.9
  - @kubb/plugin-ts@4.12.9
  - @kubb/oas@4.12.9
  - @kubb/plugin-client@4.12.9
  - @kubb/core@4.12.9

## 4.12.8

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.12.8
  - @kubb/oas@4.12.8
  - @kubb/plugin-client@4.12.8
  - @kubb/plugin-oas@4.12.8
  - @kubb/plugin-ts@4.12.8
  - @kubb/plugin-zod@4.12.8

## 4.12.7

### Patch Changes

- Updated dependencies [[`03babc8`](https://github.com/kubb-labs/kubb/commit/03babc84964e3d5e8a294f8be55cdee55f106ecc), [`93b39af`](https://github.com/kubb-labs/kubb/commit/93b39aff5874c959ce1d3ee1203ea378a0cbe663)]:
  - @kubb/plugin-oas@4.12.7
  - @kubb/core@4.12.7
  - @kubb/plugin-client@4.12.7
  - @kubb/plugin-ts@4.12.7
  - @kubb/plugin-zod@4.12.7
  - @kubb/oas@4.12.7

## 4.12.6

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.12.6
  - @kubb/oas@4.12.6
  - @kubb/plugin-client@4.12.6
  - @kubb/plugin-oas@4.12.6
  - @kubb/plugin-ts@4.12.6
  - @kubb/plugin-zod@4.12.6

## 4.12.5

### Patch Changes

- Updated dependencies [[`f6e6ee4`](https://github.com/kubb-labs/kubb/commit/f6e6ee4402c4a0e5b130414ea45210432e20afcc)]:
  - @kubb/oas@4.12.5
  - @kubb/core@4.12.5
  - @kubb/plugin-client@4.12.5
  - @kubb/plugin-oas@4.12.5
  - @kubb/plugin-ts@4.12.5
  - @kubb/plugin-zod@4.12.5

## 4.12.4

### Patch Changes

- Updated dependencies [[`329cf02`](https://github.com/kubb-labs/kubb/commit/329cf021783d3e0f00d2597eefbc20487bfb5e23)]:
  - @kubb/plugin-oas@4.12.4
  - @kubb/plugin-client@4.12.4
  - @kubb/plugin-ts@4.12.4
  - @kubb/plugin-zod@4.12.4
  - @kubb/core@4.12.4
  - @kubb/oas@4.12.4

## 4.12.3

### Patch Changes

- Updated dependencies [[`a7608e0`](https://github.com/kubb-labs/kubb/commit/a7608e00af70dcc22e61eec80d931a94010cde5e)]:
  - @kubb/oas@4.12.3
  - @kubb/plugin-ts@4.12.3
  - @kubb/plugin-zod@4.12.3
  - @kubb/plugin-client@4.12.3
  - @kubb/plugin-oas@4.12.3
  - @kubb/core@4.12.3

## 4.12.2

### Patch Changes

- Updated dependencies [[`ca14aff`](https://github.com/kubb-labs/kubb/commit/ca14affdd51c47eba4012c64ae0528e284012536)]:
  - @kubb/plugin-ts@4.12.2
  - @kubb/plugin-client@4.12.2
  - @kubb/plugin-zod@4.12.2
  - @kubb/core@4.12.2
  - @kubb/oas@4.12.2
  - @kubb/plugin-oas@4.12.2

## 4.12.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.12.1
  - @kubb/oas@4.12.1
  - @kubb/plugin-client@4.12.1
  - @kubb/plugin-oas@4.12.1
  - @kubb/plugin-ts@4.12.1
  - @kubb/plugin-zod@4.12.1

## 4.12.0

### Patch Changes

- Updated dependencies [[`d16354c`](https://github.com/kubb-labs/kubb/commit/d16354c4afc013e47b0ee935efdc526d908de617)]:
  - @kubb/core@4.12.0
  - @kubb/plugin-client@4.12.0
  - @kubb/plugin-oas@4.12.0
  - @kubb/plugin-ts@4.12.0
  - @kubb/plugin-zod@4.12.0
  - @kubb/oas@4.12.0

## 4.11.3

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.11.3
  - @kubb/oas@4.11.3
  - @kubb/plugin-client@4.11.3
  - @kubb/plugin-oas@4.11.3
  - @kubb/plugin-ts@4.11.3
  - @kubb/plugin-zod@4.11.3

## 4.11.2

### Patch Changes

- Updated dependencies [[`c71df32`](https://github.com/kubb-labs/kubb/commit/c71df32646b1f4dbfa0d94f2f411ae114e0afac4)]:
  - @kubb/oas@4.11.2
  - @kubb/plugin-client@4.11.2
  - @kubb/plugin-oas@4.11.2
  - @kubb/plugin-ts@4.11.2
  - @kubb/plugin-zod@4.11.2
  - @kubb/core@4.11.2

## 4.11.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.11.1
  - @kubb/oas@4.11.1
  - @kubb/plugin-client@4.11.1
  - @kubb/plugin-oas@4.11.1
  - @kubb/plugin-ts@4.11.1
  - @kubb/plugin-zod@4.11.1

## 4.11.0

### Patch Changes

- Updated dependencies [[`51dd885`](https://github.com/kubb-labs/kubb/commit/51dd88584f6f4f5c572808a62aaf4c197701dbf5), [`c3c210f`](https://github.com/kubb-labs/kubb/commit/c3c210f48c061a0612aec0a8f3f12cd9e50f4483)]:
  - @kubb/plugin-ts@4.11.0
  - @kubb/plugin-oas@4.11.0
  - @kubb/plugin-zod@4.11.0
  - @kubb/plugin-client@4.11.0
  - @kubb/core@4.11.0
  - @kubb/oas@4.11.0

## 4.10.1

### Patch Changes

- Updated dependencies [[`6b6c13d`](https://github.com/kubb-labs/kubb/commit/6b6c13d2cf23ad056879cb66cd81995fd43def11)]:
  - @kubb/core@4.10.1
  - @kubb/plugin-client@4.10.1
  - @kubb/plugin-oas@4.10.1
  - @kubb/plugin-ts@4.10.1
  - @kubb/plugin-zod@4.10.1
  - @kubb/oas@4.10.1

## 4.10.0

### Patch Changes

- Updated dependencies [[`b240890`](https://github.com/kubb-labs/kubb/commit/b240890fde6369293a076f031a826ed7455c73e8)]:
  - @kubb/plugin-ts@4.10.0
  - @kubb/plugin-client@4.10.0
  - @kubb/plugin-zod@4.10.0
  - @kubb/core@4.10.0
  - @kubb/oas@4.10.0
  - @kubb/plugin-oas@4.10.0

## 4.9.4

### Patch Changes

- Updated dependencies [[`e71c931`](https://github.com/kubb-labs/kubb/commit/e71c93110ec19e830a068e8343aaf7cfcce5ef0c)]:
  - @kubb/plugin-oas@4.9.4
  - @kubb/plugin-client@4.9.4
  - @kubb/plugin-ts@4.9.4
  - @kubb/plugin-zod@4.9.4
  - @kubb/core@4.9.4
  - @kubb/oas@4.9.4

## 4.9.3

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.9.3
  - @kubb/oas@4.9.3
  - @kubb/plugin-client@4.9.3
  - @kubb/plugin-oas@4.9.3
  - @kubb/plugin-ts@4.9.3
  - @kubb/plugin-zod@4.9.3

## 4.9.2

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.9.2
  - @kubb/oas@4.9.2
  - @kubb/plugin-client@4.9.2
  - @kubb/plugin-oas@4.9.2
  - @kubb/plugin-ts@4.9.2
  - @kubb/plugin-zod@4.9.2

## 4.9.1

### Patch Changes

- [#2125](https://github.com/kubb-labs/kubb/pull/2125) [`d883c78`](https://github.com/kubb-labs/kubb/commit/d883c78d3937bcc697ba4b2663943314b51bc735) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Fix `clientType: 'class'` compatibility with query plugins. Query plugins now automatically detect when `clientType: 'class'` is set and generate their own inline function-based clients, allowing class-based clients and query hooks to coexist in the same configuration.

  Previously, when `@kubb/plugin-client` was configured with `clientType: 'class'`, query plugins would fail because they expected function-based clients but attempted to import non-existent class methods.

- Updated dependencies []:
  - @kubb/core@4.9.1
  - @kubb/oas@4.9.1
  - @kubb/plugin-client@4.9.1
  - @kubb/plugin-oas@4.9.1
  - @kubb/plugin-ts@4.9.1
  - @kubb/plugin-zod@4.9.1

## 4.9.0

### Patch Changes

- Updated dependencies [[`a1dc709`](https://github.com/kubb-labs/kubb/commit/a1dc709f21c29ad02260c7ac20058010afd1cb09)]:
  - @kubb/plugin-client@4.9.0
  - @kubb/core@4.9.0
  - @kubb/oas@4.9.0
  - @kubb/plugin-oas@4.9.0
  - @kubb/plugin-ts@4.9.0
  - @kubb/plugin-zod@4.9.0

## 4.8.1

### Patch Changes

- Updated dependencies [[`b5a7a43`](https://github.com/kubb-labs/kubb/commit/b5a7a43d444d5b5f678a5b0231f8edfb4aa5d5b9)]:
  - @kubb/plugin-client@4.8.1
  - @kubb/core@4.8.1
  - @kubb/oas@4.8.1
  - @kubb/plugin-oas@4.8.1
  - @kubb/plugin-ts@4.8.1
  - @kubb/plugin-zod@4.8.1

## 4.8.0

### Patch Changes

- Updated dependencies [[`9753dfa`](https://github.com/kubb-labs/kubb/commit/9753dfafc8f468d1f865896ed50341a577dfefba)]:
  - @kubb/plugin-zod@4.8.0
  - @kubb/plugin-client@4.8.0
  - @kubb/core@4.8.0
  - @kubb/oas@4.8.0
  - @kubb/plugin-oas@4.8.0
  - @kubb/plugin-ts@4.8.0

## 4.7.4

### Patch Changes

- Updated dependencies [[`93e6d79`](https://github.com/kubb-labs/kubb/commit/93e6d797f96562c0eda33f2dd99183e861b40934)]:
  - @kubb/plugin-oas@4.7.4
  - @kubb/plugin-client@4.7.4
  - @kubb/plugin-ts@4.7.4
  - @kubb/plugin-zod@4.7.4
  - @kubb/core@4.7.4
  - @kubb/oas@4.7.4

## 4.7.3

### Patch Changes

- Updated dependencies [[`187ae52`](https://github.com/kubb-labs/kubb/commit/187ae520791b14962712a23671952c3ca9c92f3f)]:
  - @kubb/plugin-oas@4.7.3
  - @kubb/plugin-client@4.7.3
  - @kubb/plugin-ts@4.7.3
  - @kubb/plugin-zod@4.7.3
  - @kubb/core@4.7.3
  - @kubb/oas@4.7.3

## 4.7.2

### Patch Changes

- Updated dependencies [[`8ed9785`](https://github.com/kubb-labs/kubb/commit/8ed978504ba3f43494186ea9fc434c082c6558bc)]:
  - @kubb/plugin-client@4.7.2
  - @kubb/core@4.7.2
  - @kubb/oas@4.7.2
  - @kubb/plugin-oas@4.7.2
  - @kubb/plugin-ts@4.7.2
  - @kubb/plugin-zod@4.7.2

## 4.7.1

### Patch Changes

- [#2069](https://github.com/kubb-labs/kubb/pull/2069) [`fc25294`](https://github.com/kubb-labs/kubb/commit/fc252940ff249bbd201cd620761af56598b021ef) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Fix `buildFormData` being generated twice in config.ts when using query plugins together with plugin-client. Query plugins now check for plugin-client presence before adding config.ts file to avoid duplication.

- Updated dependencies []:
  - @kubb/core@4.7.1
  - @kubb/oas@4.7.1
  - @kubb/plugin-client@4.7.1
  - @kubb/plugin-oas@4.7.1
  - @kubb/plugin-ts@4.7.1
  - @kubb/plugin-zod@4.7.1

## 4.7.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.7.0
  - @kubb/oas@4.7.0
  - @kubb/plugin-client@4.7.0
  - @kubb/plugin-oas@4.7.0
  - @kubb/plugin-ts@4.7.0
  - @kubb/plugin-zod@4.7.0

## 4.6.4

### Patch Changes

- Updated dependencies [[`a4de0c4`](https://github.com/kubb-labs/kubb/commit/a4de0c4613fdaff3562e63ba591bc3de465b6e46)]:
  - @kubb/plugin-zod@4.6.4
  - @kubb/plugin-client@4.6.4
  - @kubb/core@4.6.4
  - @kubb/oas@4.6.4
  - @kubb/plugin-oas@4.6.4
  - @kubb/plugin-ts@4.6.4

## 4.6.3

### Patch Changes

- Updated dependencies [[`28bc3f0`](https://github.com/kubb-labs/kubb/commit/28bc3f09198de696ee660a79f03841ad987b0c1d)]:
  - @kubb/plugin-client@4.6.3
  - @kubb/core@4.6.3
  - @kubb/oas@4.6.3
  - @kubb/plugin-oas@4.6.3
  - @kubb/plugin-ts@4.6.3
  - @kubb/plugin-zod@4.6.3

## 4.6.2

### Patch Changes

- Updated dependencies [[`7c8da51`](https://github.com/kubb-labs/kubb/commit/7c8da51bc7ecea48a839aeaff5d3a9848b5c568f)]:
  - @kubb/plugin-zod@4.6.2
  - @kubb/plugin-client@4.6.2
  - @kubb/core@4.6.2
  - @kubb/oas@4.6.2
  - @kubb/plugin-oas@4.6.2
  - @kubb/plugin-ts@4.6.2

## 4.6.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.6.1
  - @kubb/oas@4.6.1
  - @kubb/plugin-client@4.6.1
  - @kubb/plugin-oas@4.6.1
  - @kubb/plugin-ts@4.6.1
  - @kubb/plugin-zod@4.6.1

## 4.6.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.6.0
  - @kubb/oas@4.6.0
  - @kubb/plugin-client@4.6.0
  - @kubb/plugin-oas@4.6.0
  - @kubb/plugin-ts@4.6.0
  - @kubb/plugin-zod@4.6.0

## 4.5.15

### Patch Changes

- Updated dependencies [[`ea8c36e`](https://github.com/kubb-labs/kubb/commit/ea8c36e4af652726676ff10d2bfbdc4a3b6a9a38)]:
  - @kubb/plugin-client@4.5.15
  - @kubb/core@4.5.15
  - @kubb/oas@4.5.15
  - @kubb/plugin-oas@4.5.15
  - @kubb/plugin-ts@4.5.15
  - @kubb/plugin-zod@4.5.15

## 4.5.14

### Patch Changes

- [#2035](https://github.com/kubb-labs/kubb/pull/2035) [`c09550b`](https://github.com/kubb-labs/kubb/commit/c09550bc68baf001a82df1b130f6144c665f238c) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Support arrays in multipart/form-data
  - Added `buildFormData` utility function to properly handle arrays in multipart/form-data requests
  - Fixed array iteration to use `for...of` instead of `for...in` to correctly iterate over array values
  - Added Date object handling with automatic ISO string conversion
  - Filter out null/undefined array elements to prevent them from becoming string literals in FormData
  - Improved type safety with early returns in appendData function
  - Added `upsertFile` method to PluginContext for idempotent file operations
  - Ensured consistent use of `upsertFile` across all query plugins for better file regeneration

- Updated dependencies [[`c09550b`](https://github.com/kubb-labs/kubb/commit/c09550bc68baf001a82df1b130f6144c665f238c)]:
  - @kubb/plugin-client@4.5.14
  - @kubb/core@4.5.14
  - @kubb/plugin-oas@4.5.14
  - @kubb/plugin-ts@4.5.14
  - @kubb/plugin-zod@4.5.14
  - @kubb/oas@4.5.14

## 4.5.13

### Patch Changes

- Updated dependencies [[`e33380f`](https://github.com/kubb-labs/kubb/commit/e33380f50fd377da057e260021261c9907269573)]:
  - @kubb/plugin-client@4.5.13
  - @kubb/core@4.5.13
  - @kubb/oas@4.5.13
  - @kubb/plugin-oas@4.5.13
  - @kubb/plugin-ts@4.5.13
  - @kubb/plugin-zod@4.5.13

## 4.5.12

### Patch Changes

- Updated dependencies [[`5018d73`](https://github.com/kubb-labs/kubb/commit/5018d73af605982bbcb76151fad560a102309a47), [`4e54238`](https://github.com/kubb-labs/kubb/commit/4e54238868b2e44aa98e3f3ef495a130e7d259dc), [`a9d1d7b`](https://github.com/kubb-labs/kubb/commit/a9d1d7be78d0d4d7d63831a287c6a13b254b6b91)]:
  - @kubb/plugin-client@4.5.12
  - @kubb/plugin-zod@4.5.12
  - @kubb/core@4.5.12
  - @kubb/oas@4.5.12
  - @kubb/plugin-oas@4.5.12
  - @kubb/plugin-ts@4.5.12

## 4.5.11

### Patch Changes

- Updated dependencies [[`8dd9b83`](https://github.com/kubb-labs/kubb/commit/8dd9b833a84c6984a8056f0f4170fe60360b9ca7)]:
  - @kubb/plugin-client@4.5.11
  - @kubb/plugin-oas@4.5.11
  - @kubb/plugin-ts@4.5.11
  - @kubb/core@4.5.11
  - @kubb/plugin-zod@4.5.11
  - @kubb/oas@4.5.11

## 4.5.10

### Patch Changes

- Updated dependencies [[`77e00a5`](https://github.com/kubb-labs/kubb/commit/77e00a5ab689d38e432ed06f3c56aaa3019686d5)]:
  - @kubb/plugin-client@4.5.10
  - @kubb/core@4.5.10
  - @kubb/oas@4.5.10
  - @kubb/plugin-oas@4.5.10
  - @kubb/plugin-ts@4.5.10
  - @kubb/plugin-zod@4.5.10

## 4.5.9

### Patch Changes

- Updated dependencies [[`b334be1`](https://github.com/kubb-labs/kubb/commit/b334be118a3e54f3e76713edc6bfe6a562b10084)]:
  - @kubb/plugin-oas@4.5.9
  - @kubb/plugin-ts@4.5.9
  - @kubb/oas@4.5.9
  - @kubb/plugin-client@4.5.9
  - @kubb/plugin-zod@4.5.9
  - @kubb/core@4.5.9

## 4.5.8

### Patch Changes

- Updated dependencies [[`3fb940e`](https://github.com/kubb-labs/kubb/commit/3fb940e71db28d548fe60bbcb1d5282276098129)]:
  - @kubb/plugin-client@4.5.8
  - @kubb/core@4.5.8
  - @kubb/oas@4.5.8
  - @kubb/plugin-oas@4.5.8
  - @kubb/plugin-ts@4.5.8
  - @kubb/plugin-zod@4.5.8

## 4.5.7

### Patch Changes

- [`40e29ca`](https://github.com/kubb-labs/kubb/commit/40e29ca67ab79e15523cfda8ae648cb0aa2712f9) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Use of fixed fabric version

- Updated dependencies [[`40e29ca`](https://github.com/kubb-labs/kubb/commit/40e29ca67ab79e15523cfda8ae648cb0aa2712f9)]:
  - @kubb/plugin-client@4.5.7
  - @kubb/plugin-oas@4.5.7
  - @kubb/plugin-zod@4.5.7
  - @kubb/plugin-ts@4.5.7
  - @kubb/core@4.5.7
  - @kubb/oas@4.5.7

## 4.5.6

### Patch Changes

- Updated dependencies [[`613ad38`](https://github.com/kubb-labs/kubb/commit/613ad381a8d73dd3815eb72d7cd32da2290d3203)]:
  - @kubb/core@4.5.6
  - @kubb/plugin-client@4.5.6
  - @kubb/plugin-oas@4.5.6
  - @kubb/plugin-ts@4.5.6
  - @kubb/plugin-zod@4.5.6
  - @kubb/oas@4.5.6

## 4.5.5

### Patch Changes

- Updated dependencies [[`ec21400`](https://github.com/kubb-labs/kubb/commit/ec21400d90c7e6cdf93485db30ca23624d652ec8)]:
  - @kubb/core@4.5.5
  - @kubb/plugin-client@4.5.5
  - @kubb/plugin-oas@4.5.5
  - @kubb/plugin-ts@4.5.5
  - @kubb/plugin-zod@4.5.5
  - @kubb/oas@4.5.5

## 4.5.4

### Patch Changes

- Updated dependencies [[`f81d4f1`](https://github.com/kubb-labs/kubb/commit/f81d4f133b302e6fbc03787fa4be40806066acc7)]:
  - @kubb/core@4.5.4
  - @kubb/plugin-client@4.5.4
  - @kubb/plugin-oas@4.5.4
  - @kubb/plugin-ts@4.5.4
  - @kubb/plugin-zod@4.5.4
  - @kubb/oas@4.5.4

## 4.5.3

### Patch Changes

- Updated dependencies [[`7c6235d`](https://github.com/kubb-labs/kubb/commit/7c6235da0bdd6a61091ef296f80f9bc136fcf7d2)]:
  - @kubb/plugin-oas@4.5.3
  - @kubb/plugin-client@4.5.3
  - @kubb/plugin-ts@4.5.3
  - @kubb/plugin-zod@4.5.3
  - @kubb/core@4.5.3
  - @kubb/oas@4.5.3

## 4.5.2

### Patch Changes

- Updated dependencies [[`56207b9`](https://github.com/kubb-labs/kubb/commit/56207b9b36cad9ccef190fe68716c3d78bb257c8)]:
  - @kubb/core@4.5.2
  - @kubb/plugin-client@4.5.2
  - @kubb/plugin-oas@4.5.2
  - @kubb/plugin-ts@4.5.2
  - @kubb/plugin-zod@4.5.2
  - @kubb/oas@4.5.2

## 4.5.1

### Patch Changes

- Updated dependencies [[`39b713a`](https://github.com/kubb-labs/kubb/commit/39b713aaa9917a5d9def277a0215f14e28f3c67f)]:
  - @kubb/plugin-zod@4.5.1
  - @kubb/plugin-client@4.5.1
  - @kubb/core@4.5.1
  - @kubb/oas@4.5.1
  - @kubb/plugin-oas@4.5.1
  - @kubb/plugin-ts@4.5.1

## 4.5.0

### Minor Changes

- [#1970](https://github.com/kubb-labs/kubb/pull/1970) [`7152039`](https://github.com/kubb-labs/kubb/commit/71520392cde27ff58bcbead3930e8f3e38b3be86) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - remove @kubb dependencies

### Patch Changes

- Updated dependencies [[`2512b5f`](https://github.com/kubb-labs/kubb/commit/2512b5f8a8216e35886cf4aede9311150f6ba0e8), [`4c964fa`](https://github.com/kubb-labs/kubb/commit/4c964fa89bf0b9dceae615895a6153d4fe777974), [`2fc52bb`](https://github.com/kubb-labs/kubb/commit/2fc52bba8d537d8a50de1fd57656cdcf4aadbda1), [`7152039`](https://github.com/kubb-labs/kubb/commit/71520392cde27ff58bcbead3930e8f3e38b3be86)]:
  - @kubb/plugin-oas@4.5.0
  - @kubb/plugin-zod@4.5.0
  - @kubb/core@4.5.0
  - @kubb/plugin-client@4.5.0
  - @kubb/plugin-ts@4.5.0
  - @kubb/oas@4.5.0

## 4.4.1

### Patch Changes

- [#1963](https://github.com/kubb-labs/kubb/pull/1963) [`75d0730`](https://github.com/kubb-labs/kubb/commit/75d0730ac261332442a70ee056a0b91acc56db6d) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Update Fabric to get latest changes

- Updated dependencies [[`75d0730`](https://github.com/kubb-labs/kubb/commit/75d0730ac261332442a70ee056a0b91acc56db6d)]:
  - @kubb/plugin-client@4.4.1
  - @kubb/plugin-oas@4.4.1
  - @kubb/plugin-zod@4.4.1
  - @kubb/plugin-ts@4.4.1
  - @kubb/core@4.4.1
  - @kubb/oas@4.4.1

## 4.4.0

### Minor Changes

- [#1961](https://github.com/kubb-labs/kubb/pull/1961) [`bed6f9c`](https://github.com/kubb-labs/kubb/commit/bed6f9cf482ad4bbd2119c9de38f1184227b82cc) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - removal of Kubb react in favor of using `@kubb/react-fabric`

### Patch Changes

- Updated dependencies [[`25bf2e7`](https://github.com/kubb-labs/kubb/commit/25bf2e7f54feeaf2341701fee2a2a819ae8d143d), [`bed6f9c`](https://github.com/kubb-labs/kubb/commit/bed6f9cf482ad4bbd2119c9de38f1184227b82cc)]:
  - @kubb/core@4.4.0
  - @kubb/plugin-client@4.4.0
  - @kubb/plugin-oas@4.4.0
  - @kubb/plugin-zod@4.4.0
  - @kubb/plugin-ts@4.4.0
  - @kubb/oas@4.4.0

## 4.3.1

### Patch Changes

- [#1953](https://github.com/kubb-labs/kubb/pull/1953) [`6b6f5b0`](https://github.com/kubb-labs/kubb/commit/6b6f5b0d20ddc7b42b2fd9daf8cb1483d2c3af92) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - update PeerDependencies @kubb/react

- Updated dependencies [[`6b6f5b0`](https://github.com/kubb-labs/kubb/commit/6b6f5b0d20ddc7b42b2fd9daf8cb1483d2c3af92)]:
  - @kubb/plugin-client@4.3.1
  - @kubb/plugin-oas@4.3.1
  - @kubb/plugin-zod@4.3.1
  - @kubb/plugin-ts@4.3.1
  - @kubb/core@4.3.1
  - @kubb/oas@4.3.1
  - @kubb/react@4.3.1

## 4.3.0

### Patch Changes

- Updated dependencies [[`1a3e1d9`](https://github.com/kubb-labs/kubb/commit/1a3e1d98015ec768c0d5e563888003047fda351c), [`1a3e1d9`](https://github.com/kubb-labs/kubb/commit/1a3e1d98015ec768c0d5e563888003047fda351c), [`1a3e1d9`](https://github.com/kubb-labs/kubb/commit/1a3e1d98015ec768c0d5e563888003047fda351c)]:
  - @kubb/plugin-oas@4.3.0
  - @kubb/plugin-zod@4.3.0
  - @kubb/plugin-ts@4.3.0
  - @kubb/plugin-client@4.3.0
  - @kubb/core@4.3.0
  - @kubb/oas@4.3.0
  - @kubb/react@4.3.0

## 4.2.2

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.2.2
  - @kubb/oas@4.2.2
  - @kubb/plugin-client@4.2.2
  - @kubb/plugin-oas@4.2.2
  - @kubb/plugin-ts@4.2.2
  - @kubb/plugin-zod@4.2.2
  - @kubb/react@4.2.2

## 4.2.1

### Patch Changes

- Updated dependencies [[`945f689`](https://github.com/kubb-labs/kubb/commit/945f689c64371fa06aaa5772974420d712f17619)]:
  - @kubb/core@4.2.1
  - @kubb/plugin-client@4.2.1
  - @kubb/plugin-oas@4.2.1
  - @kubb/plugin-ts@4.2.1
  - @kubb/plugin-zod@4.2.1
  - @kubb/oas@4.2.1
  - @kubb/react@4.2.1

## 4.2.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.2.0
  - @kubb/oas@4.2.0
  - @kubb/plugin-client@4.2.0
  - @kubb/plugin-oas@4.2.0
  - @kubb/plugin-ts@4.2.0
  - @kubb/plugin-zod@4.2.0
  - @kubb/react@4.2.0

## 4.1.4

### Patch Changes

- Updated dependencies [[`8d7367d`](https://github.com/kubb-labs/kubb/commit/8d7367daa86b4cf7f9907cccf7cc5331b1eceb17)]:
  - @kubb/plugin-client@4.1.4
  - @kubb/core@4.1.4
  - @kubb/oas@4.1.4
  - @kubb/plugin-oas@4.1.4
  - @kubb/plugin-ts@4.1.4
  - @kubb/plugin-zod@4.1.4
  - @kubb/react@4.1.4

## 4.1.3

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.1.3
  - @kubb/oas@4.1.3
  - @kubb/plugin-client@4.1.3
  - @kubb/plugin-oas@4.1.3
  - @kubb/plugin-ts@4.1.3
  - @kubb/plugin-zod@4.1.3
  - @kubb/react@4.1.3

## 4.1.2

### Patch Changes

- Updated dependencies [[`0754cdb`](https://github.com/kubb-labs/kubb/commit/0754cdbcfba08b6de3940f26e265206a6597527a), [`acf033c`](https://github.com/kubb-labs/kubb/commit/acf033c7a2540741e57ab130c6ad94bcdbcf354c)]:
  - @kubb/plugin-zod@4.1.2
  - @kubb/core@4.1.2
  - @kubb/plugin-client@4.1.2
  - @kubb/plugin-oas@4.1.2
  - @kubb/plugin-ts@4.1.2
  - @kubb/react@4.1.2
  - @kubb/oas@4.1.2

## 4.1.1

### Patch Changes

- Updated dependencies [[`2c8882b`](https://github.com/kubb-labs/kubb/commit/2c8882ba3652dabc662660578072d9c0b9abd071)]:
  - @kubb/plugin-zod@4.1.1
  - @kubb/plugin-client@4.1.1
  - @kubb/core@4.1.1
  - @kubb/oas@4.1.1
  - @kubb/plugin-oas@4.1.1
  - @kubb/plugin-ts@4.1.1
  - @kubb/react@4.1.1

## 4.1.0

### Patch Changes

- Updated dependencies [[`c70ef78`](https://github.com/kubb-labs/kubb/commit/c70ef78d1dd9479f9459a5dcb710505515e2c7c6)]:
  - @kubb/plugin-zod@4.1.0
  - @kubb/plugin-client@4.1.0
  - @kubb/core@4.1.0
  - @kubb/oas@4.1.0
  - @kubb/plugin-oas@4.1.0
  - @kubb/plugin-ts@4.1.0
  - @kubb/react@4.1.0

## 4.0.2

### Patch Changes

- Updated dependencies [[`fe675c6`](https://github.com/kubb-labs/kubb/commit/fe675c66ba624339bccfbba3ab75c8acadeca239)]:
  - @kubb/plugin-zod@4.0.2
  - @kubb/plugin-client@4.0.2
  - @kubb/core@4.0.2
  - @kubb/oas@4.0.2
  - @kubb/plugin-oas@4.0.2
  - @kubb/plugin-ts@4.0.2
  - @kubb/react@4.0.2

## 4.0.1

### Patch Changes

- Updated dependencies [[`c531bb9`](https://github.com/kubb-labs/kubb/commit/c531bb9c898c8974c74a80e3c65ac3ea7229538b)]:
  - @kubb/plugin-ts@4.0.1
  - @kubb/plugin-client@4.0.1
  - @kubb/plugin-zod@4.0.1
  - @kubb/core@4.0.1
  - @kubb/oas@4.0.1
  - @kubb/plugin-oas@4.0.1
  - @kubb/react@4.0.1

## 4.0.0

### Patch Changes

- Updated dependencies [[`1468999`](https://github.com/kubb-labs/kubb/commit/1468999cbf23df2d4e7ab6debcaa9a7421b88bbb)]:
  - @kubb/core@4.0.0
  - @kubb/plugin-ts@4.0.0
  - @kubb/plugin-client@4.0.0
  - @kubb/plugin-oas@4.0.0
  - @kubb/plugin-zod@4.0.0
  - @kubb/react@4.0.0
  - @kubb/oas@4.0.0

## 3.18.3

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.18.3
  - @kubb/oas@3.18.3
  - @kubb/plugin-client@3.18.3
  - @kubb/plugin-oas@3.18.3
  - @kubb/plugin-ts@3.18.3
  - @kubb/plugin-zod@3.18.3
  - @kubb/react@3.18.3

## 3.18.2

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.18.2
  - @kubb/oas@3.18.2
  - @kubb/plugin-client@3.18.2
  - @kubb/plugin-oas@3.18.2
  - @kubb/plugin-ts@3.18.2
  - @kubb/plugin-zod@3.18.2
  - @kubb/react@3.18.2

## 3.18.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.18.1
  - @kubb/plugin-ts@3.18.1
  - @kubb/plugin-zod@3.18.1
  - @kubb/react@3.18.1
  - @kubb/plugin-client@3.18.1
  - @kubb/plugin-oas@3.18.1
  - @kubb/oas@3.18.1

## 3.17.1

### Patch Changes

- Updated dependencies [[`5362b0f`](https://github.com/kubb-labs/kubb/commit/5362b0f93ee9fa2ca68d58de57c03d3573d2cdfb)]:
  - @kubb/core@3.17.1
  - @kubb/plugin-zod@3.17.1
  - @kubb/plugin-client@3.17.1
  - @kubb/plugin-oas@3.17.1
  - @kubb/plugin-ts@3.17.1
  - @kubb/react@3.17.1
  - @kubb/oas@3.17.1

## 3.17.0

### Patch Changes

- Updated dependencies [[`3352fae`](https://github.com/kubb-labs/kubb/commit/3352faebffe9f74e4cab58bb8e7e0bd3ef204227)]:
  - @kubb/plugin-client@3.17.0
  - @kubb/core@3.17.0
  - @kubb/oas@3.17.0
  - @kubb/plugin-oas@3.17.0
  - @kubb/plugin-ts@3.17.0
  - @kubb/plugin-zod@3.17.0
  - @kubb/react@3.17.0

## 3.16.4

### Patch Changes

- Updated dependencies [[`ce6ebfc`](https://github.com/kubb-labs/kubb/commit/ce6ebfc959229a92b9f779744d9f6556861a5ba1)]:
  - @kubb/plugin-zod@3.16.4
  - @kubb/plugin-client@3.16.4
  - @kubb/core@3.16.4
  - @kubb/oas@3.16.4
  - @kubb/plugin-oas@3.16.4
  - @kubb/plugin-ts@3.16.4
  - @kubb/react@3.16.4

## 3.16.3

### Patch Changes

- [`ddc9d59`](https://github.com/kubb-labs/kubb/commit/ddc9d59cffeb5e28a5ee280dec0944f49aa49443) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Return contentType from response instead of request

- Updated dependencies []:
  - @kubb/core@3.16.3
  - @kubb/oas@3.16.3
  - @kubb/plugin-client@3.16.3
  - @kubb/plugin-oas@3.16.3
  - @kubb/plugin-ts@3.16.3
  - @kubb/plugin-zod@3.16.3
  - @kubb/react@3.16.3

## 3.16.2

### Patch Changes

- Updated dependencies [[`9f386f7`](https://github.com/kubb-labs/kubb/commit/9f386f763728119c1baef4ee50733e6dc2079ac7), [`9f386f7`](https://github.com/kubb-labs/kubb/commit/9f386f763728119c1baef4ee50733e6dc2079ac7), [`9f386f7`](https://github.com/kubb-labs/kubb/commit/9f386f763728119c1baef4ee50733e6dc2079ac7)]:
  - @kubb/plugin-client@3.16.2
  - @kubb/plugin-ts@3.16.2
  - @kubb/plugin-zod@3.16.2
  - @kubb/core@3.16.2
  - @kubb/oas@3.16.2
  - @kubb/plugin-oas@3.16.2
  - @kubb/react@3.16.2

## 3.16.1

### Patch Changes

- Updated dependencies [[`e51db4c`](https://github.com/kubb-labs/kubb/commit/e51db4c77b3bb7e044382d2b19400262e927cd3a)]:
  - @kubb/plugin-oas@3.16.1
  - @kubb/plugin-ts@3.16.1
  - @kubb/plugin-client@3.16.1
  - @kubb/plugin-zod@3.16.1
  - @kubb/core@3.16.1
  - @kubb/oas@3.16.1
  - @kubb/react@3.16.1

## 3.16.0

### Patch Changes

- Updated dependencies [[`c7360e8`](https://github.com/kubb-labs/kubb/commit/c7360e879436d035229ade7afc2f2870e0538a89)]:
  - @kubb/core@3.16.0
  - @kubb/oas@3.16.0
  - @kubb/plugin-oas@3.16.0
  - @kubb/plugin-client@3.16.0
  - @kubb/plugin-ts@3.16.0
  - @kubb/plugin-zod@3.16.0
  - @kubb/react@3.16.0

## 3.15.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.15.1
  - @kubb/oas@3.15.1
  - @kubb/plugin-client@3.15.1
  - @kubb/plugin-oas@3.15.1
  - @kubb/plugin-ts@3.15.1
  - @kubb/plugin-zod@3.15.1
  - @kubb/react@3.15.1

## 3.15.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.15.0
  - @kubb/oas@3.15.0
  - @kubb/plugin-client@3.15.0
  - @kubb/plugin-oas@3.15.0
  - @kubb/plugin-ts@3.15.0
  - @kubb/plugin-zod@3.15.0
  - @kubb/react@3.15.0

## 3.14.4

### Patch Changes

- Updated dependencies [[`18572ff`](https://github.com/kubb-labs/kubb/commit/18572ff28378e8ac9bee5157a71ab2cc7d89d612)]:
  - @kubb/plugin-oas@3.14.4
  - @kubb/plugin-client@3.14.4
  - @kubb/plugin-ts@3.14.4
  - @kubb/plugin-zod@3.14.4
  - @kubb/core@3.14.4
  - @kubb/oas@3.14.4
  - @kubb/react@3.14.4

## 3.14.3

### Patch Changes

- Updated dependencies [[`2376899`](https://github.com/kubb-labs/kubb/commit/2376899898e92483945e48c7bbca2398d3b8ac9c), [`2376899`](https://github.com/kubb-labs/kubb/commit/2376899898e92483945e48c7bbca2398d3b8ac9c), [`991249c`](https://github.com/kubb-labs/kubb/commit/991249c18e86c6ebdfef3912de44cbfaa81b6891)]:
  - @kubb/plugin-oas@3.14.3
  - @kubb/core@3.14.3
  - @kubb/plugin-client@3.14.3
  - @kubb/plugin-ts@3.14.3
  - @kubb/plugin-zod@3.14.3
  - @kubb/react@3.14.3
  - @kubb/oas@3.14.3

## 3.14.2

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.14.2
  - @kubb/oas@3.14.2
  - @kubb/plugin-client@3.14.2
  - @kubb/plugin-oas@3.14.2
  - @kubb/plugin-ts@3.14.2
  - @kubb/plugin-zod@3.14.2
  - @kubb/react@3.14.2

## 3.14.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.14.1
  - @kubb/plugin-ts@3.14.1
  - @kubb/plugin-zod@3.14.1
  - @kubb/react@3.14.1
  - @kubb/plugin-client@3.14.1
  - @kubb/plugin-oas@3.14.1
  - @kubb/oas@3.14.1

## 3.14.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.14.0
  - @kubb/oas@3.14.0
  - @kubb/plugin-client@3.14.0
  - @kubb/plugin-oas@3.14.0
  - @kubb/plugin-ts@3.14.0
  - @kubb/plugin-zod@3.14.0
  - @kubb/react@3.14.0

## 3.13.2

### Patch Changes

- Shadowed variables error when using `client`, use of `fetch` instead when an import to `@kubb/plugin-client/clients/axios` is needed.

- Updated dependencies []:
  - @kubb/plugin-client@3.13.2
  - @kubb/core@3.13.2
  - @kubb/plugin-oas@3.13.2
  - @kubb/plugin-ts@3.13.2
  - @kubb/plugin-zod@3.13.2
  - @kubb/react@3.13.2
  - @kubb/oas@3.13.2

## 3.13.1

### Patch Changes

- Updated dependencies [[`92e3e8c`](https://github.com/kubb-labs/kubb/commit/92e3e8c58e80cc36e4a2dc8fc83a089635e36562)]:
  - @kubb/plugin-client@3.13.1
  - @kubb/core@3.13.1
  - @kubb/oas@3.13.1
  - @kubb/plugin-oas@3.13.1
  - @kubb/plugin-ts@3.13.1
  - @kubb/plugin-zod@3.13.1
  - @kubb/react@3.13.1

## 3.13.0

### Patch Changes

- Updated dependencies [[`d875cd8`](https://github.com/kubb-labs/kubb/commit/d875cd81d443cb6258011b7f5fd918e220deaf53)]:
  - @kubb/plugin-zod@3.13.0
  - @kubb/plugin-ts@3.13.0
  - @kubb/plugin-client@3.13.0
  - @kubb/core@3.13.0
  - @kubb/oas@3.13.0
  - @kubb/plugin-oas@3.13.0
  - @kubb/react@3.13.0

## 3.12.2

### Patch Changes

- Updated dependencies [[`74e2203`](https://github.com/kubb-labs/kubb/commit/74e2203a91becf5728b18c979247075332dcb660)]:
  - @kubb/core@3.12.2
  - @kubb/plugin-client@3.12.2
  - @kubb/plugin-oas@3.12.2
  - @kubb/plugin-ts@3.12.2
  - @kubb/plugin-zod@3.12.2
  - @kubb/react@3.12.2
  - @kubb/oas@3.12.2

## 3.12.1

### Patch Changes

- Updated dependencies [[`517fedc`](https://github.com/kubb-labs/kubb/commit/517fedc6e1adc748ae1768072bc6823c243bcde5)]:
  - @kubb/plugin-zod@3.12.1
  - @kubb/plugin-client@3.12.1
  - @kubb/core@3.12.1
  - @kubb/oas@3.12.1
  - @kubb/plugin-oas@3.12.1
  - @kubb/plugin-ts@3.12.1
  - @kubb/react@3.12.1

## 3.12.0

### Patch Changes

- Updated dependencies [[`7a9e6e7`](https://github.com/kubb-labs/kubb/commit/7a9e6e7b6bffa233c3c573ec5116e4c0dda7cce2), [`2ba42c5`](https://github.com/kubb-labs/kubb/commit/2ba42c5603e037b0a324c3b720e7b6505daf9acf)]:
  - @kubb/plugin-client@3.12.0
  - @kubb/plugin-zod@3.12.0
  - @kubb/core@3.12.0
  - @kubb/oas@3.12.0
  - @kubb/plugin-oas@3.12.0
  - @kubb/plugin-ts@3.12.0
  - @kubb/react@3.12.0

## 3.11.1

### Patch Changes

- Updated dependencies [[`5400e56`](https://github.com/kubb-labs/kubb/commit/5400e56fd866dbee721cd2dcbdb288088c58d990)]:
  - @kubb/plugin-zod@3.11.1
  - @kubb/plugin-client@3.11.1
  - @kubb/core@3.11.1
  - @kubb/oas@3.11.1
  - @kubb/plugin-oas@3.11.1
  - @kubb/plugin-ts@3.11.1
  - @kubb/react@3.11.1

## 3.11.0

### Patch Changes

- Updated dependencies [[`13189ee`](https://github.com/kubb-labs/kubb/commit/13189ee0c7b297cc42cf9a7d476780ff7e357efe), [`55de3d2`](https://github.com/kubb-labs/kubb/commit/55de3d2758ce4957882243ad70d3168d3c41ff40)]:
  - @kubb/plugin-zod@3.11.0
  - @kubb/plugin-oas@3.11.0
  - @kubb/plugin-client@3.11.0
  - @kubb/plugin-ts@3.11.0
  - @kubb/core@3.11.0
  - @kubb/oas@3.11.0
  - @kubb/react@3.11.0

## 3.10.15

### Patch Changes

- Updated dependencies [[`db73926`](https://github.com/kubb-labs/kubb/commit/db73926f46739e598244bedc52f466591b2d7320)]:
  - @kubb/plugin-ts@3.10.15
  - @kubb/plugin-client@3.10.15
  - @kubb/plugin-zod@3.10.15
  - @kubb/core@3.10.15
  - @kubb/oas@3.10.15
  - @kubb/plugin-oas@3.10.15
  - @kubb/react@3.10.15

## 3.10.14

### Patch Changes

- Updated dependencies [[`17ebfce`](https://github.com/kubb-labs/kubb/commit/17ebfce849874784aa0625310eae17c8574528b3)]:
  - @kubb/plugin-ts@3.10.14
  - @kubb/plugin-client@3.10.14
  - @kubb/plugin-zod@3.10.14
  - @kubb/core@3.10.14
  - @kubb/oas@3.10.14
  - @kubb/plugin-oas@3.10.14
  - @kubb/react@3.10.14

## 3.10.13

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.10.13
  - @kubb/oas@3.10.13
  - @kubb/plugin-client@3.10.13
  - @kubb/plugin-oas@3.10.13
  - @kubb/plugin-ts@3.10.13
  - @kubb/plugin-zod@3.10.13
  - @kubb/react@3.10.13

## 3.10.12

### Patch Changes

- Updated dependencies [[`90f78c2`](https://github.com/kubb-labs/kubb/commit/90f78c2bfbc77ec8838e8e82bc521e7b24cecf65)]:
  - @kubb/plugin-zod@3.10.12
  - @kubb/plugin-client@3.10.12
  - @kubb/core@3.10.12
  - @kubb/oas@3.10.12
  - @kubb/plugin-oas@3.10.12
  - @kubb/plugin-ts@3.10.12
  - @kubb/react@3.10.12

## 3.10.11

### Patch Changes

- Updated dependencies [[`bec329e`](https://github.com/kubb-labs/kubb/commit/bec329e79b7ff25f9b5289211e412b52b2a23492), [`e666e9a`](https://github.com/kubb-labs/kubb/commit/e666e9a4a038864f1d9e87a916108b291028b42b)]:
  - @kubb/plugin-zod@3.10.11
  - @kubb/plugin-oas@3.10.11
  - @kubb/plugin-client@3.10.11
  - @kubb/plugin-ts@3.10.11
  - @kubb/core@3.10.11
  - @kubb/oas@3.10.11
  - @kubb/react@3.10.11

## 3.10.10

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.10.10
  - @kubb/oas@3.10.10
  - @kubb/plugin-client@3.10.10
  - @kubb/plugin-oas@3.10.10
  - @kubb/plugin-ts@3.10.10
  - @kubb/plugin-zod@3.10.10
  - @kubb/react@3.10.10

## 3.10.9

### Patch Changes

- Updated dependencies [[`be0b8c2`](https://github.com/kubb-labs/kubb/commit/be0b8c27aee3f86bd29320fc008afe24f78856c4)]:
  - @kubb/plugin-zod@3.10.9
  - @kubb/plugin-client@3.10.9
  - @kubb/core@3.10.9
  - @kubb/oas@3.10.9
  - @kubb/plugin-oas@3.10.9
  - @kubb/plugin-ts@3.10.9
  - @kubb/react@3.10.9

## 3.10.8

### Patch Changes

- Updated dependencies [[`23a6e72`](https://github.com/kubb-labs/kubb/commit/23a6e72c7288bb8385707f98ef5da6d4b0339016)]:
  - @kubb/plugin-oas@3.10.8
  - @kubb/plugin-client@3.10.8
  - @kubb/plugin-ts@3.10.8
  - @kubb/plugin-zod@3.10.8
  - @kubb/core@3.10.8
  - @kubb/oas@3.10.8
  - @kubb/react@3.10.8

## 3.10.7

### Patch Changes

- Updated dependencies [[`f7d5447`](https://github.com/kubb-labs/kubb/commit/f7d54477b8d504a8f5237b70ff7978699556500f)]:
  - @kubb/core@3.10.7
  - @kubb/plugin-client@3.10.7
  - @kubb/plugin-oas@3.10.7
  - @kubb/plugin-ts@3.10.7
  - @kubb/plugin-zod@3.10.7
  - @kubb/react@3.10.7
  - @kubb/oas@3.10.7

## 3.10.6

### Patch Changes

- Updated dependencies [[`7be571a`](https://github.com/kubb-labs/kubb/commit/7be571aa4ceffb2e18dff1e81b81efa37fef0cc3)]:
  - @kubb/plugin-oas@3.10.6
  - @kubb/plugin-ts@3.10.6
  - @kubb/plugin-client@3.10.6
  - @kubb/plugin-zod@3.10.6
  - @kubb/core@3.10.6
  - @kubb/react@3.10.6
  - @kubb/fs@3.10.6
  - @kubb/oas@3.10.6

## 3.10.5

### Patch Changes

- Updated dependencies [[`4eba848`](https://github.com/kubb-labs/kubb/commit/4eba848da4ab06dbe6abd6f601a4963613db6339)]:
  - @kubb/plugin-oas@3.10.5
  - @kubb/plugin-client@3.10.5
  - @kubb/plugin-ts@3.10.5
  - @kubb/plugin-zod@3.10.5
  - @kubb/core@3.10.5
  - @kubb/fs@3.10.5
  - @kubb/oas@3.10.5
  - @kubb/react@3.10.5

## 3.10.4

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.10.4
  - @kubb/fs@3.10.4
  - @kubb/oas@3.10.4
  - @kubb/plugin-client@3.10.4
  - @kubb/plugin-oas@3.10.4
  - @kubb/plugin-ts@3.10.4
  - @kubb/plugin-zod@3.10.4
  - @kubb/react@3.10.4

## 3.10.3

### Patch Changes

- Updated dependencies [[`da564ab`](https://github.com/kubb-labs/kubb/commit/da564abbf8f8e830b42f3ea39f69bc3494e796c2)]:
  - @kubb/plugin-oas@3.10.3
  - @kubb/plugin-ts@3.10.3
  - @kubb/plugin-client@3.10.3
  - @kubb/plugin-zod@3.10.3
  - @kubb/core@3.10.3
  - @kubb/fs@3.10.3
  - @kubb/oas@3.10.3
  - @kubb/react@3.10.3

## 3.10.2

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.10.2
  - @kubb/fs@3.10.2
  - @kubb/oas@3.10.2
  - @kubb/plugin-client@3.10.2
  - @kubb/plugin-oas@3.10.2
  - @kubb/plugin-ts@3.10.2
  - @kubb/plugin-zod@3.10.2
  - @kubb/react@3.10.2

## 3.10.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.10.1
  - @kubb/fs@3.10.1
  - @kubb/oas@3.10.1
  - @kubb/plugin-client@3.10.1
  - @kubb/plugin-oas@3.10.1
  - @kubb/plugin-ts@3.10.1
  - @kubb/plugin-zod@3.10.1
  - @kubb/react@3.10.1

## 3.10.0

### Minor Changes

- [`99b3b3f`](https://github.com/kubb-labs/kubb/commit/99b3b3fca30c63b3e3e1b310658ae034c1427d3e) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - create an [MCP](https://modelcontextprotocol.io) server based on your OpenAPI file

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.10.0
  - @kubb/fs@3.10.0
  - @kubb/oas@3.10.0
  - @kubb/plugin-client@3.10.0
  - @kubb/plugin-oas@3.10.0
  - @kubb/plugin-ts@3.10.0
  - @kubb/plugin-zod@3.10.0
  - @kubb/react@3.10.0

## 3.9.5

### Patch Changes

- Updated dependencies [[`cd36453`](https://github.com/kubb-labs/kubb/commit/cd364531aff4fa0956584234bf04ad105c27baa7)]:
  - @kubb/plugin-oas@3.9.5
  - @kubb/plugin-ts@3.9.5
  - @kubb/plugin-client@3.9.5
  - @kubb/plugin-zod@3.9.5
  - @kubb/core@3.9.5
  - @kubb/fs@3.9.5
  - @kubb/oas@3.9.5
  - @kubb/react@3.9.5

## 3.9.4

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.9.4
  - @kubb/fs@3.9.4
  - @kubb/oas@3.9.4
  - @kubb/plugin-client@3.9.4
  - @kubb/plugin-oas@3.9.4
  - @kubb/plugin-ts@3.9.4
  - @kubb/plugin-zod@3.9.4
  - @kubb/react@3.9.4

## 3.9.3

### Patch Changes

- Updated dependencies [[`208da32`](https://github.com/kubb-labs/kubb/commit/208da32045557dbb32a739ea0031d67848e59928)]:
  - @kubb/plugin-ts@3.9.3
  - @kubb/plugin-client@3.9.3
  - @kubb/plugin-zod@3.9.3
  - @kubb/core@3.9.3
  - @kubb/fs@3.9.3
  - @kubb/oas@3.9.3
  - @kubb/plugin-oas@3.9.3
  - @kubb/react@3.9.3

## 3.9.2

### Patch Changes

- Updated dependencies [[`9a08097`](https://github.com/kubb-labs/kubb/commit/9a0809747722abc9d181318b69b2c4e87f43b691)]:
  - @kubb/plugin-client@3.9.2
  - @kubb/core@3.9.2
  - @kubb/fs@3.9.2
  - @kubb/oas@3.9.2
  - @kubb/plugin-oas@3.9.2
  - @kubb/plugin-ts@3.9.2
  - @kubb/plugin-zod@3.9.2
  - @kubb/react@3.9.2

## 3.9.1

### Patch Changes

- Updated dependencies [[`ea3f531`](https://github.com/kubb-labs/kubb/commit/ea3f531f9abacbfb4f046c48f927fab67c882253)]:
  - @kubb/plugin-zod@3.9.1
  - @kubb/plugin-ts@3.9.1
  - @kubb/plugin-client@3.9.1
  - @kubb/core@3.9.1
  - @kubb/fs@3.9.1
  - @kubb/oas@3.9.1
  - @kubb/plugin-oas@3.9.1
  - @kubb/react@3.9.1
