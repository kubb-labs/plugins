# @kubb/plugin-swr

## 5.0.1

### Patch Changes

- [#820](https://github.com/kubb-labs/plugins/pull/820) [`15b789f`](https://github.com/kubb-labs/plugins/commit/15b789fb8a3b8933df5d2415888f0c4d44640a1b) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Generated calls now return a promise with an extra `unwrap()` method. Calling it gives you the bare
  success body, or rejects with `error` when the call was made with `throwOnError: false`.
  
  ```ts
  const { data, error } = await getPetById({ path: { petId: 1 } })
  const pet = await getPetById({ path: { petId: 1 } }).unwrap()
  ```
  
  Awaiting the call directly still gives the full result, so nothing existing changes.
  
  `plugin-react-query`, `plugin-vue-query`, and `plugin-swr` now build their generated query and
  mutation bodies on top of `unwrap()` too, instead of destructuring the result by hand.

## 5.0.0

### Major Changes

- Depend on `kubb` instead of `@kubb/core` and `@kubb/renderer-jsx` directly. Every plugin's `peerDependencies` now list a single `kubb` entry. This matches the `kubb-labs/kubb` `5.0.0-beta.81` release, which adds `kubb/kit` and `kubb/jsx` subpaths that re-export the plugin authoring API (`kubb/kit` includes the `ast` namespace, so there's no separate `kubb/ast` subpath).
  
  If you install a plugin directly (rather than only through `kubb`), update its peer to `kubb` and drop any standalone `@kubb/core` or `@kubb/renderer-jsx` install:
  
  ```diff
  - pnpm add @kubb/core @kubb/renderer-jsx
  + pnpm add kubb
  ```
  
  Custom generators and plugins that build on these packages' internals should follow the same
  `@kubb/core` → `kubb/kit` and `@kubb/renderer-jsx` → `kubb/jsx` mapping. The `ast` namespace
  (previously `@kubb/ast`) is reached as a named export off `kubb/kit` rather than its own subpath.
  `@kubb/parser-ts` (used by `plugin-ts`) and `@kubb/adapter-oas` (used by `plugin-redoc`, and for
  the `AdapterOas` type in `plugin-zod`) are unaffected and stay direct dependencies.

- Adopt the explicit `output.mode` option from `@kubb/core`.
  
  Kubb no longer infers a single file from an `output.path` ending in `.ts`. Set `output.mode: 'file'` to write everything into one file, `output.mode: 'group'` to write one file per group (which requires the `group` option), or leave it as the default `output.mode: 'directory'` for one file per operation or schema. A config that used a file-style `output.path` (e.g. `path: 'models.ts'`) now needs `output.mode: 'file'` to keep that layout.
  
  Each plugin's `Options` type now uses the `OutputOptions` union, so `output.mode: 'group'` statically requires the `group` option. The generators no longer gate imports on `ctx.getMode`, since `@kubb/ast` strips self-imports for the consolidated modes.

- Replace the `transformer` option with `macros`.
  
  Every plugin now takes `macros?: Array<ast.Macro>` instead of `transformer?: ast.Visitor`, and registers them with `ctx.setMacros` in `kubb:plugin:setup`. Macros are named and composable, so a list runs in order and a later macro sees the output of an earlier one. Move a single visitor into a macro by wrapping it: `macros: [{ name: 'my-macro', schema(node) { … } }]`.

### Minor Changes

- Every client now takes one grouped `{ path, query, body, headers }` options object, matching `@kubb/plugin-fetch`. This replaces the old per-argument signatures, the `params`/`data` keys, and the three options that produced them.
  
  Removed `paramsType`, `pathParamsType`, and `paramsCasing` from `@kubb/plugin-client`, `@kubb/plugin-react-query`, `@kubb/plugin-vue-query`, `@kubb/plugin-swr`, and `@kubb/plugin-cypress`. Removed `paramsCasing` from `@kubb/plugin-ts`, `@kubb/plugin-zod`, `@kubb/plugin-faker`, and `@kubb/plugin-mcp`.
  
  Generated functions, class methods, SDK methods, and query hooks now take the grouped object typed from the operation's `XxxRequestConfig`. Each `path`, `query`, and `headers` group is required when the operation has a required parameter in that group, so callers get a compile-time error before sending an incomplete request.
  
  The axios and fetch runtimes rename their `RequestConfig` fields `data` to `body`, and add `query` alongside the existing `params` (`query` wins when both are set, and is mapped to axios's native `params` field internally). Update any custom client or low-level `client({ ... })` call to the new field names.
  
  Update call sites to the grouped object, for example `getPet({ path: { petId } })`, `addPet({ body })`, and `useFindPetsByStatus({ query: { status } })`.

- Negotiate and discriminate multiple response content types.
  
  A generated call now takes a `contentType: { request, response }` object. The `request` key picks the body format and the `response` key sets the `Accept` header. Both default to what the spec declares and stay overridable, and a bare `contentType: 'application/json'` string still selects the request type, so existing calls keep working.
  
  When a status documents more than one content type, the result reports the type the server returned on `result.contentType`, next to `status` and `data`, so a caller can narrow `data` by it.
  
  ```ts
  const result = await getPetById({ path: { petId: '1' }, contentType: { response: 'application/xml' } })
  
  if (result.status === 200) {
    const { data, contentType } = result
    switch (contentType) {
      case 'application/json':
        console.log('JSON pet:', data.name)
        break
      case 'application/xml':
        console.log('XML pet:', data.id)
        break
    }
  }
  ```
  
  - `plugin-ts` discriminates a status that documents several content types by content type in the `<Name>Responses` record, so `result.contentType` narrows `result.data`. The standalone `<Name>StatusNNN` alias stays the plain body union, and the individual per-content-type variant types (`GetPetByIdStatus200Json`, `GetPetByIdStatus200Xml`) are kept.
  - `plugin-fetch` and `plugin-axios` add a `codecs` map to `RequestConfig` and `ClientConfig`, keyed by content type and matched with the charset stripped, where each entry's `serialize` / `deserialize` handles a format the runtime does not decode itself, such as `application/xml`. The negotiated content type rides on `result.contentType` and on `ResponseError`.
  - `plugin-react-query`, `plugin-vue-query`, and `plugin-swr` thread the `contentType` option through as the `{ request?, response? }` object.
  - `plugin-zod` and `plugin-faker` emit one schema or mock per response content type plus a union alias, with variant names that line up across the plugins through the shared naming helpers.
  - `plugin-msw` prefers the `application/json` content type for the mocked response when a status declares several.
  
  Single-content-type operations generate the same output as before. The breaking change is that the result now carries `contentType`, and the per-status responses record shape changes for a status with several content types.

- Migrate the client plugins to the shared `RequestResult` contract and remove `dataReturnType` ([#392](https://github.com/kubb-labs/plugins/issues/392)).
  
  `@kubb/plugin-client` now generates operations that return `RequestResult` (`{ data, error, request, response }`) with `throwOnError` defaulting to `true`, the same contract `@kubb/plugin-fetch` and `@kubb/plugin-axios` already ship. The query plugins (react-query, vue-query, swr) take a single `client: 'fetch' | 'axios'` option that routes through the matching registered contract client plugin, auto-detected when only one is registered. `@kubb/plugin-mcp` and `@kubb/plugin-cypress` drop `dataReturnType` as well.
  
  **Breaking. Migration:**
  
  - `dataReturnType: 'data'` → destructure the result: `const { data } = await getPet(1)`. fetch users now get the throw-on-error contract axios users already had.
  - `dataReturnType: 'full'` → pass `throwOnError: false` and read `error` / `response.status` off the result.
  - Query plugins: the deprecated `client` object is removed. Use `client: 'fetch' | 'axios'` with the matching client plugin registered.
  - `@kubb/plugin-cypress`: every helper now yields the response body (`Cypress.Chainable<T>`). The `'full'` `Cypress.Response` variant is gone.
  - `@kubb/plugin-mcp`: handlers call the contract client and read `res.data`. Form data follows the contract runtime's serializer (the `buildFormData` helper is gone).
  - `@kubb/plugin-client`: the `urlType` option and its `get<Operation>Url` URL helpers are removed, along with the `resolveUrlName` resolver method.

- Keep the OpenAPI document's exact parameter names for path, query, and header parameters, instead of forcing them to camelCase (kubb-labs/plugins#631).
  
  ```ts
  export type UpdatePetQuery = {
    include_deleted?: boolean
  }
  
  updatePet({ path: { pet_id: '1' }, query: { include_deleted: true } })
  ```
  
  There's no remapping step anymore, so a query or header name can't collide with a differently cased sibling, like `start_date` next to `startDate`.
  
  A path parameter still falls back to camelCase when its spec name isn't a valid identifier on its own (a hyphenated segment, say), since a few generators bind it directly as a variable. Query and header names are never touched.

- Remove the `@kubb/plugin-client` package. Its axios and fetch runtimes now ship as the dedicated `@kubb/plugin-axios` and `@kubb/plugin-fetch` packages, which speak the same `RequestResult` contract.
  
  Migrate by swapping the plugin you register:
  
  ```ts
  // before
  import { pluginClient } from '@kubb/plugin-client'
  pluginClient({ client: 'axios' })
  
  // after
  import { pluginAxios } from '@kubb/plugin-axios'
  pluginAxios({})
  ```
  
  The query plugins (`plugin-react-query`, `plugin-vue-query`, `plugin-swr`) and `plugin-mcp` now read their bundled client runtime from `@kubb/plugin-axios` and `@kubb/plugin-fetch` instead of `@kubb/plugin-client`. Register one of those packages, or let the hooks emit their own inline contract client when none is registered.
  
  `plugin-axios` and `plugin-fetch` each copy their own client runtime template (`axiosClientTemplatePath` / `fetchClientTemplatePath` internally) into `.kubb/client.ts`; other plugins call the generated `<op>` functions through the shared client-resolution helpers instead of importing these paths themselves.
  
  Three `plugin-client` options have no equivalent and are dropped: `operations` (the `operations.ts` re-export file), `clientType: 'staticClass'`, and `importPath` for a custom client module. Use the `sdk` option on `plugin-axios` / `plugin-fetch` for class-based output.

- The `parser` option is renamed to `validator` across the client and query plugins. Set `validator: 'zod'` (or `{ request: 'zod', response: 'zod' }`) where you previously set `parser`. The accepted values are unchanged.
  
  Generated clients pass the schema straight to the `validator` slot instead of wrapping it in a `.parse(data)` call. The slot takes a Standard Schema validator, and only `client.ts` calls `validateStandardSchema`, so the helper stays in one place instead of being imported into every operation file.
  
  A `validateStandardSchema` helper is injected into `.kubb/standardSchema.ts` next to the client. It handles sync and async `validate()` results and throws `ParseError({ issues })` on failure, so callers get a consistent `{ issues }` array instead of a raw `ZodError`. Any schema that exposes `~standard.validate` works, including zod, valibot, and arktype.
  
  Error-body validation now runs on the throwing path too. `validator.error` executes before `ResponseError` is constructed, so `error.data` always holds the validated body regardless of the `throwOnError` setting.

### Patch Changes

- [#731](https://github.com/kubb-labs/plugins/pull/731) [`8bf93a5`](https://github.com/kubb-labs/plugins/commit/8bf93a5dd7728694c47cb142a35d073b69d770d9) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Cache a dependency plugin's resolved name and file per operation node, reported in kubb-labs/kubb#3813.
  
  A dependent used to call `driver.getResolver(dep)` and re-resolve the dependency's name and path for every node. `plugin-react-query`'s query, mutation, and infinite-query generators each recomputed `plugin-ts`'s and the contract client's file for the same operation, and `plugin-swr`, `plugin-vue-query`, `plugin-mcp`, `plugin-msw`, `plugin-faker`, and `plugin-cypress` each recomputed `plugin-ts`'s file independently.
  
  `resolveClientOperation` and the new `resolveDependencyOperationFile` helper now read and write the current node's shared cache (`ctx.cache`, from kubb-labs/kubb#3812), so the first plugin that resolves a dependency for a node computes it once and every other plugin generating from that same node reuses the result. The contract client's own generator (`plugin-fetch`/`plugin-axios`) populates the cache first, so its dependents usually hit it directly. Generated output is unchanged.

- [#678](https://github.com/kubb-labs/plugins/pull/678) [`dfcb48f`](https://github.com/kubb-labs/plugins/commit/dfcb48f9c17a0ad4693100d092403396e3ac79da) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Consolidate the shared TanStack Query internals into one place. The `infiniteQueryOptions` assembly, the react-query suspense variants, and the repeated `plugin.ts` option-resolution blocks now live in a single shared module instead of being copied across react-query, vue-query, and swr. Generated output is unchanged.

- [#640](https://github.com/kubb-labs/plugins/pull/640) [`22f1221`](https://github.com/kubb-labs/plugins/commit/22f122170dc2330e788d54e9c2278c03f867cfb8) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Drop the unused internal utils devDependency flagged by knip. None of these packages import from it, they use the shared internals package, `ast`, or their own `utils.ts` instead. Runtime behavior is unchanged.

- [#319](https://github.com/kubb-labs/plugins/pull/319) [`27fbf2f`](https://github.com/kubb-labs/plugins/commit/27fbf2f16bf4da0aba6e0966f521bb350c675681) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Share the query-options parameter builder across the TanStack plugins. The duplicated `getQueryOptionsParams` body now lives in one shared `buildQueryOptionsParams` helper, and each plugin delegates to it (vue-query keeps its `MaybeRefOrGetter` wrapping). No change to generated output.
- Updated dependencies [[`92482b1`](https://github.com/kubb-labs/plugins/commit/92482b1ee0a0b70c2bc0293f5d3d8dbd5519af75), [`451f3b7`](https://github.com/kubb-labs/plugins/commit/451f3b7a24eb95fb4881bee8de59839e81686386), [`7bf4c87`](https://github.com/kubb-labs/plugins/commit/7bf4c87304143708f7c7619b4af5013f40fb81cf)]:
  - @kubb/plugin-ts@5.0.0
