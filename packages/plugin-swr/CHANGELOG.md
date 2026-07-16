# @kubb/plugin-swr

## 5.0.0-beta.100

### Patch Changes

- Updated dependencies [[`326f59c`](https://github.com/kubb-labs/plugins/commit/326f59c382c24c2a11ee9144bb6d7bc41ffbc97e), [`369e4cd`](https://github.com/kubb-labs/plugins/commit/369e4cd22e37644bb671429a6bdf18c12b39d76e)]:
  - @kubb/plugin-ts@5.0.0-beta.100

## 5.0.0-beta.99

### Minor Changes

- [#687](https://github.com/kubb-labs/plugins/pull/687) [`d290530`](https://github.com/kubb-labs/plugins/commit/d290530a2b49823b20af29400ac69a02925c2292) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Keep the OpenAPI document's exact parameter names for path, query, and header parameters, instead of forcing them to camelCase (kubb-labs/plugins#631).

  ```ts
  export type UpdatePetQuery = {
    include_deleted?: boolean;
  };

  updatePet({ path: { pet_id: "1" }, query: { include_deleted: true } });
  ```

  There's no remapping step anymore, so a query or header name can't collide with a differently cased sibling, like `start_date` next to `startDate`.

  A path parameter still falls back to camelCase when its spec name isn't a valid identifier on its own (a hyphenated segment, say), since a few generators bind it directly as a variable. Query and header names are never touched.

### Patch Changes

- Updated dependencies [[`d290530`](https://github.com/kubb-labs/plugins/commit/d290530a2b49823b20af29400ac69a02925c2292)]:
  - @kubb/plugin-ts@5.0.0-beta.99

## 5.0.0-beta.98

### Patch Changes

- Updated dependencies [[`2488522`](https://github.com/kubb-labs/plugins/commit/24885221badaa73f8c7eb8bd6a9828d579c316b6)]:
  - @kubb/plugin-ts@5.0.0-beta.98

## 5.0.0-beta.95

### Patch Changes

- [#678](https://github.com/kubb-labs/plugins/pull/678) [`dfcb48f`](https://github.com/kubb-labs/plugins/commit/dfcb48f9c17a0ad4693100d092403396e3ac79da) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Consolidate the shared TanStack Query internals into `@internals/tanstack-query`. The `infiniteQueryOptions` assembly, the react-query suspense variants, and the repeated `plugin.ts` option-resolution blocks now live in one place instead of being copied across react-query, vue-query, and swr. Generated output is unchanged.

- [#668](https://github.com/kubb-labs/plugins/pull/668) [`d8654b0`](https://github.com/kubb-labs/plugins/commit/d8654b0e1b221b5db7a0137ed0b3da3eb80cb155) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Export the default resolver (`resolverReactQuery`, `resolverVueQuery`, `resolverSwr`, `resolverMsw`) and its type from the package index, matching plugin-ts, plugin-zod, plugin-faker, plugin-mcp, and plugin-cypress. Import it to reference the exact names a plugin generates or to build a custom resolver on top of the defaults.

- [#670](https://github.com/kubb-labs/plugins/pull/670) [`d069022`](https://github.com/kubb-labs/plugins/commit/d069022633b46fcacc8a7899780bd68e35b5f743) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Remove unused exports flagged by Fallow. Internal `factory.ts` helpers in `@kubb/plugin-ts` are now module-private, and the plugin `utils.ts` files no longer re-export helpers nothing imports. None of these symbols were part of a package's public `exports` map, so consumers are unaffected.

- [#668](https://github.com/kubb-labs/plugins/pull/668) [`d8654b0`](https://github.com/kubb-labs/plugins/commit/d8654b0e1b221b5db7a0137ed0b3da3eb80cb155) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Share the resolver naming templates through internal helpers instead of repeating them per plugin. The `param`, `response`, and `file.baseName` templates used by plugin-ts, plugin-zod, and plugin-faker now come from one implementation, and the query/mutation naming used by plugin-react-query, plugin-swr, and plugin-vue-query comes from a shared TanStack Query base. Generated output is unchanged.

- Updated dependencies [[`d069022`](https://github.com/kubb-labs/plugins/commit/d069022633b46fcacc8a7899780bd68e35b5f743), [`b37ad9b`](https://github.com/kubb-labs/plugins/commit/b37ad9b3c663f21b72ffdce947c984ce705ebf4d), [`d8654b0`](https://github.com/kubb-labs/plugins/commit/d8654b0e1b221b5db7a0137ed0b3da3eb80cb155)]:
  - @kubb/plugin-ts@5.0.0-beta.95

## 5.0.0-beta.94

### Patch Changes

- Updated dependencies [[`d815500`](https://github.com/kubb-labs/plugins/commit/d81550018b7cf65bcc4715c4adbf8949fcba5516)]:
  - @kubb/plugin-ts@5.0.0-beta.87

## 5.0.0-beta.87

### Patch Changes

- [#649](https://github.com/kubb-labs/plugins/pull/649) [`e59f005`](https://github.com/kubb-labs/plugins/commit/e59f005535a31a287c3a8faa6a967d69ce7b1dc1) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Remove dead code and redundant guards across the plugins. Generated output is unchanged.

  - Drop the always-true `hasCursorParam` guard in the infinite-query generators (react-query, vue-query)
  - Drop the no-op `.filter(Boolean)` over statically-imported generator lists (react-query, swr, vue-query), and use a conditional spread for the axios dependency list
  - Inline single-caller wrappers and collapse redundant conditionals (swr `getQueryOptionsParams`, swr operation-classification guard, vue-query mutation-key params, redoc options bag, cypress import guard, faker single-element `Set` lookups)

- Updated dependencies [[`e59f005`](https://github.com/kubb-labs/plugins/commit/e59f005535a31a287c3a8faa6a967d69ce7b1dc1)]:
  - @kubb/plugin-ts@5.0.0-beta.86

## 5.0.0-beta.86

### Minor Changes

- [#640](https://github.com/kubb-labs/plugins/pull/640) [`9809c98`](https://github.com/kubb-labs/plugins/commit/9809c98beaa51f59d45de299f55eb21f62afb09d) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Move each plugin resolver onto the new `@kubb/core` resolver API.

  The `default(name, type)` discriminator every resolver exported is gone. The built-in machinery now lives under `resolver.default`: `default.name` (the identifier casing primitive), `default.file` (the `FileNode` builder), plus `default.options`, `default.path`, `default.banner`, and `default.footer`. Generators call two injected top-level helpers, `resolver.name(name)` and `resolver.file(params, context)`, that delegate to `resolver.default.*` unless a plugin overrides them.

  ```ts
  // before
  resolverZod.default("list pets", "function"); // 'listPetsSchema'
  resolverTs.core.file({ name, extname: ".ts" }, context);
  // after
  resolverZod.name("list pets"); // 'listPetsSchema'
  resolverTs.file({ name, extname: ".ts" }, context);
  ```

  Each plugin's composite naming methods are grouped into namespaces and drop the `resolve*Name` prefix. Inside a namespace method `this` is the resolver root, so `this.name(...)` reaches the top-level caser.

  | Before                                                                 | After                                       |
  | ---------------------------------------------------------------------- | ------------------------------------------- |
  | `resolver.resolveTypeName`                                             | `resolver.name`                             |
  | `resolver.resolveResponseStatusName`                                   | `resolver.response.status`                  |
  | `resolver.resolveResponsesName`                                        | `resolver.response.responses`               |
  | `resolver.resolveBodyName`                                             | `resolver.response.body`                    |
  | `resolver.resolvePathName` / `resolveQueryName` / `resolveHeadersName` | `resolver.param.path` / `query` / `headers` |
  | `resolver.resolveQueryName` (react/vue/swr)                            | `resolver.query.name`                       |
  | `resolver.resolveClassName`                                            | `resolver.className`                        |

  File-name casing rides on the `file` params. Pass `resolveName` to change how the base name is cased, as in `this.default.file({ ...params, resolveName: (name) => toFilePath(name, pascalCase) }, context)`. A custom resolver overrides the top-level `name`/`file` directly, with no `default:` block, and merges with `mergeResolver`, so a partial override keeps every other built-in helper.

- [#637](https://github.com/kubb-labs/plugins/pull/637) [`55f28f0`](https://github.com/kubb-labs/plugins/commit/55f28f0b3d9b0a070066b8b72ecacb6c8d1ab29a) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Simplify the resolver naming API so the request-part resolvers line up with the generated object keys, and drop the redundant `resolvePathName`.

  `resolvePathName(name, type)` duplicated `default(name, type)` on every resolver, so it is removed. Call `default` directly where you previously called `resolvePathName`:

  ```ts
  // before
  resolver.resolveFile(
    { name: resolver.resolvePathName(name, "file"), extname: ".ts" },
    context,
  );

  // after
  resolver.resolveFile(
    { name: resolver.default(name, "file"), extname: ".ts" },
    context,
  );
  ```

  The request-part resolvers now use the same `body` / `path` / `query` / `headers` vocabulary as the generated `RequestConfig` object:

  | Before                    | After                |
  | ------------------------- | -------------------- |
  | `resolveDataName`         | `resolveBodyName`    |
  | `resolvePathParamsName`   | `resolvePathName`    |
  | `resolveQueryParamsName`  | `resolveQueryName`   |
  | `resolveHeaderParamsName` | `resolveHeadersName` |

  The request body type also drops its `Data` suffix in favor of `Body`, so generated names change: `CreatePetData` becomes `CreatePetBody`, and the Zod schema `createPetDataSchema` becomes `createPetBodySchema`. Custom resolvers that override these methods, and code that imports the generated names, need updating.

  Note that `resolvePathName` is reused: the old file-name method of that name is gone, and it now names the grouped path-parameters resolver `resolvePathName(node, param)`.

### Patch Changes

- [#640](https://github.com/kubb-labs/plugins/pull/640) [`22f1221`](https://github.com/kubb-labs/plugins/commit/22f122170dc2330e788d54e9c2278c03f867cfb8) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Drop the unused `@internals/utils` devDependency flagged by knip. None of these packages import from it, they use `@internals/shared`, `ast`, or their own `utils.ts` instead. Runtime behavior is unchanged.

- [#643](https://github.com/kubb-labs/plugins/pull/643) [`bee30b7`](https://github.com/kubb-labs/plugins/commit/bee30b7f0f09eef934a26a768fedd840461a1175) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Update to `@kubb/core` 5.0.0-beta.89 and adopt its single-options resolver API.

  `resolver.file` and `resolver.default.file`/`default.path` take one options object now, so calls pass `{ ...params, root, output, group }` instead of a second `context` argument. The `plugin-faker`, `plugin-ts`, and `plugin-zod` resolvers build file names through `file: { baseName }` in place of the removed `resolveName` hook, which restores the caser-based file names (a faker mock lands in `createPetFaker.ts`).

- [#647](https://github.com/kubb-labs/plugins/pull/647) [`a478235`](https://github.com/kubb-labs/plugins/commit/a4782357b8affdc77c729688bb62548c8bad4dbb) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Restore grouped query/path/header parameter types in `plugin-ts`, fixing kubb-labs/plugins#632.

  **`plugin-ts`**: query, path, and header parameters are grouped back into a single named type per
  operation (`LoginUserQuery`, `LoginUserPath`, `LoginUserHeaders`), matching v4's `LoginUserQueryParams`
  behavior instead of exploding every parameter into its own top-level type
  (`LoginUserQueryUsername`, `LoginUserQueryPassword`, ...). Each grouped type keeps the original
  parameter's JSDoc (`@description`, `@type`, ...), and is referenced by name from the operation's
  grouped request-options type, which is renamed from `RequestConfig` to `Options` (`LoginUserOptions`)
  to stop overlapping with the runtime client's own `RequestConfig` type. The request body type is
  similarly renamed from `Data` to `Body` (`CreatePetBody`) to match its field name in `Options`.

  Downstream client and hook generators (`plugin-fetch`, `plugin-axios`, `plugin-react-query`,
  `plugin-vue-query`, `plugin-swr`, `plugin-cypress`, `plugin-mcp`) pick up the renamed `Options` type
  automatically.

  **`plugin-faker`**: mock factories for query/path/header parameters are now generated per group
  (`createLoginUserQuery()`) instead of per individual parameter, matching the grouped types above.
  This also fixes a latent bug where multiple parameters in the same group collided on the same
  generated mock function name and imported a type that no longer resolved to that single parameter.

- Updated dependencies [[`bee30b7`](https://github.com/kubb-labs/plugins/commit/bee30b7f0f09eef934a26a768fedd840461a1175), [`9809c98`](https://github.com/kubb-labs/plugins/commit/9809c98beaa51f59d45de299f55eb21f62afb09d), [`a478235`](https://github.com/kubb-labs/plugins/commit/a4782357b8affdc77c729688bb62548c8bad4dbb), [`55f28f0`](https://github.com/kubb-labs/plugins/commit/55f28f0b3d9b0a070066b8b72ecacb6c8d1ab29a)]:
  - @kubb/plugin-ts@5.0.0-beta.85

## 5.0.0-beta.85

### Patch Changes

- [#633](https://github.com/kubb-labs/plugins/pull/633) [`c374262`](https://github.com/kubb-labs/plugins/commit/c3742623da739018d9610a0cbb274ab8e9e30322) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Send query and header parameters with the names the OpenAPI document declares (kubb-labs/plugins#631).

  The generated types keep camelCase keys (`include_deleted` becomes `includeDeleted`), but the client used to serialize those camelCased keys straight onto the request, so an API expecting `include_deleted` or `X-API-Key` never received them. Generated clients and SDK methods now remap the keys back to the spec names before the request goes out:

  ```ts
  return request({
    method: "POST",
    url: "/pets/{petId}",
    ...config,
    query: config.query
      ? { include_deleted: config.query.includeDeleted }
      : config.query,
  });
  ```

  The remap is only emitted for operations where a name actually changes. Path parameters were already correct, since the URL template placeholders are renamed in sync with the `path` keys. Per-parameter `styles` for query, header, and cookie are now keyed by the spec name to match the serialized keys.

  `@kubb/plugin-cypress` shares the same remap rendering now, which also fixes its generated `cy.request` calls for renamed params whose camelCased name is not a bare identifier (for example `2fa-token`).

## 5.0.0-beta.84

### Patch Changes

- Updated dependencies [[`b85a648`](https://github.com/kubb-labs/plugins/commit/b85a6483ac7aa08743200bba6abfbee7fa0c9722)]:
  - @kubb/plugin-ts@5.0.0-beta.84

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

- [#616](https://github.com/kubb-labs/plugins/pull/616) [`bc3c364`](https://github.com/kubb-labs/plugins/commit/bc3c3643702cbd7a6eb7797c837c81ac332e2e87) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Change the default `query.methods`/`mutation.methods` values from lowercase (`['get']`, `['post', 'put', 'patch', 'delete']`) to uppercase (`['GET']`, `['POST', 'PUT', 'PATCH', 'DELETE']`), matching the HTTP method token casing defined in RFC 7231 (and RFC 2616 before it). Matching against the operation's method was already case-insensitive, so this doesn't change generated output, only the documented and default casing.

- Updated dependencies [[`756830d`](https://github.com/kubb-labs/plugins/commit/756830d28ec98fde78e63e397d0214fed7b46a34), [`5db1f7a`](https://github.com/kubb-labs/plugins/commit/5db1f7a8eb8501489c40949423f7debf5f8ed26a)]:
  - @kubb/plugin-ts@5.0.0-beta.82

## 5.0.0-beta.81

### Minor Changes

- [#608](https://github.com/kubb-labs/plugins/pull/608) [`f609914`](https://github.com/kubb-labs/plugins/commit/f609914d1799d90d31f752786e54901b716ce4fe) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Remove the inert `validator` option. It never generated validation code: the hooks call the client operation, and the client plugin bakes validation into that operation. Set `validator` on `pluginAxios` or `pluginFetch` instead.

  Migration: delete `validator` from `pluginReactQuery`, `pluginVueQuery`, and `pluginSwr`, and set it on the client plugin.

### Patch Changes

- [#607](https://github.com/kubb-labs/plugins/pull/607) [`6478657`](https://github.com/kubb-labs/plugins/commit/64786578b8b3b631bac36c79ff3b6105fe32e24e) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Correct the documented `mutation.methods` default so the JSDoc matches the runtime. The query plugins already treat `patch` as a mutation method, so the default reads `['post', 'put', 'patch', 'delete']`.

- Updated dependencies []:
  - @kubb/plugin-ts@5.0.0-beta.81

## 5.0.0-beta.80

### Patch Changes

- Updated dependencies []:
  - @kubb/plugin-ts@5.0.0-beta.80
  - @kubb/plugin-zod@5.0.0-beta.80

## 5.0.0-beta.79

### Minor Changes

- [#558](https://github.com/kubb-labs/plugins/pull/558) [`4e0906b`](https://github.com/kubb-labs/plugins/commit/4e0906b93bcb3d37441857380e119204264afb3a) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Negotiate and discriminate multiple response content types.

  A generated call now takes a `contentType: { request, response }` object. The `request` key picks the body format and the `response` key sets the `Accept` header. Both default to what the spec declares and stay overridable, and a bare `contentType: 'application/json'` string still selects the request type, so existing calls keep working.

  When a status documents more than one content type, the result reports the type the server returned on `result.contentType`, next to `status` and `data`, so a caller can narrow `data` by it.

  ```ts
  const result = await getPetById({
    path: { petId: "1" },
    contentType: { response: "application/xml" },
  });

  if (result.status === 200) {
    const { data, contentType } = result;
    switch (contentType) {
      case "application/json":
        console.log("JSON pet:", data.name);
        break;
      case "application/xml":
        console.log("XML pet:", data.id);
        break;
    }
  }
  ```

  - `plugin-ts` discriminates a status that documents several content types by content type in the `<Name>Responses` record, so `result.contentType` narrows `result.data`. The standalone `<Name>StatusNNN` alias stays the plain body union, and the individual per-content-type variant types (`GetPetByIdStatus200Json`, `GetPetByIdStatus200Xml`) are kept.
  - `plugin-fetch` and `plugin-axios` add `deserializers` and `bodySerializers` maps to `RequestConfig` and `ClientConfig`, keyed by content type and matched with the charset stripped, for formats the runtime does not decode itself such as `application/xml`. The negotiated content type rides on `result.contentType` and on `ResponseError`.
  - `plugin-react-query`, `plugin-vue-query`, and `plugin-swr` thread the `contentType` option through as the `{ request?, response? }` object.
  - `plugin-zod` and `plugin-faker` emit one schema or mock per response content type plus a union alias, with variant names that line up across the plugins through the shared naming helpers.
  - `plugin-msw` prefers the `application/json` content type for the mocked response when a status declares several.

  Single-content-type operations generate the same output as before. The breaking change is that the result now carries `contentType`, and the per-status responses record shape changes for a status with several content types.

- [#541](https://github.com/kubb-labs/plugins/pull/541) [`b66aeb7`](https://github.com/kubb-labs/plugins/commit/b66aeb79c9df5691ad75626e8125f8bf33e83e78) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - The `parser` option is renamed to `validator` across the client and query plugins. Set `validator: 'zod'` (or `{ request: 'zod', response: 'zod' }`) where you previously set `parser`. The accepted values are unchanged.

  Generated clients pass the schema straight to the `validator` slot instead of wrapping it in a `.parse(data)` call. The slot takes a Standard Schema validator, and only `client.ts` calls `validateStandardSchema`, so the helper stays in one place instead of being imported into every operation file.

  A `validateStandardSchema` helper is injected into `.kubb/standardSchema.ts` next to the client. It handles sync and async `validate()` results and throws `ParseError({ issues })` on failure, so callers get a consistent `{ issues }` array instead of a raw `ZodError`. Any schema that exposes `~standard.validate` works, including zod, valibot, and arktype.

  Error-body validation now runs on the throwing path too. `validator.error` executes before `ResponseError` is constructed, so `error.data` always holds the validated body regardless of the `throwOnError` setting.

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

- [#498](https://github.com/kubb-labs/plugins/pull/498) [`9912bc6`](https://github.com/kubb-labs/plugins/commit/9912bc6473a668330a114bf175415562decaa5f0) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Spread the selected generators into `ctx.addGenerator` so the call matches the narrowed `@kubb/core` signature, which now takes generators as separate arguments instead of a bare array.

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
