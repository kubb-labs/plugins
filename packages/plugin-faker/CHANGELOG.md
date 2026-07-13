# @kubb/plugin-faker

## 5.0.0-beta.96

### Patch Changes

- Updated dependencies [[`2488522`](https://github.com/kubb-labs/plugins/commit/24885221badaa73f8c7eb8bd6a9828d579c316b6)]:
  - @kubb/plugin-ts@5.0.0-beta.96

## 5.0.0-beta.95

### Minor Changes

- [#669](https://github.com/kubb-labs/plugins/pull/669) [`b37ad9b`](https://github.com/kubb-labs/plugins/commit/b37ad9b3c663f21b72ffdce947c984ce705ebf4d) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Resolve schema ref imports through `resolver.imports` and ref names through `resolveRefName` instead of the removed `adapter.getImports` and `nameMapping` printer options. Generated output is unchanged. This release requires the matching `@kubb/core` and `@kubb/adapter-oas` that ship `resolver.imports` and stamp `targetName` on collision-renamed refs.

### Patch Changes

- [#668](https://github.com/kubb-labs/plugins/pull/668) [`d8654b0`](https://github.com/kubb-labs/plugins/commit/d8654b0e1b221b5db7a0137ed0b3da3eb80cb155) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Share the resolver naming templates through internal helpers instead of repeating them per plugin. The `param`, `response`, and `file.baseName` templates used by plugin-ts, plugin-zod, and plugin-faker now come from one implementation, and the query/mutation naming used by plugin-react-query, plugin-swr, and plugin-vue-query comes from a shared TanStack Query base. Generated output is unchanged.

- Updated dependencies [[`d069022`](https://github.com/kubb-labs/plugins/commit/d069022633b46fcacc8a7899780bd68e35b5f743), [`b37ad9b`](https://github.com/kubb-labs/plugins/commit/b37ad9b3c663f21b72ffdce947c984ce705ebf4d), [`d8654b0`](https://github.com/kubb-labs/plugins/commit/d8654b0e1b221b5db7a0137ed0b3da3eb80cb155)]:
  - @kubb/plugin-ts@5.0.0-beta.95

## 5.0.0-beta.87

### Patch Changes

- [#656](https://github.com/kubb-labs/plugins/pull/656) [`d815500`](https://github.com/kubb-labs/plugins/commit/d81550018b7cf65bcc4715c4adbf8949fcba5516) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Narrow the OpenAPI adapter through a shared `getOasAdapter` helper instead of an unchecked `as` assertion. When a non-OpenAPI adapter is configured, the zod, TypeScript, and faker generators now throw a clear error naming `adapterOas` rather than silently reading `undefined` options. AST node narrowing in `@kubb/plugin-ts` uses type guards (`ts.isTypeLiteralNode`, `typeof`) in place of casts.

- Updated dependencies [[`d815500`](https://github.com/kubb-labs/plugins/commit/d81550018b7cf65bcc4715c4adbf8949fcba5516)]:
  - @kubb/plugin-ts@5.0.0-beta.87

## 5.0.0-beta.86

### Patch Changes

- [#649](https://github.com/kubb-labs/plugins/pull/649) [`e59f005`](https://github.com/kubb-labs/plugins/commit/e59f005535a31a287c3a8faa6a967d69ce7b1dc1) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Remove dead code and redundant guards across the plugins. Generated output is unchanged.

  - Drop the always-true `hasCursorParam` guard in the infinite-query generators (react-query, vue-query)
  - Drop the no-op `.filter(Boolean)` over statically-imported generator lists (react-query, swr, vue-query), and use a conditional spread for the axios dependency list
  - Inline single-caller wrappers and collapse redundant conditionals (swr `getQueryOptionsParams`, swr operation-classification guard, vue-query mutation-key params, redoc options bag, cypress import guard, faker single-element `Set` lookups)

- Updated dependencies [[`e59f005`](https://github.com/kubb-labs/plugins/commit/e59f005535a31a287c3a8faa6a967d69ce7b1dc1)]:
  - @kubb/plugin-ts@5.0.0-beta.86

## 5.0.0-beta.85

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

## 5.0.0-beta.84

### Patch Changes

- [#623](https://github.com/kubb-labs/plugins/pull/623) [`b85a648`](https://github.com/kubb-labs/plugins/commit/b85a6483ac7aa08743200bba6abfbee7fa0c9722) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Reach the AST helpers through the `ast` namespace from `kubb/kit` instead of the removed `kubb/ast` subpath. Generated output is unchanged.

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

- Updated dependencies [[`756830d`](https://github.com/kubb-labs/plugins/commit/756830d28ec98fde78e63e397d0214fed7b46a34), [`5db1f7a`](https://github.com/kubb-labs/plugins/commit/5db1f7a8eb8501489c40949423f7debf5f8ed26a)]:
  - @kubb/plugin-ts@5.0.0-beta.82

## 5.0.0-beta.81

### Minor Changes

- [#608](https://github.com/kubb-labs/plugins/pull/608) [`65f0793`](https://github.com/kubb-labs/plugins/commit/65f07934de4cabf16ee1bebde3f22773ad97ea44) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Remove the `mapper` option, matching the v5 removal on the other plugins. Use a macro to rewrite the property's schema before printing, or a printer override to change how a schema type renders.

  Migration: replace a `mapper` entry with a macro that rewrites the property's schema, such as turning `status` into an enum of a subset of its spec values. The default printer then emits the same `faker.helpers.arrayElement([...])` call, typed against the plugin-ts output, so pick values the type allows.

### Patch Changes

- Updated dependencies []:
  - @kubb/plugin-ts@5.0.0-beta.81

## 5.0.0-beta.80

### Patch Changes

- Updated dependencies []:
  - @kubb/plugin-ts@5.0.0-beta.80

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

### Patch Changes

- [#577](https://github.com/kubb-labs/plugins/pull/577) [`190f5a2`](https://github.com/kubb-labs/plugins/commit/190f5a2ede0394606fc1144f8ae3505ad4a16519) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Drop `any` from generated output. Faker mocks type `arrayElement` element values from the schema (inferring literals for plain enums, the precise property type when nested) and emit a cyclic self-reference as `undefined as unknown as <Type>` instead of `undefined as any`. MSW handlers omit the response-body generic so it falls back to msw's `DefaultBodyType` instead of `any`. Runtime behavior is unchanged.

- [#579](https://github.com/kubb-labs/plugins/pull/579) [`ba80c04`](https://github.com/kubb-labs/plugins/commit/ba80c0427d6a42ce3131323b3f48fa16f2965aad) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Resolve type/schema references to their renamed target when a component name collides.

  When two components share a name across sections or by case (e.g. `#/components/schemas/Order` and `#/components/requestBodies/Order`, or `Variant`/`variant`), the adapter disambiguates the emitted files (`OrderSchema`, `OrderRequest`, `Variant2`) and records the rename in a `nameMapping` keyed by the full `$ref` path. The printers previously emitted the un-disambiguated short name for the reference, producing a dangling reference such as `CreateOrderStatus201 = Order` with an `import { Order } from './Order.ts'` that no file satisfies (`TS2307`).

  Each printer's `ref()` handler now resolves the referenced name through `nameMapping` (keyed by `node.ref`) before falling back to the short ref name, so the type reference and the generated component match. The generators plumb `nameMapping` from `ctx.meta`. This is a no-op for specs without colliding component names.

  Requires `@kubb/adapter-oas` to expose `nameMapping` on `InputMeta` and resolve collision-renamed imports.

- Updated dependencies [[`e20770b`](https://github.com/kubb-labs/plugins/commit/e20770b6baf5f5274e3dd8005a06580787274e3e), [`4309b83`](https://github.com/kubb-labs/plugins/commit/4309b83abcbe322bad76fedd466396ba32bdcd4f), [`4e0906b`](https://github.com/kubb-labs/plugins/commit/4e0906b93bcb3d37441857380e119204264afb3a), [`ba80c04`](https://github.com/kubb-labs/plugins/commit/ba80c0427d6a42ce3131323b3f48fa16f2965aad), [`3992fde`](https://github.com/kubb-labs/plugins/commit/3992fde9273c175148dd3286161eb22338256f7d)]:
  - @kubb/plugin-ts@5.0.0-beta.79

## 5.0.0-beta.77

### Patch Changes

- Updated dependencies [[`fae9f47`](https://github.com/kubb-labs/plugins/commit/fae9f470468870ed7015f2c910fd817c7e7daeef), [`455e6f1`](https://github.com/kubb-labs/plugins/commit/455e6f1c1f9047fb5cb7d4d12038dc2b5eb4422a)]:
  - @kubb/plugin-ts@5.0.0-beta.77

## 5.0.0-beta.76

### Patch Changes

- Updated dependencies [[`4c7e449`](https://github.com/kubb-labs/plugins/commit/4c7e449383a8888273b1e7f32222a5d869d9c4d8)]:
  - @kubb/plugin-ts@5.0.0-beta.76

## 5.0.0-beta.75

### Patch Changes

- Updated dependencies []:
  - @kubb/plugin-ts@5.0.0-beta.75

## 5.0.0-beta.74

### Patch Changes

- Updated dependencies []:
  - @kubb/plugin-ts@5.0.0-beta.74

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

### Patch Changes

- [#447](https://github.com/kubb-labs/plugins/pull/447) [`3b4b366`](https://github.com/kubb-labs/plugins/commit/3b4b3664d8ce4e12694d150dfed6c7817625e950) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Drop shapeless `allOf` members from generated mocks instead of spreading `...undefined`. An `allOf` that combines a `$ref` with a metadata-only schema (just `description`/`example`) produced invalid `{...createEquipmentCategory(), ...undefined}`. The metadata-only member now drops out, leaving `createEquipmentCategory()`.

- [#473](https://github.com/kubb-labs/plugins/pull/473) [`fca3007`](https://github.com/kubb-labs/plugins/commit/fca3007ceda865f7576157e57bcc70d9cbe37add) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Move the TypeScript function-parameter model and the `createOperationParams` builder into `@kubb/plugin-ts`, next to `functionPrinter`. `@kubb/plugin-ts` now exports `createFunctionParameter`, `createFunctionParameters`, `createTypeLiteral`, `createIndexedAccessType`, `createObjectBindingPattern`, and `createOperationParams` along with their types. Plugins import these from `@kubb/plugin-ts` instead of `@kubb/ast`, and the `caseParams` helper and `OperationParamsResolver` contract now come from the shared internals. Generated output is unchanged.

- [#439](https://github.com/kubb-labs/plugins/pull/439) [`7364067`](https://github.com/kubb-labs/plugins/commit/7364067a2800d70822f530c6ab29b3d007cbd4e2) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Reframe each plugin description and its keywords around Kubb instead of naming OpenAPI. The READMEs use the same wording.

- Updated dependencies [[`c29bd39`](https://github.com/kubb-labs/plugins/commit/c29bd3949c07ffd23be20a2a6b98eb5de887d913), [`fca3007`](https://github.com/kubb-labs/plugins/commit/fca3007ceda865f7576157e57bcc70d9cbe37add), [`8864aa7`](https://github.com/kubb-labs/plugins/commit/8864aa72ae813c24028989b320b3c6947331f80f), [`7364067`](https://github.com/kubb-labs/plugins/commit/7364067a2800d70822f530c6ab29b3d007cbd4e2), [`6d27528`](https://github.com/kubb-labs/plugins/commit/6d2752810ef46328bcb6b9495e4ff068c5ec43e8), [`4390631`](https://github.com/kubb-labs/plugins/commit/439063187de7b6d6b3fbeafe09a5391ab136bd20)]:
  - @kubb/plugin-ts@5.0.0-beta.73

## 5.0.0-beta.65

### Patch Changes

- Updated dependencies [[`f324806`](https://github.com/kubb-labs/plugins/commit/f32480645960533b8dffe5af273c5382fa0e4964)]:
  - @kubb/plugin-ts@5.0.0-beta.65

## 5.0.0-beta.64

### Major Changes

- [#408](https://github.com/kubb-labs/plugins/pull/408) [`d0dc716`](https://github.com/kubb-labs/plugins/commit/d0dc716d746cd7c64d9b75597ebe9312ba51051d) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Migrate the plugins to the reshaped `@kubb/ast` param and type model.

  A parameter type is now a plain `string`, so the `ast.createParamsType({ variant: 'reference', name })` wrapper is gone from every component. The query, header, and path grouping helpers (`resolveParamType`, `resolveGroupType`, `buildGroupParam`, `buildTypeLiteral`) are imported from `@kubb/ast` instead of being redefined in `internals/tanstack-query`. The `functionPrinter` keeps two modes, `declaration` and `call`; the `keys` and `values` modes are removed, and a destructured group renders from a single `FunctionParameter` whose name is an `ObjectBindingPattern` and whose type is a `TypeLiteral`. `@kubb/plugin-ts` now exports `renderType` for turning a type expression into source.

  Generated output is unchanged.

- [#417](https://github.com/kubb-labs/plugins/pull/417) [`0aa9573`](https://github.com/kubb-labs/plugins/commit/0aa9573825f6eff87e3301377016085ff334bc39) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Replace the `transformer` option with `macros`.

  Every plugin now takes `macros?: Array<ast.Macro>` instead of `transformer?: ast.Visitor`, and registers them with `ctx.setMacros` in `kubb:plugin:setup`. Macros are named and composable, so a list runs in order and a later macro sees the output of an earlier one. Move a single visitor into a macro by wrapping it: `macros: [{ name: 'my-macro', schema(node) { … } }]`.

### Patch Changes

- [#414](https://github.com/kubb-labs/plugins/pull/414) [`451f3b7`](https://github.com/kubb-labs/plugins/commit/451f3b7a24eb95fb4881bee8de59839e81686386) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Consume the shared schema-traversal helpers (`mapSchemaProperties`, `mapSchemaMembers`,
  `mapSchemaItems`, `lazyGetter`) from `@kubb/ast/utils` in the zod, zod-mini, faker, and TypeScript
  printers, replacing the per-printer property, member, and item walks. Generated output is unchanged.
- Updated dependencies [[`058c7ff`](https://github.com/kubb-labs/plugins/commit/058c7ffe6d8959c718543782f95d4f7bbef1cbe7), [`d0dc716`](https://github.com/kubb-labs/plugins/commit/d0dc716d746cd7c64d9b75597ebe9312ba51051d), [`0aa9573`](https://github.com/kubb-labs/plugins/commit/0aa9573825f6eff87e3301377016085ff334bc39), [`451f3b7`](https://github.com/kubb-labs/plugins/commit/451f3b7a24eb95fb4881bee8de59839e81686386)]:
  - @kubb/plugin-ts@5.0.0-beta.64

## 5.0.0-beta.56

### Major Changes

- [#374](https://github.com/kubb-labs/plugins/pull/374) [`501899f`](https://github.com/kubb-labs/plugins/commit/501899fc2445f3cbb302d4126142d45818b62986) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Adopt the explicit `output.mode` option from `@kubb/core`.

  Kubb no longer infers a single file from an `output.path` ending in `.ts`. Set `output.mode: 'file'` to write everything into one file, `output.mode: 'group'` to write one file per group (which requires the `group` option), or leave it as the default `output.mode: 'directory'` for one file per operation or schema. A config that used a file-style `output.path` (e.g. `path: 'models.ts'`) now needs `output.mode: 'file'` to keep that layout.

  Each plugin's `Options` type now uses the `OutputOptions` union, so `output.mode: 'group'` statically requires the `group` option. The generators no longer gate imports on `ctx.getMode`, since `@kubb/ast` strips self-imports for the consolidated modes.

### Minor Changes

- [#350](https://github.com/kubb-labs/plugins/pull/350) [`35a600d`](https://github.com/kubb-labs/plugins/commit/35a600d7516f11270afbda25ed89e5bb8a9c9603) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Default tag group folders to the plain camelCased tag.

  With `group: { type: 'tag' }`, every plugin now writes to `pet/` instead of `petController/` (and the Cypress and MCP plugins drop the `Requests` suffix too). The suffixes were a leftover convention nothing in the output referenced. To keep the old layout, pass `group: { type: 'tag', name: ({ group }) => \`${group}Controller\` }`.

### Patch Changes

- [#328](https://github.com/kubb-labs/plugins/pull/328) [`47713fa`](https://github.com/kubb-labs/plugins/commit/47713fa4d933484fd4661782025e098be2300889) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Replace the stale v4 `barrelType: 'named'` key in every plugin's `output` destructuring default with the v5 `barrel: { type: 'named' }` object. Generated output is unchanged: `@kubb/plugin-barrel` never read the dead key and already fell back to `{ type: 'named' }`. The code now matches the documented default in each plugin's option docs.

  Docs metadata fixes in the same pass: `@kubb/plugin-zod` documents that `importPath` defaults to `'zod/mini'` when `mini` is enabled, and `@kubb/plugin-swr` documents the `parser` default as the boolean `false` instead of the string `'false'`.

- [#349](https://github.com/kubb-labs/plugins/pull/349) [`fdd85ac`](https://github.com/kubb-labs/plugins/commit/fdd85acb9f6989dbf332eee204e4a8da238d0a74) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Group the `plugin-ts` enum options under a single `enum` object and add a `constCasing` control (kubb-labs/plugins#334).

  The four loose top-level options collapse into one grouped object with clearer names:

  ```typescript
  // before
  pluginTs({
    enumType: "asConst",
    enumTypeSuffix: "Key",
    enumKeyCasing: "none",
  });

  // after
  pluginTs({
    enum: {
      type: "asConst",
      constCasing: "camelCase",
      typeSuffix: "Key",
      keyCasing: "none",
    },
  });
  ```

  The new `enum.constCasing` (`'camelCase'` default, or `'pascalCase'`) controls the casing of the generated const variable, which makes the old `enumType: 'asPascalConst'` redundant. `asPascalConst` is removed, so use `enum: { type: 'asConst', constCasing: 'pascalCase' }` instead.

  Pairing `constCasing: 'pascalCase'` with `typeSuffix: ''` now emits a const and a type that share the schema's exact name (`export const VehicleType` + `export type VehicleType`), and the barrel exports that name once instead of producing a duplicate `export type`. This matches the convention most hand-written codebases use, so migrating an existing project keeps every annotation and value reference intact.

  `plugin-faker` reads the new `enum.type` / `enum.typeSuffix` shape from `plugin-ts`.

- [#396](https://github.com/kubb-labs/plugins/pull/396) [`d5ee139`](https://github.com/kubb-labs/plugins/commit/d5ee1391ea1f66b27f8c37fc89b14bb3895af920) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Remove unused code flagged by knip. None of the removed symbols are part of any package's `exports`, and all were unused across the kubb and plugins repos. Runtime behavior is unchanged.

  - `@kubb/plugin-ts`: drop the dead `createNamespaceDeclaration`, `createParenthesizedType`, `createNull`, `createIndexedAccessTypeNode`, and `createTypeOperatorNode` factory wrappers (the TypeScript `factory` methods they aliased are still called directly where needed).
  - `@kubb/plugin-faker`: drop the redundant `export` on the internal-only `getScalarType`.

- [#398](https://github.com/kubb-labs/plugins/pull/398) [`d7b6152`](https://github.com/kubb-labs/plugins/commit/d7b615277ffc94c157471a39f92cfd0c4f60e42f) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Stop shipping `extension.yaml` in the npm packages and remove the yaml generator (`plugins/` sources and `scripts/build-extension-yaml.ts`). Extension metadata now lives in the platform repo (`kubb-labs/platform`, `extensions/` at the repo root) and the options are documented on each plugin's kubb.dev page.

- [#374](https://github.com/kubb-labs/plugins/pull/374) [`83db03f`](https://github.com/kubb-labs/plugins/commit/83db03ffe3c93d961ae54e052e908e462d46608a) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Drop the `'group'` value from the documented `output.mode` option. `output.mode` now accepts `'directory' | 'file'`, and the `group` option organizes `'directory'` output into per-tag or per-path subdirectories. This tracks the removal of the per-group consolidation mode in `@kubb/core`.

- Updated dependencies [[`47713fa`](https://github.com/kubb-labs/plugins/commit/47713fa4d933484fd4661782025e098be2300889), [`35a600d`](https://github.com/kubb-labs/plugins/commit/35a600d7516f11270afbda25ed89e5bb8a9c9603), [`fdd85ac`](https://github.com/kubb-labs/plugins/commit/fdd85acb9f6989dbf332eee204e4a8da238d0a74), [`d5ee139`](https://github.com/kubb-labs/plugins/commit/d5ee1391ea1f66b27f8c37fc89b14bb3895af920), [`501899f`](https://github.com/kubb-labs/plugins/commit/501899fc2445f3cbb302d4126142d45818b62986), [`d7b6152`](https://github.com/kubb-labs/plugins/commit/d7b615277ffc94c157471a39f92cfd0c4f60e42f), [`83db03f`](https://github.com/kubb-labs/plugins/commit/83db03ffe3c93d961ae54e052e908e462d46608a)]:
  - @kubb/plugin-ts@5.0.0-beta.56

## 5.0.0-beta.44

### Minor Changes

- [#323](https://github.com/kubb-labs/plugins/pull/323) [`92482b1`](https://github.com/kubb-labs/plugins/commit/92482b1ee0a0b70c2bc0293f5d3d8dbd5519af75) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Emit generated string literals with single quotes and tighten client function spacing so output reads cleanly without a formatter. The shared `stringify` helper now produces single-quoted literals, so zod enums, `.describe(...)`, defaults, and faker values use single quotes. The client component drops the redundant `<br/>` breaks: the config destructure is followed by one blank line (not two), and `requestData`/`formData` are grouped with no blank between them. HTTP method, content type, and response type are emitted single-quoted via `stringify`.

- [#323](https://github.com/kubb-labs/plugins/pull/323) [`92482b1`](https://github.com/kubb-labs/plugins/commit/92482b1ee0a0b70c2bc0293f5d3d8dbd5519af75) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Assemble generated schemas and query options so they read cleanly before any formatter runs. Object schemas use the shared `ast.buildObject` helper (two-space indentation, closing brace at column zero, unquoted keys when valid, trailing commas), and `z.union`/`z.discriminatedUnion`/`z.tuple` use `ast.buildList` so object members nest one level deeper instead of sitting inline. The infinite-query option bodies in `@kubb/plugin-react-query` and `@kubb/plugin-vue-query` are re-authored with consistent two-space indentation so their options no longer drop to column zero. Requires the `@kubb/ast` release that adds `buildObject`/`buildList`/`objectKey`.

### Patch Changes

- [#319](https://github.com/kubb-labs/plugins/pull/319) [`27fbf2f`](https://github.com/kubb-labs/plugins/commit/27fbf2f16bf4da0aba6e0966f521bb350c675681) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Import the renderer as `jsxRenderer` from `@kubb/renderer-jsx`. The `jsxRendererSync` and `jsxRenderer` exports were the same function behind two names, and the next `@kubb/renderer-jsx` major keeps only `jsxRenderer`. Generated output is unchanged.

- [#323](https://github.com/kubb-labs/plugins/pull/323) [`92482b1`](https://github.com/kubb-labs/plugins/commit/92482b1ee0a0b70c2bc0293f5d3d8dbd5519af75) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Consume the shared codegen helpers (`stringify`, `trimQuotes`, `jsStringEscape`, `toRegExpString`,
  `stringifyObject`, `getNestedAccessor`, `buildJSDoc`) from `@kubb/ast/utils` instead of keeping
  local copies in `@internals/utils`. Generated output is unchanged.
- Updated dependencies [[`27fbf2f`](https://github.com/kubb-labs/plugins/commit/27fbf2f16bf4da0aba6e0966f521bb350c675681), [`92482b1`](https://github.com/kubb-labs/plugins/commit/92482b1ee0a0b70c2bc0293f5d3d8dbd5519af75)]:
  - @kubb/plugin-ts@5.0.0-beta.44

## 5.0.0-beta.42

### Patch Changes

- Updated dependencies [[`e2e83ad`](https://github.com/kubb-labs/plugins/commit/e2e83ada993bcc02f2a382862cf2fb3a930fc405), [`7075bff`](https://github.com/kubb-labs/plugins/commit/7075bffb7c06f6b04c8470c0761ef808615f45eb)]:
  - @kubb/plugin-ts@5.0.0-beta.42

## 5.0.0-beta.36

### Patch Changes

- Updated dependencies [[`9f9e0fa`](https://github.com/kubb-labs/plugins/commit/9f9e0fae5d361ad1fd1465af2f34b4876b89ad0b)]:
  - @kubb/plugin-ts@5.0.0-beta.36

## 5.0.0-beta.35

### Patch Changes

- [`0aa1ff1`](https://github.com/kubb-labs/plugins/commit/0aa1ff1b9e74790931889a4569d91e66e47fabb1) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - sync packages with Kubb core

- Updated dependencies [[`0aa1ff1`](https://github.com/kubb-labs/plugins/commit/0aa1ff1b9e74790931889a4569d91e66e47fabb1)]:
  - @kubb/plugin-ts@5.0.0-beta.35

## 5.0.0-beta.33

### Patch Changes

- [#268](https://github.com/kubb-labs/plugins/pull/268) [`0c5a8e5`](https://github.com/kubb-labs/plugins/commit/0c5a8e557f4468cb8b6f3a5afb347f66f06a2397) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Default the `locale` option to `'en'`. Generated mock files now import `fakerEN` from `@faker-js/faker` when no locale is set, instead of the base `faker` instance.

- Updated dependencies []:
  - @kubb/plugin-ts@5.0.0-beta.33

## 5.0.0-beta.31

### Minor Changes

- [#221](https://github.com/kubb-labs/plugins/pull/221) [`8a5e800`](https://github.com/kubb-labs/plugins/commit/8a5e8004e49d2125e9b89598e09d47645b7ad8ea) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Support multiple content types on requests and responses.
  - `plugin-ts` now emits a union of per-content-type variants for responses that declare more than one content type (e.g. `GetPetByIdStatus200 = GetPetByIdStatus200Json | GetPetByIdStatus200Xml`), mirroring the existing request-body behaviour. Single-content-type responses are unchanged.
  - `plugin-zod` and `plugin-faker` mirror this: they emit one schema/mock per content type plus a union alias for both responses and request bodies (e.g. `addPetStatus200Schema = z.union([addPetStatus200SchemaJson, addPetStatus200SchemaXml])`, and a `createAddPetStatus200` factory that picks between the per-content-type factories). Variant names line up across the three plugins via shared naming helpers.
  - `plugin-msw` prefers the `application/json` content type for the mocked response's `Content-Type` header when a response declares several.
  - The generated fetch client parses the response body based on the `Content-Type` header (JSON, text, blob) instead of always calling `res.json()`, honours an explicit `responseType` override, and serializes `application/x-www-form-urlencoded` bodies as `URLSearchParams`. Operations whose success response is a single binary/text content type now default `responseType` (e.g. `'blob'`), so file downloads work out of the box.

  Single-content-type operations are backwards-compatible — generated output is unchanged.

  Requires `@kubb/adapter-oas` and `@kubb/ast` with response `content` support.

### Patch Changes

- [#241](https://github.com/kubb-labs/plugins/pull/241) [`7bf4c87`](https://github.com/kubb-labs/plugins/commit/7bf4c87304143708f7c7619b4af5013f40fb81cf) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Replace the per-plugin `group` naming block (duplicated verbatim across nine plugins) with a shared `createGroupConfig` helper from `@internals/shared`. Each plugin's grouping behavior is preserved exactly — the `Controller`/`Requests` suffix and whether a user-provided `group.name` is honored are passed as options — so generated output is unchanged. Internal refactor only.

- Updated dependencies [[`8a5e800`](https://github.com/kubb-labs/plugins/commit/8a5e8004e49d2125e9b89598e09d47645b7ad8ea), [`7bf4c87`](https://github.com/kubb-labs/plugins/commit/7bf4c87304143708f7c7619b4af5013f40fb81cf)]:
  - @kubb/plugin-ts@5.0.0-beta.31

## 5.0.0-beta.30

### Patch Changes

- Updated dependencies [[`21accf1`](https://github.com/kubb-labs/plugins/commit/21accf11be058a252aded049a5d98e30eb6b4c32)]:
  - @kubb/plugin-ts@5.0.0-beta.30

## 5.0.0-beta.29

### Patch Changes

- [#226](https://github.com/kubb-labs/plugins/pull/226) [`299eede`](https://github.com/kubb-labs/plugins/commit/299eede6647b12684459c503addff704a1ead55a) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Align plugin release flow with the beta.29 core dependency update.

- Updated dependencies [[`299eede`](https://github.com/kubb-labs/plugins/commit/299eede6647b12684459c503addff704a1ead55a)]:
  - @kubb/plugin-ts@5.0.0-beta.29

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

- [#207](https://github.com/kubb-labs/plugins/pull/207) [`c029564`](https://github.com/kubb-labs/plugins/commit/c02956455485aecd496e4e00603ded5c0d0fbfea) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Fix `TS2322` errors in mocks generated for discriminated `oneOf` schemas (reported in kubb-labs/plugins#200).

  Each union variant was annotated with the whole-union indexed-access type (`NonNullable<Union>["prop"]`), which TypeScript collapses to a single union member and rejects the other variants' values. The faker printer now narrows each variant to its own discriminated branch via `Extract<NonNullable<Union>, { "<discriminator>": "<value>" }>`. Undiscriminated unions of objects fall back to `any` instead of leaking the whole-union index (also resolving the related `TS2339` symptom).

- [#209](https://github.com/kubb-labs/plugins/pull/209) [`3e114d1`](https://github.com/kubb-labs/plugins/commit/3e114d1101d58a567da223e2c14cb61d078c67c2) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Keep mocks for non-discriminated `oneOf` unions type-safe (kubb-labs/plugins#199).

  Building on the discriminated-union fix, members of a union without a discriminator now index each property via `(NonNullable<Union> & Record<K, unknown>)[K]` instead of falling back to `any`. A key carried by only some branches resolves to `unknown` rather than `any`, so the generated value stays type-checked. Single-object schemas keep their plain `NonNullable<T>[K]` types.

- Updated dependencies [[`c97c8cf`](https://github.com/kubb-labs/plugins/commit/c97c8cf7b8e5c3d29293056f586d4591f8414a9d)]:
  - @kubb/plugin-ts@5.0.0-beta.28

## 5.0.0-beta.27

### Patch Changes

- [#197](https://github.com/kubb-labs/plugins/pull/197) [`3871c83`](https://github.com/kubb-labs/plugins/commit/3871c83f4d949335915ede38efd8b3474e252877) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Sanitize generated identifiers that would otherwise start with a digit so they're valid JavaScript names.

  OpenAPI schemas/operations named `409`, `504AccountCancel`, etc. previously produced invalid output like `export const 409Schema = …` and `export interface 409 { … }`. Resolvers in `plugin-ts`, `plugin-zod`, `plugin-client`, and `plugin-faker` now run their PascalCase/camelCase results through a new `ensureValidVarName` helper, which prefixes the name with `_` when it isn't a syntactically valid identifier (leading digit or reserved word). File paths are unaffected.

  Reported in kubb-labs/plugins#196.

- Updated dependencies [[`3871c83`](https://github.com/kubb-labs/plugins/commit/3871c83f4d949335915ede38efd8b3474e252877)]:
  - @kubb/plugin-ts@5.0.0-beta.27

## 5.0.0-beta.25

### Patch Changes

- [#195](https://github.com/kubb-labs/plugins/pull/195) [`0446ce8`](https://github.com/kubb-labs/plugins/commit/0446ce881472c49bc66886c13066c8ae246e9a65) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Enforce `Array<T>` syntax (over `T[]`) via the oxlint `typescript/array-type` rule. Internal-only change; no runtime or API impact.

- [#188](https://github.com/kubb-labs/plugins/pull/188) [`57d79a2`](https://github.com/kubb-labs/plugins/commit/57d79a23ca628abad86c65ecca4aa282fa170aac) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Align plugin release flow with the beta.23 core dependency update.

- [#192](https://github.com/kubb-labs/plugins/pull/192) [`4ae19db`](https://github.com/kubb-labs/plugins/commit/4ae19db071d08514ff5f9c153d3c9adea30a253c) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Align plugin release flow with the beta.24 core dependency update.

- [`e7670fa`](https://github.com/kubb-labs/plugins/commit/e7670fadf2a822c71299ad9a827fd4226eaae55b) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - sync with kubb

- Updated dependencies [[`0446ce8`](https://github.com/kubb-labs/plugins/commit/0446ce881472c49bc66886c13066c8ae246e9a65), [`57d79a2`](https://github.com/kubb-labs/plugins/commit/57d79a23ca628abad86c65ecca4aa282fa170aac), [`4ae19db`](https://github.com/kubb-labs/plugins/commit/4ae19db071d08514ff5f9c153d3c9adea30a253c), [`e7670fa`](https://github.com/kubb-labs/plugins/commit/e7670fadf2a822c71299ad9a827fd4226eaae55b), [`eeefb2b`](https://github.com/kubb-labs/plugins/commit/eeefb2beb38ffe294bea771907baea026d2879b3)]:
  - @kubb/plugin-ts@5.0.0-beta.25

## 5.0.0-beta.22

### Patch Changes

- [`b528b32`](https://github.com/kubb-labs/plugins/commit/b528b3226d796a6aab5f1f6d45b575921da1341b) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - sync between core with same version

- Updated dependencies [[`b528b32`](https://github.com/kubb-labs/plugins/commit/b528b3226d796a6aab5f1f6d45b575921da1341b)]:
  - @kubb/plugin-ts@5.0.0-beta.22

## 5.0.0-beta.15

### Patch Changes

- [#163](https://github.com/kubb-labs/plugins/pull/163) [`234a4d7`](https://github.com/kubb-labs/plugins/commit/234a4d7c9dccb1f756447e8d70d4a5bec4dcf72f) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Align plugin release flow with the beta.12 core dependency update and run E2E CI against all schemas by default except isolated heavy schemas.

- Updated dependencies [[`234a4d7`](https://github.com/kubb-labs/plugins/commit/234a4d7c9dccb1f756447e8d70d4a5bec4dcf72f)]:
  - @kubb/plugin-ts@5.0.0-beta.15

## 5.0.0-beta.10

### Patch Changes

- [#147](https://github.com/kubb-labs/plugins/pull/147) [`752a6eb`](https://github.com/kubb-labs/plugins/commit/752a6eb6ab6a08d3c3422f826b2ed1f74f7a737e) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Fix potential Remote Code Execution in identifier validation.

  Replace `new Function()` usage in `isValidStrictIdentifier` with a safe regex check combined with a reserved-word allowlist. This eliminates the RCE attack surface without changing any observable behaviour.

- Updated dependencies []:
  - @kubb/plugin-ts@5.0.0-beta.10

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
  - @kubb/plugin-ts@5.0.0-beta.4

## 5.0.0-beta.3

### Minor Changes

- [#114](https://github.com/kubb-labs/plugins/pull/114) [`578afd6`](https://github.com/kubb-labs/plugins/commit/578afd666c5e864c7615f3bfe057118b49a21f6b) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Add `locale` option to generate mock data in a specific language.

  Set `locale` to any [Faker.js locale code](https://fakerjs.dev/api/localization.html) (e.g. `'de'`, `'fr'`, `'de_AT'`) and the generated file imports the matching localized faker instance instead of the default English one. Names, addresses, phone numbers, and other locale-aware fields then reflect the target region.

  ```ts
  pluginFaker({
    output: { path: "mocks" },
    locale: "de",
  });
  ```

  The generated output uses `import { fakerDE as faker } from '@faker-js/faker'` so all existing call sites remain unchanged.

### Patch Changes

- [#112](https://github.com/kubb-labs/plugins/pull/112) [`6a2a378`](https://github.com/kubb-labs/plugins/commit/6a2a3780c200ea261e321ac7df97c89518662e4d) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Fix cyclic-schema getters so property values are stable and construction never stack-overflows.

  Previously, objects with circular references (e.g. `Cat → Pet → Cat`) used plain lazy getters that both (a) called the recursive faker factory on every property access – returning a different random value each time – and (b) triggered infinite recursion when the object was spread during construction.

  The generated code now emits **memoizing getters**: on first access the value is computed, stored via `Object.defineProperty`, and returned; every subsequent access returns the cached value. The function body no longer spreads the object literal (which would invoke the getters), instead returning it directly and merging user-supplied `data` overrides through `Object.defineProperty` so that getter-only properties can be replaced without a setter.

  Result: `myCat.archEnemy === myCat.archEnemy` is now always `true`, and calling `cat()` no longer risks a stack overflow.

- Updated dependencies []:
  - @kubb/plugin-ts@5.0.0-beta.3

## 5.0.0-alpha.56

### Patch Changes

- Updated dependencies []:
  - @kubb/plugin-ts@5.0.0-alpha.56

## 5.0.0-alpha.55

### Patch Changes

- [#75](https://github.com/kubb-labs/plugins/pull/75) [`f655948`](https://github.com/kubb-labs/plugins/commit/f655948eb85409180a8930ad46a6dc57a55445a0) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Improve faker function code generation with cleaner type signatures and better structure.

  **Changes:**
  - Refactor generated faker functions to use explicit `defaultFakeData` variable for clarity
  - Simplify return types to `Required<T>` (removes unnecessary generic type tracking)
  - Function signature: `export function fake(data?: Partial<T>): Required<T>`
  - Use spread operator pattern: `{ ...defaultFakeData, ...(data || {}) } as Required<T>`

  **Benefits:**
  - Cleaner, more readable generated code
  - Explicit separation of defaults and overrides
  - Type-safe: `Required<T>` guarantees all properties are present and non-optional
  - Resolves type assignability issues when faker functions are used in contexts expecting `T`
  - No API changes - still supports optional overrides

- Updated dependencies []:
  - @kubb/plugin-ts@5.0.0-alpha.55

## 5.0.0-alpha.54

### Minor Changes

- [#71](https://github.com/kubb-labs/plugins/pull/71) [`825007c`](https://github.com/kubb-labs/plugins/commit/825007cf4e79baa63d846f59859587a233d5f1d4) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Fix stack overflows on indirect circular schemas (e.g. `Dog → Pet → Dog`) reported in kubb-labs/kubb#3172.

  Both plugins now use shared helpers from `@kubb/ast`:
  - `findCircularSchemas(schemas)` — detects all schemas involved in a cycle (direct or indirect)
  - `containsCircularRef(node, { circularSchemas, excludeName? })` — checks whether a property transitively references a cyclic schema

  **`plugin-faker`**: emits lazy getter syntax (`get archEnemy() { return fakePet() }`) for properties that reference an indirect cycle, preventing stack overflows at construction time. Direct self-references continue to emit `undefined as any`.

  **`plugin-zod`**: wraps cyclic `$ref`s in `z.lazy(() => …)` and emits object properties as getters when the property schema references a cyclic schema. The getter body is generated without redundant `z.lazy()` wrappers — eliminated via a closure-level flag rather than post-processing string replacement.

### Patch Changes

- Updated dependencies []:
  - @kubb/plugin-ts@5.0.0-alpha.54

## 5.0.0-alpha.52

### Major Changes

- [#10](https://github.com/kubb-labs/plugins/pull/10) [`75e5951`](https://github.com/kubb-labs/plugins/commit/75e5951b626e231fa371fe502912560b377b788d) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Rewrite `@kubb/plugin-faker` for the v5 AST-based plugin architecture.

  **Breaking changes:**
  - Remove `contentType`, `dateType`, `unknownType`, and `emptySchemaType` options
  - Replace `transformers: { name }` with `resolver`
  - Replace `transformers` with a single `transformer` visitor
  - Remove the `@kubb/plugin-oas` / `@kubb/oas` dependency; use `adapterOas()` in config instead

  **New options and exports:**
  - Add `resolver`, `transformer`, `printer`, and `paramsCasing`
  - Export `resolverFaker`, `resolverFakerLegacy`, and `printerFaker`

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

- [#49](https://github.com/kubb-labs/plugins/pull/49) [`af627c2`](https://github.com/kubb-labs/plugins/commit/af627c21674dcf9afe2c3b9e74dee092cb9a2ae5) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Add `tip` and `values` metadata to union-typed options in all plugin YAML descriptors.

  Each option with a `'foo' | 'bar'` type now ships a `values` array documenting what each literal value does, along with a TypeScript code example showing the generated output. Options whose behaviour depends on another option (e.g. `paramsType`/`pathParamsType`) also include a `tip` callout explaining the relationship.

  Affected options per plugin:
  - **plugin-client**: `client`, `clientType`, `dataReturnType`, `parser`, `paramsType`, `pathParamsType`
  - **plugin-ts**: `syntaxType`, `optionalType`, `arrayType`, `enumType`, `enumKeyCasing`
  - **plugin-react-query**: `paramsType`, `pathParamsType`, `parser`, `client.clientType`, `client.dataReturnType`
  - **plugin-vue-query**: `paramsType`, `pathParamsType`, `parser`, `client.clientType`, `client.dataReturnType`
  - **plugin-msw**: `parser`
  - **plugin-cypress**: `dataReturnType`, `paramsType`, `pathParamsType`
  - **plugin-faker**: `dateParser`, `regexGenerator`
  - **plugin-zod**: `importPath`, `dateType`, `guidType`

- Updated dependencies [[`af627c2`](https://github.com/kubb-labs/plugins/commit/af627c21674dcf9afe2c3b9e74dee092cb9a2ae5), [`ad69c52`](https://github.com/kubb-labs/plugins/commit/ad69c52cfb1a1f0c15aecd771af9ae883d617133)]:
  - @kubb/plugin-ts@5.0.0-alpha.52

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
  - @kubb/plugin-oas@5.0.0-alpha.35
  - @kubb/oas@5.0.0-alpha.35
  - @kubb/plugin-ts@5.0.0-alpha.35
  - @kubb/renderer-jsx@5.0.0-alpha.35

## 5.0.0-alpha.34

### Patch Changes

- Updated dependencies []:
  - @kubb/core@5.0.0-alpha.34
  - @kubb/oas@5.0.0-alpha.34
  - @kubb/plugin-oas@5.0.0-alpha.34
  - @kubb/plugin-ts@5.0.0-alpha.34
  - @kubb/renderer-jsx@5.0.0-alpha.34

## 5.0.0-alpha.33

### Patch Changes

- Updated dependencies [[`3ac7d1f`](https://github.com/kubb-labs/kubb/commit/3ac7d1f9b75099bfe793e35152e5c322e65aa6ad), [`9e6a772`](https://github.com/kubb-labs/kubb/commit/9e6a772c7ca1ee54e931d2dbf0f2448f67707c0e)]:
  - @kubb/core@5.0.0-alpha.33
  - @kubb/renderer-jsx@5.0.0-alpha.33
  - @kubb/oas@5.0.0-alpha.33
  - @kubb/plugin-oas@5.0.0-alpha.33
  - @kubb/plugin-ts@5.0.0-alpha.33

## 5.0.0-alpha.32

### Patch Changes

- Updated dependencies [[`6c6d2b6`](https://github.com/kubb-labs/kubb/commit/6c6d2b6b9f0dcfc7826cf9000ed835f274a6a7af)]:
  - @kubb/plugin-ts@5.0.0-alpha.32
  - @kubb/core@5.0.0-alpha.32
  - @kubb/oas@5.0.0-alpha.32
  - @kubb/plugin-oas@5.0.0-alpha.32

## 5.0.0-alpha.31

### Patch Changes

- Updated dependencies [[`6c49d8d`](https://github.com/kubb-labs/kubb/commit/6c49d8d02d7c4bf5341fb6f0114f6aa2ee735e1e)]:
  - @kubb/core@5.0.0-alpha.31
  - @kubb/oas@5.0.0-alpha.31
  - @kubb/plugin-oas@5.0.0-alpha.31
  - @kubb/plugin-ts@5.0.0-alpha.31

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
  - @kubb/plugin-oas@5.0.0-alpha.30
  - @kubb/oas@5.0.0-alpha.30

## 5.0.0-alpha.29

### Patch Changes

- Updated dependencies []:
  - @kubb/core@5.0.0-alpha.29
  - @kubb/oas@5.0.0-alpha.29
  - @kubb/plugin-oas@5.0.0-alpha.29
  - @kubb/plugin-ts@5.0.0-alpha.29

## 5.0.0-alpha.28

### Patch Changes

- Updated dependencies [[`d46e725`](https://github.com/kubb-labs/kubb/commit/d46e7255c2419e412ace2e090205d552a885c6ca)]:
  - @kubb/plugin-ts@5.0.0-alpha.28
  - @kubb/core@5.0.0-alpha.28
  - @kubb/oas@5.0.0-alpha.28
  - @kubb/plugin-oas@5.0.0-alpha.28

## 5.0.0-alpha.27

### Patch Changes

- Updated dependencies [[`795cac8`](https://github.com/kubb-labs/kubb/commit/795cac8edd6dd456185b7da90db9fd422c2b8330)]:
  - @kubb/core@5.0.0-alpha.27
  - @kubb/plugin-ts@5.0.0-alpha.27
  - @kubb/oas@5.0.0-alpha.27
  - @kubb/plugin-oas@5.0.0-alpha.27

## 5.0.0-alpha.26

### Patch Changes

- Updated dependencies []:
  - @kubb/core@5.0.0-alpha.26
  - @kubb/oas@5.0.0-alpha.26
  - @kubb/plugin-oas@5.0.0-alpha.26
  - @kubb/plugin-ts@5.0.0-alpha.26

## 5.0.0-alpha.25

### Patch Changes

- Updated dependencies [[`c1e9257`](https://github.com/kubb-labs/kubb/commit/c1e92572c04cf82ddb4df2e9e72e1551287a21fa)]:
  - @kubb/core@5.0.0-alpha.25
  - @kubb/plugin-ts@5.0.0-alpha.25
  - @kubb/oas@5.0.0-alpha.25
  - @kubb/plugin-oas@5.0.0-alpha.25

## 5.0.0-alpha.24

### Patch Changes

- Updated dependencies []:
  - @kubb/core@5.0.0-alpha.24
  - @kubb/oas@5.0.0-alpha.24
  - @kubb/plugin-oas@5.0.0-alpha.24
  - @kubb/plugin-ts@5.0.0-alpha.24

## 5.0.0-alpha.23

### Patch Changes

- Updated dependencies [[`8cfa19a`](https://github.com/kubb-labs/kubb/commit/8cfa19adbe681d4466f0ff97a8c14ece8ba1e5d8)]:
  - @kubb/plugin-ts@5.0.0-alpha.23
  - @kubb/core@5.0.0-alpha.23
  - @kubb/oas@5.0.0-alpha.23
  - @kubb/plugin-oas@5.0.0-alpha.23

## 5.0.0-alpha.22

### Patch Changes

- Updated dependencies [[`1792af2`](https://github.com/kubb-labs/kubb/commit/1792af257ef9c7399959319aa4be28a46cb730fe)]:
  - @kubb/plugin-ts@5.0.0-alpha.22
  - @kubb/core@5.0.0-alpha.22
  - @kubb/oas@5.0.0-alpha.22
  - @kubb/plugin-oas@5.0.0-alpha.22

## 5.0.0-alpha.21

### Patch Changes

- Updated dependencies []:
  - @kubb/core@5.0.0-alpha.21
  - @kubb/oas@5.0.0-alpha.21
  - @kubb/plugin-oas@5.0.0-alpha.21
  - @kubb/plugin-ts@5.0.0-alpha.21

## 5.0.0-alpha.20

### Patch Changes

- Updated dependencies [[`f596e47`](https://github.com/kubb-labs/kubb/commit/f596e47e353c18ef11c4531acd12641c52c00435)]:
  - @kubb/core@5.0.0-alpha.20
  - @kubb/oas@5.0.0-alpha.20
  - @kubb/plugin-oas@5.0.0-alpha.20
  - @kubb/plugin-ts@5.0.0-alpha.20

## 5.0.0-alpha.19

### Patch Changes

- Updated dependencies []:
  - @kubb/core@5.0.0-alpha.19
  - @kubb/oas@5.0.0-alpha.19
  - @kubb/plugin-oas@5.0.0-alpha.19
  - @kubb/plugin-ts@5.0.0-alpha.19

## 5.0.0-alpha.18

### Patch Changes

- Updated dependencies [[`fa7f554`](https://github.com/kubb-labs/kubb/commit/fa7f55423e9d81773a2f168954bf682a866de65c)]:
  - @kubb/plugin-oas@5.0.0-alpha.18
  - @kubb/plugin-ts@5.0.0-alpha.18
  - @kubb/core@5.0.0-alpha.18
  - @kubb/oas@5.0.0-alpha.18

## 5.0.0-alpha.17

### Patch Changes

- Updated dependencies []:
  - @kubb/core@5.0.0-alpha.17
  - @kubb/oas@5.0.0-alpha.17
  - @kubb/plugin-ts@5.0.0-alpha.17
  - @kubb/plugin-oas@5.0.0-alpha.17

## 5.0.0-alpha.16

### Patch Changes

- Updated dependencies [[`f1b2596`](https://github.com/kubb-labs/kubb/commit/f1b2596a36adc73de6aeea6f0843786dfc630426)]:
  - @kubb/plugin-ts@5.0.0-alpha.16
  - @kubb/core@5.0.0-alpha.16
  - @kubb/oas@5.0.0-alpha.16
  - @kubb/plugin-oas@5.0.0-alpha.16

## 5.0.0-alpha.15

### Patch Changes

- Updated dependencies []:
  - @kubb/core@5.0.0-alpha.15
  - @kubb/oas@5.0.0-alpha.15
  - @kubb/plugin-oas@5.0.0-alpha.15
  - @kubb/plugin-ts@5.0.0-alpha.15

## 5.0.0-alpha.14

### Patch Changes

- Updated dependencies [[`591977c`](https://github.com/kubb-labs/kubb/commit/591977c5c2f167736d6e43126ed0387a1e5e0ce5)]:
  - @kubb/core@5.0.0-alpha.14
  - @kubb/plugin-ts@5.0.0-alpha.14
  - @kubb/oas@5.0.0-alpha.14
  - @kubb/plugin-oas@5.0.0-alpha.14

## 5.0.0-alpha.13

### Patch Changes

- Updated dependencies [[`975717e`](https://github.com/kubb-labs/kubb/commit/975717e2c8cf8d33f5d9d641be4bb164fd36f423), [`b5d83e2`](https://github.com/kubb-labs/kubb/commit/b5d83e2a2c8a325f953b9e353bdb1b730dbdd305), [`33d0507`](https://github.com/kubb-labs/kubb/commit/33d050714fa24ae6aa1042a8aa12fc4925399007), [`ed7a2cb`](https://github.com/kubb-labs/kubb/commit/ed7a2cb6d008e880a955e8fefc1eee6859c06240), [`68a3bdd`](https://github.com/kubb-labs/kubb/commit/68a3bdd2eb85b3bd78e278ba9e4a0b691b580c7e), [`9968516`](https://github.com/kubb-labs/kubb/commit/99685169dc85f4f23fae6af0872dbd2f13e8012e)]:
  - @kubb/plugin-ts@5.0.0-alpha.13
  - @kubb/core@5.0.0-alpha.13
  - @kubb/oas@5.0.0-alpha.13
  - @kubb/plugin-oas@5.0.0-alpha.13

## 5.0.0-alpha.12

### Patch Changes

- Updated dependencies [[`d97bf00`](https://github.com/kubb-labs/kubb/commit/d97bf007db4fa3a5341463dab0e891afeaf82fff), [`ebe0774`](https://github.com/kubb-labs/kubb/commit/ebe07749c5e3ef16d0e53daf11dd3954a582216b), [`f4105fe`](https://github.com/kubb-labs/kubb/commit/f4105fe44e46ec2846e665fd6079290e6d6ce6c6), [`ebe0774`](https://github.com/kubb-labs/kubb/commit/ebe07749c5e3ef16d0e53daf11dd3954a582216b)]:
  - @kubb/plugin-ts@5.0.0-alpha.12
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

## 5.0.0-alpha.10

### Patch Changes

- Updated dependencies []:
  - @kubb/core@5.0.0-alpha.10
  - @kubb/oas@5.0.0-alpha.10
  - @kubb/plugin-ts@5.0.0-alpha.10
  - @kubb/plugin-oas@5.0.0-alpha.10

## 5.0.0-alpha.9

### Patch Changes

- Updated dependencies [[`617aa20`](https://github.com/kubb-labs/kubb/commit/617aa203608222aba2a022ab998ced16f4216ed3)]:
  - @kubb/core@5.0.0-alpha.9
  - @kubb/oas@5.0.0-alpha.9
  - @kubb/plugin-oas@5.0.0-alpha.9
  - @kubb/plugin-ts@5.0.0-alpha.9

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
  - @kubb/oas@5.0.0-alpha.8

## 5.0.0-alpha.7

### Major Changes

- [#2794](https://github.com/kubb-labs/kubb/pull/2794) [`bf5f955`](https://github.com/kubb-labs/kubb/commit/bf5f955ec285badb0d99a3950b0a880622180ec2) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Rename `PluginManager` to `PluginDriver`. The `pluginManager` property in context/meta is now `driver`. The hook `usePluginManager` is now `usePluginDriver`.

### Patch Changes

- Updated dependencies [[`bf5f955`](https://github.com/kubb-labs/kubb/commit/bf5f955ec285badb0d99a3950b0a880622180ec2)]:
  - @kubb/core@5.0.0-alpha.7
  - @kubb/plugin-oas@5.0.0-alpha.7
  - @kubb/plugin-ts@5.0.0-alpha.7
  - @kubb/oas@5.0.0-alpha.7

## 5.0.0-alpha.6

### Patch Changes

- Updated dependencies [[`0aba63f`](https://github.com/kubb-labs/kubb/commit/0aba63f026e7e93bf1057b7a3740bbfe9ee07c00)]:
  - @kubb/plugin-ts@5.0.0-alpha.6
  - @kubb/core@5.0.0-alpha.6
  - @kubb/oas@5.0.0-alpha.6
  - @kubb/plugin-oas@5.0.0-alpha.6

## 5.0.0-alpha.5

### Patch Changes

- Updated dependencies [[`f373168`](https://github.com/kubb-labs/kubb/commit/f37316845ef3f8753a93e04a946b333ee4e42073)]:
  - @kubb/core@5.0.0-alpha.5
  - @kubb/plugin-ts@5.0.0-alpha.5
  - @kubb/oas@5.0.0-alpha.5
  - @kubb/plugin-oas@5.0.0-alpha.5

## 5.0.0-alpha.4

### Patch Changes

- Updated dependencies [[`64e3d85`](https://github.com/kubb-labs/kubb/commit/64e3d8583c50c073bfe8945dcda5e700d262d9d9)]:
  - @kubb/plugin-oas@5.0.0-alpha.4
  - @kubb/plugin-ts@5.0.0-alpha.4
  - @kubb/core@5.0.0-alpha.4
  - @kubb/oas@5.0.0-alpha.4

## 5.0.0-alpha.3

### Patch Changes

- Updated dependencies [[`827b444`](https://github.com/kubb-labs/kubb/commit/827b444e7c7c62d36ba9eaed7303ed0d18a7fa45)]:
  - @kubb/plugin-ts@5.0.0-alpha.3
  - @kubb/core@5.0.0-alpha.3
  - @kubb/oas@5.0.0-alpha.3
  - @kubb/plugin-oas@5.0.0-alpha.3

## 5.0.0-alpha.2

### Major Changes

- [#2768](https://github.com/kubb-labs/kubb/pull/2768) [`4f5a4ef`](https://github.com/kubb-labs/kubb/commit/4f5a4efc6169e9e5ef2cfd629a8ed7ff5714727b) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Remove `pluginKey` in favour of `pluginName`. Each plugin can now only be used once, adding duplicate plugins throws an error.

### Patch Changes

- Updated dependencies [[`4f5a4ef`](https://github.com/kubb-labs/kubb/commit/4f5a4efc6169e9e5ef2cfd629a8ed7ff5714727b)]:
  - @kubb/core@5.0.0-alpha.2
  - @kubb/plugin-oas@5.0.0-alpha.2
  - @kubb/plugin-ts@5.0.0-alpha.2
  - @kubb/oas@5.0.0-alpha.2

## 5.0.0-alpha.1

### Major Changes

- [`a4682ea`](https://github.com/kubb-labs/kubb/commit/a4682ea8896ef7d9ccae1b6e9abd6ed7bcaac073) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - The minimum required Node.js version is 22.

### Patch Changes

- Updated dependencies [[`a4682ea`](https://github.com/kubb-labs/kubb/commit/a4682ea8896ef7d9ccae1b6e9abd6ed7bcaac073)]:
  - @kubb/plugin-oas@5.0.0-alpha.1
  - @kubb/plugin-ts@5.0.0-alpha.1
  - @kubb/core@5.0.0-alpha.1
  - @kubb/oas@5.0.0-alpha.1

## 5.0.0-alpha.0

### Patch Changes

- Updated dependencies [[`2d474ef`](https://github.com/kubb-labs/kubb/commit/2d474ef68bad43e13ec34e762194048cd2a194d9)]:
  - @kubb/core@5.0.0-alpha.0
  - @kubb/oas@5.0.0-alpha.0
  - @kubb/plugin-oas@5.0.0-alpha.0
  - @kubb/plugin-ts@5.0.0-alpha.0

## 4.36.1

### Patch Changes

- Updated dependencies [[`a4ac8d2`](https://github.com/kubb-labs/kubb/commit/a4ac8d28d4b17f5275c3fbe3dedfff0ac3bc3357)]:
  - @kubb/core@4.36.1
  - @kubb/oas@4.36.1
  - @kubb/plugin-oas@4.36.1
  - @kubb/plugin-ts@4.36.1

## 4.36.0

### Patch Changes

- Updated dependencies [[`4e06911`](https://github.com/kubb-labs/kubb/commit/4e0691160314ff3b9054fbba3efcaeb4c9b10008)]:
  - @kubb/core@4.36.0
  - @kubb/oas@4.36.0
  - @kubb/plugin-oas@4.36.0
  - @kubb/plugin-ts@4.36.0

## 4.35.1

### Patch Changes

- Updated dependencies [[`e24fe13`](https://github.com/kubb-labs/kubb/commit/e24fe135aba61f56d3ff218735cb616a627027b9)]:
  - @kubb/plugin-ts@4.35.1
  - @kubb/core@4.35.1
  - @kubb/oas@4.35.1
  - @kubb/plugin-oas@4.35.1

## 4.35.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.35.0
  - @kubb/oas@4.35.0
  - @kubb/plugin-oas@4.35.0
  - @kubb/plugin-ts@4.35.0

## 4.34.0

### Patch Changes

- Updated dependencies []:
  - @kubb/oas@4.34.0
  - @kubb/plugin-oas@4.34.0
  - @kubb/plugin-ts@4.34.0
  - @kubb/core@4.34.0

## 4.33.5

### Patch Changes

- Updated dependencies [[`45b7dc7`](https://github.com/kubb-labs/kubb/commit/45b7dc7939621a29a342af36db34c5f9bee3e155)]:
  - @kubb/oas@4.33.5
  - @kubb/plugin-oas@4.33.5
  - @kubb/plugin-ts@4.33.5
  - @kubb/core@4.33.5

## 4.33.4

### Patch Changes

- Updated dependencies [[`711e6a3`](https://github.com/kubb-labs/kubb/commit/711e6a3fe4373dba49c2dbdbfaa38e0c1bce0d8c)]:
  - @kubb/core@4.33.4
  - @kubb/oas@4.33.4
  - @kubb/plugin-oas@4.33.4
  - @kubb/plugin-ts@4.33.4

## 4.33.3

### Patch Changes

- Updated dependencies [[`b221f9a`](https://github.com/kubb-labs/kubb/commit/b221f9aac6b94a725b86349cf8e8009c337ed23b)]:
  - @kubb/oas@4.33.3
  - @kubb/plugin-oas@4.33.3
  - @kubb/plugin-ts@4.33.3
  - @kubb/core@4.33.3

## 4.33.2

### Patch Changes

- Updated dependencies [[`29f6d1b`](https://github.com/kubb-labs/kubb/commit/29f6d1b31e0bc922eb5b0ba8e5149241a3a37305)]:
  - @kubb/plugin-oas@4.33.2
  - @kubb/plugin-ts@4.33.2
  - @kubb/core@4.33.2
  - @kubb/oas@4.33.2

## 4.33.1

### Patch Changes

- Updated dependencies [[`856fa78`](https://github.com/kubb-labs/kubb/commit/856fa78e5cc281ef3cd1b66a38e2deeca69f1b6e)]:
  - @kubb/core@4.33.1
  - @kubb/oas@4.33.1
  - @kubb/plugin-oas@4.33.1
  - @kubb/plugin-ts@4.33.1

## 4.33.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.33.0
  - @kubb/oas@4.33.0
  - @kubb/plugin-oas@4.33.0
  - @kubb/plugin-ts@4.33.0

## 4.32.4

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.32.4
  - @kubb/oas@4.32.4
  - @kubb/plugin-oas@4.32.4
  - @kubb/plugin-ts@4.32.4

## 4.32.3

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.32.3
  - @kubb/oas@4.32.3
  - @kubb/plugin-oas@4.32.3
  - @kubb/plugin-ts@4.32.3

## 4.32.2

### Patch Changes

- Updated dependencies [[`7346e64`](https://github.com/kubb-labs/kubb/commit/7346e645de64892abe4fcd06310639333dbd1f9f)]:
  - @kubb/core@4.32.2
  - @kubb/oas@4.32.2
  - @kubb/plugin-oas@4.32.2
  - @kubb/plugin-ts@4.32.2

## 4.32.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.32.1
  - @kubb/oas@4.32.1
  - @kubb/plugin-oas@4.32.1
  - @kubb/plugin-ts@4.32.1

## 4.32.0

### Patch Changes

- Updated dependencies [[`95c4649`](https://github.com/kubb-labs/kubb/commit/95c4649eb01a0348424c779046d8312a6af09d51)]:
  - @kubb/plugin-oas@4.32.0
  - @kubb/plugin-ts@4.32.0
  - @kubb/core@4.32.0
  - @kubb/oas@4.32.0

## 4.31.6

### Patch Changes

- [#2638](https://github.com/kubb-labs/kubb/pull/2638) [`aa720ed`](https://github.com/kubb-labs/kubb/commit/aa720ed09e674d071fe53c43244fa718e3ca2575) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - fix: named array type aliases (`$ref` to a schema with `type: array`) no longer wrapped in `Partial<>`, preventing TypeScript errors like `(Item | undefined)[] not assignable to Item[]`

- Updated dependencies [[`4e151b7`](https://github.com/kubb-labs/kubb/commit/4e151b7182393d870d51fe5377610e05928ccf14)]:
  - @kubb/plugin-ts@4.31.6
  - @kubb/core@4.31.6
  - @kubb/oas@4.31.6
  - @kubb/plugin-oas@4.31.6

## 4.31.5

### Patch Changes

- Updated dependencies [[`b81718f`](https://github.com/kubb-labs/kubb/commit/b81718fa2410275227fe07345ffa41a4811e0459)]:
  - @kubb/plugin-oas@4.31.5
  - @kubb/plugin-ts@4.31.5
  - @kubb/core@4.31.5
  - @kubb/oas@4.31.5

## 4.31.4

### Patch Changes

- Updated dependencies [[`0a873dd`](https://github.com/kubb-labs/kubb/commit/0a873dd1b37d42167288970aa8f819e8ad5a78a5)]:
  - @kubb/plugin-oas@4.31.4
  - @kubb/plugin-ts@4.31.4
  - @kubb/core@4.31.4
  - @kubb/oas@4.31.4

## 4.31.3

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.31.3
  - @kubb/oas@4.31.3
  - @kubb/plugin-oas@4.31.3
  - @kubb/plugin-ts@4.31.3

## 4.31.2

### Patch Changes

- Updated dependencies [[`adadc15`](https://github.com/kubb-labs/kubb/commit/adadc1536f0fafdc15f095a8e42cc92977c2139a)]:
  - @kubb/oas@4.31.2
  - @kubb/plugin-oas@4.31.2
  - @kubb/plugin-ts@4.31.2
  - @kubb/core@4.31.2

## 4.31.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.31.1
  - @kubb/oas@4.31.1
  - @kubb/plugin-oas@4.31.1
  - @kubb/plugin-ts@4.31.1

## 4.31.0

### Patch Changes

- Updated dependencies [[`43626b4`](https://github.com/kubb-labs/kubb/commit/43626b4a7d5e8420bc441b90de06a804a5c9efe1)]:
  - @kubb/plugin-oas@4.31.0
  - @kubb/plugin-ts@4.31.0
  - @kubb/core@4.31.0
  - @kubb/oas@4.31.0

## 4.30.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.30.0
  - @kubb/oas@4.30.0
  - @kubb/plugin-oas@4.30.0
  - @kubb/plugin-ts@4.30.0

## 4.29.1

### Patch Changes

- Updated dependencies [[`d6fc5ad`](https://github.com/kubb-labs/kubb/commit/d6fc5ad851195330367ebecbc08e19ec1658ca40)]:
  - @kubb/plugin-ts@4.29.1
  - @kubb/core@4.29.1
  - @kubb/oas@4.29.1
  - @kubb/plugin-oas@4.29.1

## 4.29.0

### Patch Changes

- Updated dependencies [[`bb6f915`](https://github.com/kubb-labs/kubb/commit/bb6f915e0c0d59a417b0891b8bcf7bbfe9db502e), [`9529af1`](https://github.com/kubb-labs/kubb/commit/9529af145dca72991fe7d2a529c717cce0993ea3)]:
  - @kubb/plugin-oas@4.29.0
  - @kubb/plugin-ts@4.29.0
  - @kubb/core@4.29.0
  - @kubb/oas@4.29.0

## 4.28.1

### Patch Changes

- Updated dependencies [[`e9ddbf0`](https://github.com/kubb-labs/kubb/commit/e9ddbf05d3c29ac293a0402e7678c6c02beef3f8)]:
  - @kubb/oas@4.28.1
  - @kubb/plugin-oas@4.28.1
  - @kubb/plugin-ts@4.28.1
  - @kubb/core@4.28.1

## 4.28.0

### Patch Changes

- Updated dependencies [[`d34236f`](https://github.com/kubb-labs/kubb/commit/d34236fae3f46f6f0a79b7792898421f5f5a4d9d)]:
  - @kubb/plugin-oas@4.28.0
  - @kubb/plugin-ts@4.28.0
  - @kubb/core@4.28.0
  - @kubb/oas@4.28.0

## 4.27.4

### Patch Changes

- Updated dependencies [[`3690d37`](https://github.com/kubb-labs/kubb/commit/3690d3778cb8e2c48841bf13b73c82c165242ef4)]:
  - @kubb/core@4.27.4
  - @kubb/oas@4.27.4
  - @kubb/plugin-oas@4.27.4
  - @kubb/plugin-ts@4.27.4

## 4.27.3

### Patch Changes

- Updated dependencies [[`669b07e`](https://github.com/kubb-labs/kubb/commit/669b07ed66f0dded0e028a3dfe1c5e669c53e53a)]:
  - @kubb/oas@4.27.3
  - @kubb/plugin-oas@4.27.3
  - @kubb/plugin-ts@4.27.3
  - @kubb/core@4.27.3

## 4.27.2

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.27.2
  - @kubb/oas@4.27.2
  - @kubb/plugin-oas@4.27.2
  - @kubb/plugin-ts@4.27.2

## 4.27.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.27.1
  - @kubb/oas@4.27.1
  - @kubb/plugin-oas@4.27.1
  - @kubb/plugin-ts@4.27.1

## 4.27.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.27.0
  - @kubb/oas@4.27.0
  - @kubb/plugin-oas@4.27.0
  - @kubb/plugin-ts@4.27.0

## 4.26.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.26.1
  - @kubb/oas@4.26.1
  - @kubb/plugin-oas@4.26.1
  - @kubb/plugin-ts@4.26.1

## 4.26.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.26.0
  - @kubb/oas@4.26.0
  - @kubb/plugin-oas@4.26.0
  - @kubb/plugin-ts@4.26.0

## 4.25.2

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.25.2
  - @kubb/oas@4.25.2
  - @kubb/plugin-oas@4.25.2
  - @kubb/plugin-ts@4.25.2

## 4.25.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.25.1
  - @kubb/oas@4.25.1
  - @kubb/plugin-oas@4.25.1
  - @kubb/plugin-ts@4.25.1

## 4.25.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.25.0
  - @kubb/oas@4.25.0
  - @kubb/plugin-oas@4.25.0
  - @kubb/plugin-ts@4.25.0

## 4.24.1

### Patch Changes

- Updated dependencies [[`d260f9a`](https://github.com/kubb-labs/kubb/commit/d260f9a1f8a24ad2f1999fbdb918bb47cca078d0)]:
  - @kubb/plugin-ts@4.24.1
  - @kubb/core@4.24.1
  - @kubb/oas@4.24.1
  - @kubb/plugin-oas@4.24.1

## 4.24.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.24.0
  - @kubb/oas@4.24.0
  - @kubb/plugin-oas@4.24.0
  - @kubb/plugin-ts@4.24.0

## 4.23.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.23.0
  - @kubb/oas@4.23.0
  - @kubb/plugin-oas@4.23.0
  - @kubb/plugin-ts@4.23.0

## 4.22.3

### Patch Changes

- [#2472](https://github.com/kubb-labs/kubb/pull/2472) [`ee575ff`](https://github.com/kubb-labs/kubb/commit/ee575ff4a76ef530f12251637651f1906244e75d) Thanks [@Ericlm](https://github.com/Ericlm)! - Fix wrong data forwarding in enum cases

- Updated dependencies []:
  - @kubb/core@4.22.3
  - @kubb/oas@4.22.3
  - @kubb/plugin-oas@4.22.3
  - @kubb/plugin-ts@4.22.3

## 4.22.2

### Patch Changes

- Updated dependencies [[`b8630dc`](https://github.com/kubb-labs/kubb/commit/b8630dcb3fa43665305ca8b782a43307325dfe34)]:
  - @kubb/plugin-ts@4.22.2
  - @kubb/core@4.22.2
  - @kubb/oas@4.22.2
  - @kubb/plugin-oas@4.22.2

## 4.22.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.22.1
  - @kubb/oas@4.22.1
  - @kubb/plugin-oas@4.22.1
  - @kubb/plugin-ts@4.22.1

## 4.22.0

### Patch Changes

- [#2450](https://github.com/kubb-labs/kubb/pull/2450) [`5e475f2`](https://github.com/kubb-labs/kubb/commit/5e475f222fdfcebf74a7c82c5adf84cf970dcb8c) Thanks [@icholy](https://github.com/icholy)! - Externalize all @kubb/\* packages in tsdown configs to prevent duplicate type declarations across packages, fixing TypeScript type incompatibility errors caused by inlined #private class fields.

- [#2394](https://github.com/kubb-labs/kubb/pull/2394) [`277d698`](https://github.com/kubb-labs/kubb/commit/277d6984c8230a6f33411674f34797479592e5dd) Thanks [@Ericlm](https://github.com/Ericlm)! - Top functions are now able to pass data down to functions called downstream.

- Updated dependencies [[`5e475f2`](https://github.com/kubb-labs/kubb/commit/5e475f222fdfcebf74a7c82c5adf84cf970dcb8c), [`4486916`](https://github.com/kubb-labs/kubb/commit/4486916b59257c0ca41a440b0d09f6f7742c1b5e)]:
  - @kubb/oas@4.22.0
  - @kubb/plugin-oas@4.22.0
  - @kubb/plugin-ts@4.22.0
  - @kubb/core@4.22.0

## 4.21.2

### Patch Changes

- Updated dependencies [[`99097c8`](https://github.com/kubb-labs/kubb/commit/99097c8d8401d2135dece43877223029137cf6a6)]:
  - @kubb/plugin-ts@4.21.2
  - @kubb/core@4.21.2
  - @kubb/oas@4.21.2
  - @kubb/plugin-oas@4.21.2

## 4.21.1

### Patch Changes

- Updated dependencies [[`9592063`](https://github.com/kubb-labs/kubb/commit/9592063f91bf9d3604b508774fb7d8f7a09e47f8)]:
  - @kubb/plugin-ts@4.21.1
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
  - @kubb/plugin-oas@4.21.0
  - @kubb/core@4.21.0
  - @kubb/oas@4.21.0

## 4.20.5

### Patch Changes

- [#2427](https://github.com/kubb-labs/kubb/pull/2427) [`f2bab83`](https://github.com/kubb-labs/kubb/commit/f2bab8381871b7c73e3b1bcdd29ddc5fd24fe2e6) Thanks [@icholy](https://github.com/icholy)! - Externalize @kubb/core in tsdown configs to prevent duplicate type declarations across packages, fixing TypeScript type incompatibility errors when using custom generators with pluginClient.

- Updated dependencies [[`f2bab83`](https://github.com/kubb-labs/kubb/commit/f2bab8381871b7c73e3b1bcdd29ddc5fd24fe2e6)]:
  - @kubb/oas@4.20.5
  - @kubb/plugin-oas@4.20.5
  - @kubb/plugin-ts@4.20.5
  - @kubb/core@4.20.5

## 4.20.4

### Patch Changes

- Updated dependencies [[`fb12978`](https://github.com/kubb-labs/kubb/commit/fb12978c20634f3f849e62fbcae409000a6f90de)]:
  - @kubb/plugin-ts@4.20.4
  - @kubb/core@4.20.4
  - @kubb/oas@4.20.4
  - @kubb/plugin-oas@4.20.4

## 4.20.3

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.20.3
  - @kubb/oas@4.20.3
  - @kubb/plugin-oas@4.20.3
  - @kubb/plugin-ts@4.20.3

## 4.20.2

### Patch Changes

- Updated dependencies [[`6006dc3`](https://github.com/kubb-labs/kubb/commit/6006dc335d62dd9c1254bd31ecc90a5ccb70a116)]:
  - @kubb/core@4.20.2
  - @kubb/oas@4.20.2
  - @kubb/plugin-oas@4.20.2
  - @kubb/plugin-ts@4.20.2

## 4.20.1

### Patch Changes

- Updated dependencies [[`5c50613`](https://github.com/kubb-labs/kubb/commit/5c50613504f05d1f5484dea4969182ecc7961cfb)]:
  - @kubb/core@4.20.1
  - @kubb/plugin-oas@4.20.1
  - @kubb/oas@4.20.1
  - @kubb/plugin-ts@4.20.1

## 4.20.0

### Patch Changes

- [#2387](https://github.com/kubb-labs/kubb/pull/2387) [`d3acf9e`](https://github.com/kubb-labs/kubb/commit/d3acf9eb2b018595fadcc06380ef8419d8bbea8f) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Update fabric

- Updated dependencies [[`d3acf9e`](https://github.com/kubb-labs/kubb/commit/d3acf9eb2b018595fadcc06380ef8419d8bbea8f)]:
  - @kubb/plugin-oas@4.20.0
  - @kubb/plugin-ts@4.20.0
  - @kubb/core@4.20.0
  - @kubb/oas@4.20.0

## 4.19.2

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.19.2
  - @kubb/oas@4.19.2
  - @kubb/plugin-oas@4.19.2
  - @kubb/plugin-ts@4.19.2

## 4.19.1

### Patch Changes

- [#2381](https://github.com/kubb-labs/kubb/pull/2381) [`996f3b2`](https://github.com/kubb-labs/kubb/commit/996f3b26d8c2167c3e77b734275c204e6c1b159c) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Enhanced `collisionDetection` to prevent nested enum name collisions across different schemas

  When `collisionDetection: true` is enabled, Kubb now prevents duplicate enum names that occur when multiple schemas define identical inline enums in nested properties.

  **New behavior:**
  - Tracks root schema name throughout parsing chain
  - Includes root schema name in enum naming for nested properties
  - Only applies when `collisionDetection: true` (backward compatible)

  **Example:**

  ```yaml
  components:
    schemas:
      NotificationTypeA:
        properties:
          params:
            properties:
              channel:
                type: string
                enum: [public, collaborators]

      NotificationTypeB:
        properties:
          params:
            properties:
              channel:
                type: string
                enum: [public, collaborators]
  ```

  **Before** (without this fix):

  ```typescript
  // Both files export the same enum name - collision!
  export const paramsChannelEnum = { ... }
  ```

  **After** (with `collisionDetection: true`):

  ```typescript
  // NotificationTypeA.ts
  export const notificationTypeAParamsChannelEnum = { ... }

  // NotificationTypeB.ts
  export const notificationTypeBParamsChannelEnum = { ... }
  ```

  **Deprecated:**
  - Marked `usedEnumNames` as deprecated - will be removed in v5 when `collisionDetection` defaults to `true`
  - The rootName-based approach eliminates the need for numeric suffix fallbacks

  **Migration:**
  Enable `collisionDetection: true` in your configuration to benefit from this enhancement and prepare for v5:

  ```typescript
  pluginOas({
    collisionDetection: true, // Recommended - prevents all collision types
  });
  ```

- Updated dependencies [[`996f3b2`](https://github.com/kubb-labs/kubb/commit/996f3b26d8c2167c3e77b734275c204e6c1b159c)]:
  - @kubb/plugin-oas@4.19.1
  - @kubb/plugin-ts@4.19.1
  - @kubb/core@4.19.1
  - @kubb/oas@4.19.1

## 4.19.0

### Patch Changes

- Updated dependencies [[`f5f2dc1`](https://github.com/kubb-labs/kubb/commit/f5f2dc162556c9c1c05d97e29cb28cf79830885a)]:
  - @kubb/oas@4.19.0
  - @kubb/plugin-oas@4.19.0
  - @kubb/plugin-ts@4.19.0
  - @kubb/core@4.19.0

## 4.18.5

### Patch Changes

- Updated dependencies [[`ea23bb4`](https://github.com/kubb-labs/kubb/commit/ea23bb4a2f5a121dd1192b05f0f4cf4207093dc5)]:
  - @kubb/plugin-oas@4.18.5
  - @kubb/oas@4.18.5
  - @kubb/plugin-ts@4.18.5
  - @kubb/core@4.18.5

## 4.18.4

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.18.4
  - @kubb/oas@4.18.4
  - @kubb/plugin-oas@4.18.4
  - @kubb/plugin-ts@4.18.4

## 4.18.3

### Patch Changes

- Updated dependencies [[`5bff082`](https://github.com/kubb-labs/kubb/commit/5bff08211fb72476a6b8ffc703430ae4c6603ba5)]:
  - @kubb/plugin-ts@4.18.3
  - @kubb/core@4.18.3
  - @kubb/oas@4.18.3
  - @kubb/plugin-oas@4.18.3

## 4.18.2

### Patch Changes

- [#2339](https://github.com/kubb-labs/kubb/pull/2339) [`b76b413`](https://github.com/kubb-labs/kubb/commit/b76b4135ffa6f3e79d3d5b082e458000784c6b7e) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Fix incorrect spreading of factory functions in `allOf` schemas with single refs

  When using `allOf` with a single reference to a primitive type (e.g., enum), the generated factory code was incorrectly spreading the result like `{ ...createIssueCategory() }`. This has been fixed so that single refs in `allOf` are no longer spread, while multiple refs continue to be spread correctly.

  **Before:**

  ```typescript
  // Generated code (incorrect)
  category: { ...createIssueCategory() }
  ```

  **After:**

  ```typescript
  // Generated code (correct)
  category: createIssueCategory();
  ```

- Updated dependencies []:
  - @kubb/core@4.18.2
  - @kubb/oas@4.18.2
  - @kubb/plugin-oas@4.18.2
  - @kubb/plugin-ts@4.18.2

## 4.18.1

### Patch Changes

- [#2337](https://github.com/kubb-labs/kubb/pull/2337) [`cf739b2`](https://github.com/kubb-labs/kubb/commit/cf739b203a1006c81f31c06119bc4bd0dbbdac86) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Fix self-referencing type infinite recursion. Detect when a type references itself and return undefined instead of making recursive calls, preventing stack overflow errors.

- Updated dependencies []:
  - @kubb/core@4.18.1
  - @kubb/oas@4.18.1
  - @kubb/plugin-oas@4.18.1
  - @kubb/plugin-ts@4.18.1

## 4.18.0

### Minor Changes

- [#2333](https://github.com/kubb-labs/kubb/pull/2333) [`ec5893e`](https://github.com/kubb-labs/kubb/commit/ec5893e056c67df2035f72492f54d1affc8f67b6) Thanks [@sebastianvitterso](https://github.com/sebastianvitterso)! - Add support for `staticClient` clients, with static methods (removing the need to instantiate the client before use)

### Patch Changes

- [#2330](https://github.com/kubb-labs/kubb/pull/2330) [`25f657a`](https://github.com/kubb-labs/kubb/commit/25f657a0076277a24932c2b977db252bd9108d77) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Updated tsdown from 0.18.4 to 0.19.0 and added `keepNames: true` in `outputOptions` for all packages. This preserves function and class names in bundled output, fixing React DevTools component inspection and improving debugging experience.

- Updated dependencies [[`ec5893e`](https://github.com/kubb-labs/kubb/commit/ec5893e056c67df2035f72492f54d1affc8f67b6), [`25f657a`](https://github.com/kubb-labs/kubb/commit/25f657a0076277a24932c2b977db252bd9108d77)]:
  - @kubb/plugin-oas@4.18.0
  - @kubb/plugin-ts@4.18.0
  - @kubb/core@4.18.0
  - @kubb/oas@4.18.0

## 4.17.2

### Patch Changes

- Updated dependencies [[`6e15459`](https://github.com/kubb-labs/kubb/commit/6e154590905c6f626abbab35aa506054cccdf5b9)]:
  - @kubb/oas@4.17.2
  - @kubb/plugin-oas@4.17.2
  - @kubb/plugin-ts@4.17.2
  - @kubb/core@4.17.2

## 4.17.1

### Patch Changes

- Updated dependencies [[`6d7c8c0`](https://github.com/kubb-labs/kubb/commit/6d7c8c0a21bb88ca4df8637bec5bb017350a8b68)]:
  - @kubb/plugin-oas@4.17.1
  - @kubb/plugin-ts@4.17.1
  - @kubb/core@4.17.1
  - @kubb/oas@4.17.1

## 4.17.0

### Patch Changes

- Updated dependencies [[`18d1a2b`](https://github.com/kubb-labs/kubb/commit/18d1a2b46eb519cdfe9eaa8ef9f4507688975f78), [`e6da3a1`](https://github.com/kubb-labs/kubb/commit/e6da3a18b75a1391b28637e10893d575782b8edb)]:
  - @kubb/core@4.17.0
  - @kubb/plugin-ts@4.17.0
  - @kubb/oas@4.17.0
  - @kubb/plugin-oas@4.17.0

## 4.16.0

### Patch Changes

- Updated dependencies [[`f263a20`](https://github.com/kubb-labs/kubb/commit/f263a20f1f31707092e2aca8058875e979b8517e)]:
  - @kubb/core@4.16.0
  - @kubb/oas@4.16.0
  - @kubb/plugin-oas@4.16.0
  - @kubb/plugin-ts@4.16.0

## 4.15.2

### Patch Changes

- Updated dependencies [[`dfcc4fc`](https://github.com/kubb-labs/kubb/commit/dfcc4fcaf80e31fad6e10d886fdf87b79fc2817d)]:
  - @kubb/oas@4.15.2
  - @kubb/plugin-oas@4.15.2
  - @kubb/plugin-ts@4.15.2
  - @kubb/core@4.15.2

## 4.15.1

### Patch Changes

- Updated dependencies [[`349a274`](https://github.com/kubb-labs/kubb/commit/349a274390adef38404be4fea5b54376f8d1dc40)]:
  - @kubb/plugin-ts@4.15.1
  - @kubb/core@4.15.1
  - @kubb/oas@4.15.1
  - @kubb/plugin-oas@4.15.1

## 4.15.0

### Patch Changes

- Updated dependencies [[`4990f00`](https://github.com/kubb-labs/kubb/commit/4990f00c90367a5f1550ad4d54e76343a9c4d625)]:
  - @kubb/core@4.15.0
  - @kubb/plugin-oas@4.15.0
  - @kubb/oas@4.15.0
  - @kubb/plugin-ts@4.15.0

## 4.14.1

### Patch Changes

- Updated dependencies [[`f66a49e`](https://github.com/kubb-labs/kubb/commit/f66a49e1a44726a1e8887df59ce531474deec7db)]:
  - @kubb/plugin-ts@4.14.1
  - @kubb/core@4.14.1
  - @kubb/oas@4.14.1
  - @kubb/plugin-oas@4.14.1

## 4.14.0

### Patch Changes

- Updated dependencies [[`092f78c`](https://github.com/kubb-labs/kubb/commit/092f78c7a8432468c57599b156e9b23337a38120)]:
  - @kubb/plugin-ts@4.14.0
  - @kubb/core@4.14.0
  - @kubb/oas@4.14.0
  - @kubb/plugin-oas@4.14.0

## 4.13.1

### Patch Changes

- Updated dependencies [[`77f931f`](https://github.com/kubb-labs/kubb/commit/77f931ff4cfa03fec479e8337b5913acf3c58384)]:
  - @kubb/plugin-ts@4.13.1
  - @kubb/core@4.13.1
  - @kubb/oas@4.13.1
  - @kubb/plugin-oas@4.13.1

## 4.13.0

### Patch Changes

- Updated dependencies [[`f5a38da`](https://github.com/kubb-labs/kubb/commit/f5a38da05b1bf0553ee523628f7bedcccda51d94)]:
  - @kubb/core@4.13.0
  - @kubb/oas@4.13.0
  - @kubb/plugin-oas@4.13.0
  - @kubb/plugin-ts@4.13.0

## 4.12.15

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.12.15
  - @kubb/oas@4.12.15
  - @kubb/plugin-oas@4.12.15
  - @kubb/plugin-ts@4.12.15

## 4.12.14

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.12.14
  - @kubb/oas@4.12.14
  - @kubb/plugin-oas@4.12.14
  - @kubb/plugin-ts@4.12.14

## 4.12.13

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.12.13
  - @kubb/oas@4.12.13
  - @kubb/plugin-oas@4.12.13
  - @kubb/plugin-ts@4.12.13

## 4.12.12

### Patch Changes

- Updated dependencies [[`6e15732`](https://github.com/kubb-labs/kubb/commit/6e15732cc3fe4a5ae386d3dcff41527930755cb6)]:
  - @kubb/oas@4.12.12
  - @kubb/plugin-oas@4.12.12
  - @kubb/plugin-ts@4.12.12
  - @kubb/core@4.12.12

## 4.12.11

### Patch Changes

- Updated dependencies [[`5334e6e`](https://github.com/kubb-labs/kubb/commit/5334e6eca99856560c46a774e30f4ddc085edbb0)]:
  - @kubb/oas@4.12.11
  - @kubb/plugin-oas@4.12.11
  - @kubb/plugin-ts@4.12.11
  - @kubb/core@4.12.11

## 4.12.10

### Patch Changes

- Updated dependencies [[`028f5e8`](https://github.com/kubb-labs/kubb/commit/028f5e85109853b1d9a10a17ff0d2d269975b61f)]:
  - @kubb/plugin-ts@4.12.10
  - @kubb/core@4.12.10
  - @kubb/oas@4.12.10
  - @kubb/plugin-oas@4.12.10

## 4.12.9

### Patch Changes

- Updated dependencies [[`600053d`](https://github.com/kubb-labs/kubb/commit/600053db677dc6ba1b60c822d6dad23d6da60507)]:
  - @kubb/plugin-oas@4.12.9
  - @kubb/plugin-ts@4.12.9
  - @kubb/oas@4.12.9
  - @kubb/core@4.12.9

## 4.12.8

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.12.8
  - @kubb/oas@4.12.8
  - @kubb/plugin-oas@4.12.8
  - @kubb/plugin-ts@4.12.8

## 4.12.7

### Patch Changes

- Updated dependencies [[`03babc8`](https://github.com/kubb-labs/kubb/commit/03babc84964e3d5e8a294f8be55cdee55f106ecc), [`93b39af`](https://github.com/kubb-labs/kubb/commit/93b39aff5874c959ce1d3ee1203ea378a0cbe663)]:
  - @kubb/plugin-oas@4.12.7
  - @kubb/core@4.12.7
  - @kubb/plugin-ts@4.12.7
  - @kubb/oas@4.12.7

## 4.12.6

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.12.6
  - @kubb/oas@4.12.6
  - @kubb/plugin-oas@4.12.6
  - @kubb/plugin-ts@4.12.6

## 4.12.5

### Patch Changes

- Updated dependencies [[`f6e6ee4`](https://github.com/kubb-labs/kubb/commit/f6e6ee4402c4a0e5b130414ea45210432e20afcc)]:
  - @kubb/oas@4.12.5
  - @kubb/core@4.12.5
  - @kubb/plugin-oas@4.12.5
  - @kubb/plugin-ts@4.12.5

## 4.12.4

### Patch Changes

- Updated dependencies [[`329cf02`](https://github.com/kubb-labs/kubb/commit/329cf021783d3e0f00d2597eefbc20487bfb5e23)]:
  - @kubb/plugin-oas@4.12.4
  - @kubb/plugin-ts@4.12.4
  - @kubb/core@4.12.4
  - @kubb/oas@4.12.4

## 4.12.3

### Patch Changes

- [#2195](https://github.com/kubb-labs/kubb/pull/2195) [`a7608e0`](https://github.com/kubb-labs/kubb/commit/a7608e00af70dcc22e61eec80d931a94010cde5e) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Fix handling of query parameters with explode=true and style=form for objects with additionalProperties. When a query parameter has style: "form", explode: true, and a schema with type: "object" and additionalProperties but no defined properties, the parameter is now correctly flattened to have additionalProperties at the root level instead of being nested as a property. This matches the OpenAPI specification where explode: true causes object properties to be expanded as separate query parameters.

- Updated dependencies [[`a7608e0`](https://github.com/kubb-labs/kubb/commit/a7608e00af70dcc22e61eec80d931a94010cde5e)]:
  - @kubb/oas@4.12.3
  - @kubb/plugin-ts@4.12.3
  - @kubb/plugin-oas@4.12.3
  - @kubb/core@4.12.3

## 4.12.2

### Patch Changes

- Updated dependencies [[`ca14aff`](https://github.com/kubb-labs/kubb/commit/ca14affdd51c47eba4012c64ae0528e284012536)]:
  - @kubb/plugin-ts@4.12.2
  - @kubb/core@4.12.2
  - @kubb/oas@4.12.2
  - @kubb/plugin-oas@4.12.2

## 4.12.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.12.1
  - @kubb/oas@4.12.1
  - @kubb/plugin-oas@4.12.1
  - @kubb/plugin-ts@4.12.1

## 4.12.0

### Patch Changes

- Updated dependencies [[`d16354c`](https://github.com/kubb-labs/kubb/commit/d16354c4afc013e47b0ee935efdc526d908de617)]:
  - @kubb/core@4.12.0
  - @kubb/plugin-oas@4.12.0
  - @kubb/plugin-ts@4.12.0
  - @kubb/oas@4.12.0

## 4.11.3

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.11.3
  - @kubb/oas@4.11.3
  - @kubb/plugin-oas@4.11.3
  - @kubb/plugin-ts@4.11.3

## 4.11.2

### Patch Changes

- Updated dependencies [[`c71df32`](https://github.com/kubb-labs/kubb/commit/c71df32646b1f4dbfa0d94f2f411ae114e0afac4)]:
  - @kubb/oas@4.11.2
  - @kubb/plugin-oas@4.11.2
  - @kubb/plugin-ts@4.11.2
  - @kubb/core@4.11.2

## 4.11.1

### Patch Changes

- [#2154](https://github.com/kubb-labs/kubb/pull/2154) [`801a678`](https://github.com/kubb-labs/kubb/commit/801a67818bf58ccad0a804a7177b0d1e7da2e4b0) Thanks [@IanVS](https://github.com/IanVS)! - Allow overriding data in mocks when using allOf schemas

- Updated dependencies []:
  - @kubb/core@4.11.1
  - @kubb/oas@4.11.1
  - @kubb/plugin-oas@4.11.1
  - @kubb/plugin-ts@4.11.1

## 4.11.0

### Minor Changes

- [#2149](https://github.com/kubb-labs/kubb/pull/2149) [`c3c210f`](https://github.com/kubb-labs/kubb/commit/c3c210f48c061a0612aec0a8f3f12cd9e50f4483) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Refactor parsers to use shared `createParser` helper

  Introduces `createParser` helper in `@kubb/plugin-oas` to eliminate parser duplication across Zod, TypeScript, and Faker plugins. Each parser previously reimplemented ~300 lines of schema traversal logic.

  **New Features:**
  - New `createParser` API in `@kubb/plugin-oas` that accepts keyword mapper + custom handlers
  - Exports `findSchemaKeyword` utility for constraint lookup in sibling schemas
  - Handlers can use `this.parse` for recursive parsing (enabled via Function.call())

  **Parser Changes:**
  - `@kubb/plugin-zod`: Converted to use handlers for mini-mode, object getters, coercion
  - `@kubb/plugin-ts`: Converted to use handlers for JSDoc generation, AST node construction
  - `@kubb/plugin-faker`: Converted to use handlers for dynamic type generation

  **Breaking Changes:**
  - None. No breaking type renames have been made in this PR.

  All existing tests pass. No functional changes to generated code.

### Patch Changes

- Updated dependencies [[`51dd885`](https://github.com/kubb-labs/kubb/commit/51dd88584f6f4f5c572808a62aaf4c197701dbf5), [`c3c210f`](https://github.com/kubb-labs/kubb/commit/c3c210f48c061a0612aec0a8f3f12cd9e50f4483)]:
  - @kubb/plugin-ts@4.11.0
  - @kubb/plugin-oas@4.11.0
  - @kubb/core@4.11.0
  - @kubb/oas@4.11.0

## 4.10.1

### Patch Changes

- Updated dependencies [[`6b6c13d`](https://github.com/kubb-labs/kubb/commit/6b6c13d2cf23ad056879cb66cd81995fd43def11)]:
  - @kubb/core@4.10.1
  - @kubb/plugin-oas@4.10.1
  - @kubb/plugin-ts@4.10.1
  - @kubb/oas@4.10.1

## 4.10.0

### Patch Changes

- Updated dependencies [[`b240890`](https://github.com/kubb-labs/kubb/commit/b240890fde6369293a076f031a826ed7455c73e8)]:
  - @kubb/plugin-ts@4.10.0
  - @kubb/core@4.10.0
  - @kubb/oas@4.10.0
  - @kubb/plugin-oas@4.10.0

## 4.9.4

### Patch Changes

- Updated dependencies [[`e71c931`](https://github.com/kubb-labs/kubb/commit/e71c93110ec19e830a068e8343aaf7cfcce5ef0c)]:
  - @kubb/plugin-oas@4.9.4
  - @kubb/plugin-ts@4.9.4
  - @kubb/core@4.9.4
  - @kubb/oas@4.9.4

## 4.9.3

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.9.3
  - @kubb/oas@4.9.3
  - @kubb/plugin-oas@4.9.3
  - @kubb/plugin-ts@4.9.3

## 4.9.2

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.9.2
  - @kubb/oas@4.9.2
  - @kubb/plugin-oas@4.9.2
  - @kubb/plugin-ts@4.9.2

## 4.9.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.9.1
  - @kubb/oas@4.9.1
  - @kubb/plugin-oas@4.9.1
  - @kubb/plugin-ts@4.9.1

## 4.9.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.9.0
  - @kubb/oas@4.9.0
  - @kubb/plugin-oas@4.9.0
  - @kubb/plugin-ts@4.9.0

## 4.8.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.8.1
  - @kubb/oas@4.8.1
  - @kubb/plugin-oas@4.8.1
  - @kubb/plugin-ts@4.8.1

## 4.8.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.8.0
  - @kubb/oas@4.8.0
  - @kubb/plugin-oas@4.8.0
  - @kubb/plugin-ts@4.8.0

## 4.7.4

### Patch Changes

- Updated dependencies [[`93e6d79`](https://github.com/kubb-labs/kubb/commit/93e6d797f96562c0eda33f2dd99183e861b40934)]:
  - @kubb/plugin-oas@4.7.4
  - @kubb/plugin-ts@4.7.4
  - @kubb/core@4.7.4
  - @kubb/oas@4.7.4

## 4.7.3

### Patch Changes

- Updated dependencies [[`187ae52`](https://github.com/kubb-labs/kubb/commit/187ae520791b14962712a23671952c3ca9c92f3f)]:
  - @kubb/plugin-oas@4.7.3
  - @kubb/plugin-ts@4.7.3
  - @kubb/core@4.7.3
  - @kubb/oas@4.7.3

## 4.7.2

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.7.2
  - @kubb/oas@4.7.2
  - @kubb/plugin-oas@4.7.2
  - @kubb/plugin-ts@4.7.2

## 4.7.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.7.1
  - @kubb/oas@4.7.1
  - @kubb/plugin-oas@4.7.1
  - @kubb/plugin-ts@4.7.1

## 4.7.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.7.0
  - @kubb/oas@4.7.0
  - @kubb/plugin-oas@4.7.0
  - @kubb/plugin-ts@4.7.0

## 4.6.4

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.6.4
  - @kubb/oas@4.6.4
  - @kubb/plugin-oas@4.6.4
  - @kubb/plugin-ts@4.6.4

## 4.6.3

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.6.3
  - @kubb/oas@4.6.3
  - @kubb/plugin-oas@4.6.3
  - @kubb/plugin-ts@4.6.3

## 4.6.2

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.6.2
  - @kubb/oas@4.6.2
  - @kubb/plugin-oas@4.6.2
  - @kubb/plugin-ts@4.6.2

## 4.6.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.6.1
  - @kubb/oas@4.6.1
  - @kubb/plugin-oas@4.6.1
  - @kubb/plugin-ts@4.6.1

## 4.6.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.6.0
  - @kubb/oas@4.6.0
  - @kubb/plugin-oas@4.6.0
  - @kubb/plugin-ts@4.6.0

## 4.5.15

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.5.15
  - @kubb/oas@4.5.15
  - @kubb/plugin-oas@4.5.15
  - @kubb/plugin-ts@4.5.15

## 4.5.14

### Patch Changes

- Updated dependencies [[`c09550b`](https://github.com/kubb-labs/kubb/commit/c09550bc68baf001a82df1b130f6144c665f238c)]:
  - @kubb/core@4.5.14
  - @kubb/plugin-oas@4.5.14
  - @kubb/plugin-ts@4.5.14
  - @kubb/oas@4.5.14

## 4.5.13

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.5.13
  - @kubb/oas@4.5.13
  - @kubb/plugin-oas@4.5.13
  - @kubb/plugin-ts@4.5.13

## 4.5.12

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.5.12
  - @kubb/oas@4.5.12
  - @kubb/plugin-oas@4.5.12
  - @kubb/plugin-ts@4.5.12

## 4.5.11

### Patch Changes

- Updated dependencies [[`8dd9b83`](https://github.com/kubb-labs/kubb/commit/8dd9b833a84c6984a8056f0f4170fe60360b9ca7)]:
  - @kubb/plugin-oas@4.5.11
  - @kubb/plugin-ts@4.5.11
  - @kubb/core@4.5.11
  - @kubb/oas@4.5.11

## 4.5.10

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.5.10
  - @kubb/oas@4.5.10
  - @kubb/plugin-oas@4.5.10
  - @kubb/plugin-ts@4.5.10

## 4.5.9

### Patch Changes

- Updated dependencies [[`b334be1`](https://github.com/kubb-labs/kubb/commit/b334be118a3e54f3e76713edc6bfe6a562b10084)]:
  - @kubb/plugin-oas@4.5.9
  - @kubb/plugin-ts@4.5.9
  - @kubb/oas@4.5.9
  - @kubb/core@4.5.9

## 4.5.8

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.5.8
  - @kubb/oas@4.5.8
  - @kubb/plugin-oas@4.5.8
  - @kubb/plugin-ts@4.5.8

## 4.5.7

### Patch Changes

- [`40e29ca`](https://github.com/kubb-labs/kubb/commit/40e29ca67ab79e15523cfda8ae648cb0aa2712f9) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Use of fixed fabric version

- Updated dependencies [[`40e29ca`](https://github.com/kubb-labs/kubb/commit/40e29ca67ab79e15523cfda8ae648cb0aa2712f9)]:
  - @kubb/plugin-oas@4.5.7
  - @kubb/plugin-ts@4.5.7
  - @kubb/core@4.5.7
  - @kubb/oas@4.5.7

## 4.5.6

### Patch Changes

- Updated dependencies [[`613ad38`](https://github.com/kubb-labs/kubb/commit/613ad381a8d73dd3815eb72d7cd32da2290d3203)]:
  - @kubb/core@4.5.6
  - @kubb/plugin-oas@4.5.6
  - @kubb/plugin-ts@4.5.6
  - @kubb/oas@4.5.6

## 4.5.5

### Patch Changes

- Updated dependencies [[`ec21400`](https://github.com/kubb-labs/kubb/commit/ec21400d90c7e6cdf93485db30ca23624d652ec8)]:
  - @kubb/core@4.5.5
  - @kubb/plugin-oas@4.5.5
  - @kubb/plugin-ts@4.5.5
  - @kubb/oas@4.5.5

## 4.5.4

### Patch Changes

- Updated dependencies [[`f81d4f1`](https://github.com/kubb-labs/kubb/commit/f81d4f133b302e6fbc03787fa4be40806066acc7)]:
  - @kubb/core@4.5.4
  - @kubb/plugin-oas@4.5.4
  - @kubb/plugin-ts@4.5.4
  - @kubb/oas@4.5.4

## 4.5.3

### Patch Changes

- Updated dependencies [[`7c6235d`](https://github.com/kubb-labs/kubb/commit/7c6235da0bdd6a61091ef296f80f9bc136fcf7d2)]:
  - @kubb/plugin-oas@4.5.3
  - @kubb/plugin-ts@4.5.3
  - @kubb/core@4.5.3
  - @kubb/oas@4.5.3

## 4.5.2

### Patch Changes

- Updated dependencies [[`56207b9`](https://github.com/kubb-labs/kubb/commit/56207b9b36cad9ccef190fe68716c3d78bb257c8)]:
  - @kubb/core@4.5.2
  - @kubb/plugin-oas@4.5.2
  - @kubb/plugin-ts@4.5.2
  - @kubb/oas@4.5.2

## 4.5.1

### Patch Changes

- Updated dependencies []:
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
  - @kubb/core@4.5.0
  - @kubb/plugin-ts@4.5.0
  - @kubb/oas@4.5.0

## 4.4.1

### Patch Changes

- [#1963](https://github.com/kubb-labs/kubb/pull/1963) [`75d0730`](https://github.com/kubb-labs/kubb/commit/75d0730ac261332442a70ee056a0b91acc56db6d) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Update Fabric to get latest changes

- Updated dependencies [[`75d0730`](https://github.com/kubb-labs/kubb/commit/75d0730ac261332442a70ee056a0b91acc56db6d)]:
  - @kubb/plugin-oas@4.4.1
  - @kubb/plugin-ts@4.4.1
  - @kubb/core@4.4.1
  - @kubb/oas@4.4.1

## 4.4.0

### Minor Changes

- [#1961](https://github.com/kubb-labs/kubb/pull/1961) [`bed6f9c`](https://github.com/kubb-labs/kubb/commit/bed6f9cf482ad4bbd2119c9de38f1184227b82cc) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - removal of Kubb react in favor of using `@kubb/react-fabric`

### Patch Changes

- Updated dependencies [[`25bf2e7`](https://github.com/kubb-labs/kubb/commit/25bf2e7f54feeaf2341701fee2a2a819ae8d143d), [`bed6f9c`](https://github.com/kubb-labs/kubb/commit/bed6f9cf482ad4bbd2119c9de38f1184227b82cc)]:
  - @kubb/core@4.4.0
  - @kubb/plugin-oas@4.4.0
  - @kubb/plugin-ts@4.4.0
  - @kubb/oas@4.4.0

## 4.3.1

### Patch Changes

- [#1953](https://github.com/kubb-labs/kubb/pull/1953) [`6b6f5b0`](https://github.com/kubb-labs/kubb/commit/6b6f5b0d20ddc7b42b2fd9daf8cb1483d2c3af92) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - update PeerDependencies @kubb/react

- Updated dependencies [[`6b6f5b0`](https://github.com/kubb-labs/kubb/commit/6b6f5b0d20ddc7b42b2fd9daf8cb1483d2c3af92)]:
  - @kubb/plugin-oas@4.3.1
  - @kubb/plugin-ts@4.3.1
  - @kubb/core@4.3.1
  - @kubb/oas@4.3.1
  - @kubb/react@4.3.1

## 4.3.0

### Patch Changes

- [#1946](https://github.com/kubb-labs/kubb/pull/1946) [`1a3e1d9`](https://github.com/kubb-labs/kubb/commit/1a3e1d98015ec768c0d5e563888003047fda351c) Thanks [@blackravenx](https://github.com/blackravenx)! - add exclusiveMaximum and exclusiveMinimum to keyword mappers in parser

- Updated dependencies [[`1a3e1d9`](https://github.com/kubb-labs/kubb/commit/1a3e1d98015ec768c0d5e563888003047fda351c), [`1a3e1d9`](https://github.com/kubb-labs/kubb/commit/1a3e1d98015ec768c0d5e563888003047fda351c)]:
  - @kubb/plugin-oas@4.3.0
  - @kubb/plugin-ts@4.3.0
  - @kubb/core@4.3.0
  - @kubb/oas@4.3.0
  - @kubb/react@4.3.0

## 4.2.2

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.2.2
  - @kubb/oas@4.2.2
  - @kubb/plugin-oas@4.2.2
  - @kubb/plugin-ts@4.2.2
  - @kubb/react@4.2.2

## 4.2.1

### Patch Changes

- Updated dependencies [[`945f689`](https://github.com/kubb-labs/kubb/commit/945f689c64371fa06aaa5772974420d712f17619)]:
  - @kubb/core@4.2.1
  - @kubb/plugin-oas@4.2.1
  - @kubb/plugin-ts@4.2.1
  - @kubb/oas@4.2.1
  - @kubb/react@4.2.1

## 4.2.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.2.0
  - @kubb/oas@4.2.0
  - @kubb/plugin-oas@4.2.0
  - @kubb/plugin-ts@4.2.0
  - @kubb/react@4.2.0

## 4.1.4

### Patch Changes

- [#1932](https://github.com/kubb-labs/kubb/pull/1932) [`7026041`](https://github.com/kubb-labs/kubb/commit/7026041062d98d9d330d8c3a858e298a5de0d04d) Thanks [@Ericlm](https://github.com/Ericlm)! - Add optional data parameter to override default faker generated strings and numbers

- Updated dependencies []:
  - @kubb/core@4.1.4
  - @kubb/oas@4.1.4
  - @kubb/plugin-oas@4.1.4
  - @kubb/plugin-ts@4.1.4
  - @kubb/react@4.1.4

## 4.1.3

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.1.3
  - @kubb/oas@4.1.3
  - @kubb/plugin-oas@4.1.3
  - @kubb/plugin-ts@4.1.3
  - @kubb/react@4.1.3

## 4.1.2

### Patch Changes

- Updated dependencies [[`acf033c`](https://github.com/kubb-labs/kubb/commit/acf033c7a2540741e57ab130c6ad94bcdbcf354c)]:
  - @kubb/core@4.1.2
  - @kubb/plugin-oas@4.1.2
  - @kubb/plugin-ts@4.1.2
  - @kubb/react@4.1.2
  - @kubb/oas@4.1.2

## 4.1.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.1.1
  - @kubb/oas@4.1.1
  - @kubb/plugin-oas@4.1.1
  - @kubb/plugin-ts@4.1.1
  - @kubb/react@4.1.1

## 4.1.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.1.0
  - @kubb/oas@4.1.0
  - @kubb/plugin-oas@4.1.0
  - @kubb/plugin-ts@4.1.0
  - @kubb/react@4.1.0

## 4.0.2

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.0.2
  - @kubb/oas@4.0.2
  - @kubb/plugin-oas@4.0.2
  - @kubb/plugin-ts@4.0.2
  - @kubb/react@4.0.2

## 4.0.1

### Patch Changes

- Updated dependencies [[`c531bb9`](https://github.com/kubb-labs/kubb/commit/c531bb9c898c8974c74a80e3c65ac3ea7229538b)]:
  - @kubb/plugin-ts@4.0.1
  - @kubb/core@4.0.1
  - @kubb/oas@4.0.1
  - @kubb/plugin-oas@4.0.1
  - @kubb/react@4.0.1

## 4.0.0

### Patch Changes

- Updated dependencies [[`1468999`](https://github.com/kubb-labs/kubb/commit/1468999cbf23df2d4e7ab6debcaa9a7421b88bbb)]:
  - @kubb/core@4.0.0
  - @kubb/plugin-ts@4.0.0
  - @kubb/plugin-oas@4.0.0
  - @kubb/react@4.0.0
  - @kubb/oas@4.0.0

## 3.18.3

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.18.3
  - @kubb/oas@3.18.3
  - @kubb/plugin-oas@3.18.3
  - @kubb/plugin-ts@3.18.3
  - @kubb/react@3.18.3

## 3.18.2

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.18.2
  - @kubb/oas@3.18.2
  - @kubb/plugin-oas@3.18.2
  - @kubb/plugin-ts@3.18.2
  - @kubb/react@3.18.2

## 3.18.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.18.1
  - @kubb/plugin-ts@3.18.1
  - @kubb/react@3.18.1
  - @kubb/plugin-oas@3.18.1
  - @kubb/oas@3.18.1

## 3.17.1

### Patch Changes

- [`5362b0f`](https://github.com/kubb-labs/kubb/commit/5362b0f93ee9fa2ca68d58de57c03d3573d2cdfb) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Escaping regex correctly by using `new RegExp().source` behind the scenes

- Updated dependencies [[`5362b0f`](https://github.com/kubb-labs/kubb/commit/5362b0f93ee9fa2ca68d58de57c03d3573d2cdfb)]:
  - @kubb/core@3.17.1
  - @kubb/plugin-oas@3.17.1
  - @kubb/plugin-ts@3.17.1
  - @kubb/react@3.17.1
  - @kubb/oas@3.17.1

## 3.17.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.17.0
  - @kubb/oas@3.17.0
  - @kubb/plugin-oas@3.17.0
  - @kubb/plugin-ts@3.17.0
  - @kubb/react@3.17.0

## 3.16.4

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.16.4
  - @kubb/oas@3.16.4
  - @kubb/plugin-oas@3.16.4
  - @kubb/plugin-ts@3.16.4
  - @kubb/react@3.16.4

## 3.16.3

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.16.3
  - @kubb/oas@3.16.3
  - @kubb/plugin-oas@3.16.3
  - @kubb/plugin-ts@3.16.3
  - @kubb/react@3.16.3

## 3.16.2

### Patch Changes

- Updated dependencies [[`9f386f7`](https://github.com/kubb-labs/kubb/commit/9f386f763728119c1baef4ee50733e6dc2079ac7), [`9f386f7`](https://github.com/kubb-labs/kubb/commit/9f386f763728119c1baef4ee50733e6dc2079ac7)]:
  - @kubb/plugin-ts@3.16.2
  - @kubb/core@3.16.2
  - @kubb/oas@3.16.2
  - @kubb/plugin-oas@3.16.2
  - @kubb/react@3.16.2

## 3.16.1

### Patch Changes

- Updated dependencies [[`e51db4c`](https://github.com/kubb-labs/kubb/commit/e51db4c77b3bb7e044382d2b19400262e927cd3a)]:
  - @kubb/plugin-oas@3.16.1
  - @kubb/plugin-ts@3.16.1
  - @kubb/core@3.16.1
  - @kubb/oas@3.16.1
  - @kubb/react@3.16.1

## 3.16.0

### Patch Changes

- Updated dependencies [[`c7360e8`](https://github.com/kubb-labs/kubb/commit/c7360e879436d035229ade7afc2f2870e0538a89)]:
  - @kubb/core@3.16.0
  - @kubb/oas@3.16.0
  - @kubb/plugin-oas@3.16.0
  - @kubb/plugin-ts@3.16.0
  - @kubb/react@3.16.0

## 3.15.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.15.1
  - @kubb/oas@3.15.1
  - @kubb/plugin-oas@3.15.1
  - @kubb/plugin-ts@3.15.1
  - @kubb/react@3.15.1

## 3.15.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.15.0
  - @kubb/oas@3.15.0
  - @kubb/plugin-oas@3.15.0
  - @kubb/plugin-ts@3.15.0
  - @kubb/react@3.15.0

## 3.14.4

### Patch Changes

- Updated dependencies [[`18572ff`](https://github.com/kubb-labs/kubb/commit/18572ff28378e8ac9bee5157a71ab2cc7d89d612)]:
  - @kubb/plugin-oas@3.14.4
  - @kubb/plugin-ts@3.14.4
  - @kubb/core@3.14.4
  - @kubb/oas@3.14.4
  - @kubb/react@3.14.4

## 3.14.3

### Patch Changes

- Updated dependencies [[`2376899`](https://github.com/kubb-labs/kubb/commit/2376899898e92483945e48c7bbca2398d3b8ac9c), [`2376899`](https://github.com/kubb-labs/kubb/commit/2376899898e92483945e48c7bbca2398d3b8ac9c), [`991249c`](https://github.com/kubb-labs/kubb/commit/991249c18e86c6ebdfef3912de44cbfaa81b6891)]:
  - @kubb/plugin-oas@3.14.3
  - @kubb/core@3.14.3
  - @kubb/plugin-ts@3.14.3
  - @kubb/react@3.14.3
  - @kubb/oas@3.14.3

## 3.14.2

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.14.2
  - @kubb/oas@3.14.2
  - @kubb/plugin-oas@3.14.2
  - @kubb/plugin-ts@3.14.2
  - @kubb/react@3.14.2

## 3.14.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.14.1
  - @kubb/plugin-ts@3.14.1
  - @kubb/react@3.14.1
  - @kubb/plugin-oas@3.14.1
  - @kubb/oas@3.14.1

## 3.14.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.14.0
  - @kubb/oas@3.14.0
  - @kubb/plugin-oas@3.14.0
  - @kubb/plugin-ts@3.14.0
  - @kubb/react@3.14.0

## 3.13.2

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.13.2
  - @kubb/plugin-oas@3.13.2
  - @kubb/plugin-ts@3.13.2
  - @kubb/react@3.13.2
  - @kubb/oas@3.13.2

## 3.13.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.13.1
  - @kubb/oas@3.13.1
  - @kubb/plugin-oas@3.13.1
  - @kubb/plugin-ts@3.13.1
  - @kubb/react@3.13.1

## 3.13.0

### Minor Changes

- [`d875cd8`](https://github.com/kubb-labs/kubb/commit/d875cd81d443cb6258011b7f5fd918e220deaf53) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Adds `emptySchemaType`. It is used whenever schema is "empty" and defaults to the value of unknownType when not specified which maintains backwards compatibility.

### Patch Changes

- Updated dependencies [[`d875cd8`](https://github.com/kubb-labs/kubb/commit/d875cd81d443cb6258011b7f5fd918e220deaf53)]:
  - @kubb/plugin-ts@3.13.0
  - @kubb/core@3.13.0
  - @kubb/oas@3.13.0
  - @kubb/plugin-oas@3.13.0
  - @kubb/react@3.13.0

## 3.12.2

### Patch Changes

- Updated dependencies [[`74e2203`](https://github.com/kubb-labs/kubb/commit/74e2203a91becf5728b18c979247075332dcb660)]:
  - @kubb/core@3.12.2
  - @kubb/plugin-oas@3.12.2
  - @kubb/plugin-ts@3.12.2
  - @kubb/react@3.12.2
  - @kubb/oas@3.12.2

## 3.12.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.12.1
  - @kubb/oas@3.12.1
  - @kubb/plugin-oas@3.12.1
  - @kubb/plugin-ts@3.12.1
  - @kubb/react@3.12.1

## 3.12.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.12.0
  - @kubb/oas@3.12.0
  - @kubb/plugin-oas@3.12.0
  - @kubb/plugin-ts@3.12.0
  - @kubb/react@3.12.0

## 3.11.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.11.1
  - @kubb/oas@3.11.1
  - @kubb/plugin-oas@3.11.1
  - @kubb/plugin-ts@3.11.1
  - @kubb/react@3.11.1

## 3.11.0

### Patch Changes

- [`13189ee`](https://github.com/kubb-labs/kubb/commit/13189ee0c7b297cc42cf9a7d476780ff7e357efe) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Incompatible type used for true literal enum in query param

- Updated dependencies [[`55de3d2`](https://github.com/kubb-labs/kubb/commit/55de3d2758ce4957882243ad70d3168d3c41ff40)]:
  - @kubb/plugin-oas@3.11.0
  - @kubb/plugin-ts@3.11.0
  - @kubb/core@3.11.0
  - @kubb/oas@3.11.0
  - @kubb/react@3.11.0

## 3.10.15

### Patch Changes

- Updated dependencies [[`db73926`](https://github.com/kubb-labs/kubb/commit/db73926f46739e598244bedc52f466591b2d7320)]:
  - @kubb/plugin-ts@3.10.15
  - @kubb/core@3.10.15
  - @kubb/oas@3.10.15
  - @kubb/plugin-oas@3.10.15
  - @kubb/react@3.10.15

## 3.10.14

### Patch Changes

- Updated dependencies [[`17ebfce`](https://github.com/kubb-labs/kubb/commit/17ebfce849874784aa0625310eae17c8574528b3)]:
  - @kubb/plugin-ts@3.10.14
  - @kubb/core@3.10.14
  - @kubb/oas@3.10.14
  - @kubb/plugin-oas@3.10.14
  - @kubb/react@3.10.14

## 3.10.13

### Patch Changes

- [`3c7aa35`](https://github.com/kubb-labs/kubb/commit/3c7aa354761f4dba9288db93d15e5d29d1094116) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Min and max is not applied to the faker functions when only one of them is defined

- Updated dependencies []:
  - @kubb/core@3.10.13
  - @kubb/oas@3.10.13
  - @kubb/plugin-oas@3.10.13
  - @kubb/plugin-ts@3.10.13
  - @kubb/react@3.10.13

## 3.10.12

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.10.12
  - @kubb/oas@3.10.12
  - @kubb/plugin-oas@3.10.12
  - @kubb/plugin-ts@3.10.12
  - @kubb/react@3.10.12

## 3.10.11

### Patch Changes

- Updated dependencies [[`e666e9a`](https://github.com/kubb-labs/kubb/commit/e666e9a4a038864f1d9e87a916108b291028b42b)]:
  - @kubb/plugin-oas@3.10.11
  - @kubb/plugin-ts@3.10.11
  - @kubb/core@3.10.11
  - @kubb/oas@3.10.11
  - @kubb/react@3.10.11

## 3.10.10

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.10.10
  - @kubb/oas@3.10.10
  - @kubb/plugin-oas@3.10.10
  - @kubb/plugin-ts@3.10.10
  - @kubb/react@3.10.10

## 3.10.9

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.10.9
  - @kubb/oas@3.10.9
  - @kubb/plugin-oas@3.10.9
  - @kubb/plugin-ts@3.10.9
  - @kubb/react@3.10.9

## 3.10.8

### Patch Changes

- Updated dependencies [[`23a6e72`](https://github.com/kubb-labs/kubb/commit/23a6e72c7288bb8385707f98ef5da6d4b0339016)]:
  - @kubb/plugin-oas@3.10.8
  - @kubb/plugin-ts@3.10.8
  - @kubb/core@3.10.8
  - @kubb/oas@3.10.8
  - @kubb/react@3.10.8

## 3.10.7

### Patch Changes

- Updated dependencies [[`f7d5447`](https://github.com/kubb-labs/kubb/commit/f7d54477b8d504a8f5237b70ff7978699556500f)]:
  - @kubb/core@3.10.7
  - @kubb/plugin-oas@3.10.7
  - @kubb/plugin-ts@3.10.7
  - @kubb/react@3.10.7
  - @kubb/oas@3.10.7

## 3.10.6

### Patch Changes

- Updated dependencies [[`7be571a`](https://github.com/kubb-labs/kubb/commit/7be571aa4ceffb2e18dff1e81b81efa37fef0cc3)]:
  - @kubb/plugin-oas@3.10.6
  - @kubb/plugin-ts@3.10.6
  - @kubb/core@3.10.6
  - @kubb/react@3.10.6
  - @kubb/fs@3.10.6
  - @kubb/oas@3.10.6

## 3.10.5

### Patch Changes

- Updated dependencies [[`4eba848`](https://github.com/kubb-labs/kubb/commit/4eba848da4ab06dbe6abd6f601a4963613db6339)]:
  - @kubb/plugin-oas@3.10.5
  - @kubb/plugin-ts@3.10.5
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
  - @kubb/plugin-oas@3.10.4
  - @kubb/plugin-ts@3.10.4
  - @kubb/react@3.10.4

## 3.10.3

### Patch Changes

- Updated dependencies [[`da564ab`](https://github.com/kubb-labs/kubb/commit/da564abbf8f8e830b42f3ea39f69bc3494e796c2)]:
  - @kubb/plugin-oas@3.10.3
  - @kubb/plugin-ts@3.10.3
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
  - @kubb/plugin-oas@3.10.2
  - @kubb/plugin-ts@3.10.2
  - @kubb/react@3.10.2

## 3.10.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.10.1
  - @kubb/fs@3.10.1
  - @kubb/oas@3.10.1
  - @kubb/plugin-oas@3.10.1
  - @kubb/plugin-ts@3.10.1
  - @kubb/react@3.10.1

## 3.10.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.10.0
  - @kubb/fs@3.10.0
  - @kubb/oas@3.10.0
  - @kubb/plugin-oas@3.10.0
  - @kubb/plugin-ts@3.10.0
  - @kubb/react@3.10.0

## 3.9.5

### Patch Changes

- Updated dependencies [[`cd36453`](https://github.com/kubb-labs/kubb/commit/cd364531aff4fa0956584234bf04ad105c27baa7)]:
  - @kubb/plugin-oas@3.9.5
  - @kubb/plugin-ts@3.9.5
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
  - @kubb/plugin-oas@3.9.4
  - @kubb/plugin-ts@3.9.4
  - @kubb/react@3.9.4

## 3.9.3

### Patch Changes

- Updated dependencies [[`208da32`](https://github.com/kubb-labs/kubb/commit/208da32045557dbb32a739ea0031d67848e59928)]:
  - @kubb/plugin-ts@3.9.3
  - @kubb/core@3.9.3
  - @kubb/fs@3.9.3
  - @kubb/oas@3.9.3
  - @kubb/plugin-oas@3.9.3
  - @kubb/react@3.9.3

## 3.9.2

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.9.2
  - @kubb/fs@3.9.2
  - @kubb/oas@3.9.2
  - @kubb/plugin-oas@3.9.2
  - @kubb/plugin-ts@3.9.2
  - @kubb/react@3.9.2

## 3.9.1

### Patch Changes

- [#1648](https://github.com/kubb-labs/kubb/pull/1648) [`ea3f531`](https://github.com/kubb-labs/kubb/commit/ea3f531f9abacbfb4f046c48f927fab67c882253) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - reduce any's being used

- Updated dependencies [[`ea3f531`](https://github.com/kubb-labs/kubb/commit/ea3f531f9abacbfb4f046c48f927fab67c882253)]:
  - @kubb/plugin-ts@3.9.1
  - @kubb/core@3.9.1
  - @kubb/fs@3.9.1
  - @kubb/oas@3.9.1
  - @kubb/plugin-oas@3.9.1
  - @kubb/react@3.9.1

## 3.9.0

### Patch Changes

- Updated dependencies [[`f8cfede`](https://github.com/kubb-labs/kubb/commit/f8cfedee78bb3ff81ba0dcc8e68dc9172913dbe0)]:
  - @kubb/plugin-oas@3.9.0
  - @kubb/plugin-ts@3.9.0
  - @kubb/core@3.9.0
  - @kubb/react@3.9.0
  - @kubb/fs@3.9.0
  - @kubb/oas@3.9.0

## 3.8.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.8.1
  - @kubb/fs@3.8.1
  - @kubb/oas@3.8.1
  - @kubb/plugin-oas@3.8.1
  - @kubb/plugin-ts@3.8.1
  - @kubb/react@3.8.1

## 3.8.0

### Patch Changes

- Updated dependencies [[`f7c5bb8`](https://github.com/kubb-labs/kubb/commit/f7c5bb8992c47333d8529e4494591c2029abd28a)]:
  - @kubb/react@3.8.0
  - @kubb/plugin-oas@3.8.0
  - @kubb/plugin-ts@3.8.0
  - @kubb/core@3.8.0
  - @kubb/fs@3.8.0
  - @kubb/oas@3.8.0

## 3.7.7

### Patch Changes

- Updated dependencies [[`1d415d7`](https://github.com/kubb-labs/kubb/commit/1d415d77370125c9110ea478850c7e8f4e36c13f)]:
  - @kubb/plugin-oas@3.7.7
  - @kubb/plugin-ts@3.7.7
  - @kubb/core@3.7.7
  - @kubb/fs@3.7.7
  - @kubb/oas@3.7.7
  - @kubb/react@3.7.7

## 3.7.6

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.7.6
  - @kubb/fs@3.7.6
  - @kubb/oas@3.7.6
  - @kubb/plugin-oas@3.7.6
  - @kubb/plugin-ts@3.7.6
  - @kubb/react@3.7.6

## 3.7.5

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.7.5
  - @kubb/fs@3.7.5
  - @kubb/oas@3.7.5
  - @kubb/plugin-oas@3.7.5
  - @kubb/plugin-ts@3.7.5
  - @kubb/react@3.7.5

## 3.7.4

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.7.4
  - @kubb/fs@3.7.4
  - @kubb/oas@3.7.4
  - @kubb/plugin-oas@3.7.4
  - @kubb/plugin-ts@3.7.4
  - @kubb/react@3.7.4

## 3.7.3

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.7.3
  - @kubb/fs@3.7.3
  - @kubb/oas@3.7.3
  - @kubb/plugin-oas@3.7.3
  - @kubb/plugin-ts@3.7.3
  - @kubb/react@3.7.3

## 3.7.2

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.7.2
  - @kubb/fs@3.7.2
  - @kubb/oas@3.7.2
  - @kubb/plugin-oas@3.7.2
  - @kubb/plugin-ts@3.7.2
  - @kubb/react@3.7.2

## 3.7.1

### Patch Changes

- [#1619](https://github.com/kubb-labs/kubb/pull/1619) [`c02381c`](https://github.com/kubb-labs/kubb/commit/c02381c9952c6f6183b0f8b998ba398e2e6a1e05) Thanks [@aburgel](https://github.com/aburgel)! - fix: Improve formatting of fake dates and times

- Updated dependencies []:
  - @kubb/core@3.7.1
  - @kubb/fs@3.7.1
  - @kubb/oas@3.7.1
  - @kubb/plugin-oas@3.7.1
  - @kubb/plugin-ts@3.7.1
  - @kubb/react@3.7.1

## 3.7.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.7.0
  - @kubb/fs@3.7.0
  - @kubb/oas@3.7.0
  - @kubb/plugin-oas@3.7.0
  - @kubb/plugin-ts@3.7.0
  - @kubb/react@3.7.0

## 3.6.5

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.6.5
  - @kubb/fs@3.6.5
  - @kubb/oas@3.6.5
  - @kubb/plugin-oas@3.6.5
  - @kubb/plugin-ts@3.6.5
  - @kubb/react@3.6.5

## 3.6.4

### Patch Changes

- Updated dependencies [[`114716a`](https://github.com/kubb-labs/kubb/commit/114716ae2a4e93f8e41f8c7c03cd6b5d71620cec)]:
  - @kubb/oas@3.6.4
  - @kubb/plugin-oas@3.6.4
  - @kubb/plugin-ts@3.6.4
  - @kubb/core@3.6.4
  - @kubb/fs@3.6.4
  - @kubb/react@3.6.4

## 3.6.3

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.6.3
  - @kubb/fs@3.6.3
  - @kubb/oas@3.6.3
  - @kubb/plugin-oas@3.6.3
  - @kubb/plugin-ts@3.6.3
  - @kubb/react@3.6.3

## 3.6.2

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.6.2
  - @kubb/fs@3.6.2
  - @kubb/oas@3.6.2
  - @kubb/plugin-oas@3.6.2
  - @kubb/plugin-ts@3.6.2
  - @kubb/react@3.6.2

## 3.6.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.6.1
  - @kubb/fs@3.6.1
  - @kubb/oas@3.6.1
  - @kubb/plugin-oas@3.6.1
  - @kubb/plugin-ts@3.6.1
  - @kubb/react@3.6.1

## 3.6.0

### Patch Changes

- Updated dependencies [[`e48aa64`](https://github.com/kubb-labs/kubb/commit/e48aa6483c023ac988f71a6642a797b09f67d177)]:
  - @kubb/oas@3.6.0
  - @kubb/plugin-oas@3.6.0
  - @kubb/plugin-ts@3.6.0
  - @kubb/core@3.6.0
  - @kubb/fs@3.6.0
  - @kubb/react@3.6.0

## 3.5.13

### Patch Changes

- Updated dependencies [[`09ed7ba`](https://github.com/kubb-labs/kubb/commit/09ed7ba9d585dabca249a0cddd18c8a0dce6f5e1)]:
  - @kubb/plugin-ts@3.5.13
  - @kubb/oas@3.5.13
  - @kubb/core@3.5.13
  - @kubb/react@3.5.13
  - @kubb/plugin-oas@3.5.13
  - @kubb/fs@3.5.13

## 3.5.12

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.5.12
  - @kubb/fs@3.5.12
  - @kubb/oas@3.5.12
  - @kubb/plugin-oas@3.5.12
  - @kubb/plugin-ts@3.5.12
  - @kubb/react@3.5.12

## 3.5.11

### Patch Changes

- [#1557](https://github.com/kubb-labs/kubb/pull/1557) [`860aeae`](https://github.com/kubb-labs/kubb/commit/860aeae0ed57d05a03d08560292bbddc26b83ba5) Thanks [@nicholaschiang](https://github.com/nicholaschiang)! - Including and excluding tags now matches any tag, instead of just the first one.

- Updated dependencies [[`860aeae`](https://github.com/kubb-labs/kubb/commit/860aeae0ed57d05a03d08560292bbddc26b83ba5)]:
  - @kubb/core@3.5.11
  - @kubb/fs@3.5.11
  - @kubb/oas@3.5.11
  - @kubb/plugin-oas@3.5.11
  - @kubb/plugin-ts@3.5.11
  - @kubb/react@3.5.11

## 3.5.10

### Patch Changes

- [#1552](https://github.com/kubb-labs/kubb/pull/1552) [`2d9d869`](https://github.com/kubb-labs/kubb/commit/2d9d8695f697013387c44c0fd2c5468575777e4e) Thanks [@Ericlm](https://github.com/Ericlm)! - updating return-type to be non-partial of entering type

- Updated dependencies []:
  - @kubb/core@3.5.10
  - @kubb/fs@3.5.10
  - @kubb/oas@3.5.10
  - @kubb/plugin-oas@3.5.10
  - @kubb/plugin-ts@3.5.10
  - @kubb/react@3.5.10

## 3.5.9

### Patch Changes

- [`622b15f`](https://github.com/kubb-labs/kubb/commit/622b15fa8217e4269f242f70424beb6736ff840f) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - returnType for faker functions

- [`622b15f`](https://github.com/kubb-labs/kubb/commit/622b15fa8217e4269f242f70424beb6736ff840f) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - only use min/max when both are set in the oas

- Updated dependencies []:
  - @kubb/core@3.5.9
  - @kubb/fs@3.5.9
  - @kubb/oas@3.5.9
  - @kubb/plugin-oas@3.5.9
  - @kubb/plugin-ts@3.5.9
  - @kubb/react@3.5.9

## 3.5.8

### Patch Changes

- [`24d9e13`](https://github.com/kubb-labs/kubb/commit/24d9e131e360dcb31e16f8978f0c0cc226002288) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - support custom `contentType` per plugin

- Updated dependencies [[`24d9e13`](https://github.com/kubb-labs/kubb/commit/24d9e131e360dcb31e16f8978f0c0cc226002288)]:
  - @kubb/plugin-oas@3.5.8
  - @kubb/plugin-ts@3.5.8
  - @kubb/core@3.5.8
  - @kubb/fs@3.5.8
  - @kubb/oas@3.5.8
  - @kubb/react@3.5.8

## 3.5.7

### Patch Changes

- Updated dependencies [[`3dec170`](https://github.com/kubb-labs/kubb/commit/3dec170dc38013bbcff625eff9de0a75da05f80e)]:
  - @kubb/react@3.5.7
  - @kubb/core@3.5.7
  - @kubb/fs@3.5.7
  - @kubb/oas@3.5.7
  - @kubb/plugin-oas@3.5.7
  - @kubb/plugin-ts@3.5.7

## 3.5.6

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.5.6
  - @kubb/fs@3.5.6
  - @kubb/oas@3.5.6
  - @kubb/plugin-oas@3.5.6
  - @kubb/plugin-ts@3.5.6
  - @kubb/react@3.5.6

## 3.5.5

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.5.5
  - @kubb/fs@3.5.5
  - @kubb/oas@3.5.5
  - @kubb/plugin-oas@3.5.5
  - @kubb/plugin-ts@3.5.5
  - @kubb/react@3.5.5

## 3.5.4

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.5.4
  - @kubb/fs@3.5.4
  - @kubb/oas@3.5.4
  - @kubb/plugin-oas@3.5.4
  - @kubb/plugin-ts@3.5.4
  - @kubb/react@3.5.4

## 3.5.3

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.5.3
  - @kubb/fs@3.5.3
  - @kubb/oas@3.5.3
  - @kubb/plugin-oas@3.5.3
  - @kubb/plugin-ts@3.5.3
  - @kubb/react@3.5.3

## 3.5.2

### Patch Changes

- [`41fb25f`](https://github.com/kubb-labs/kubb/commit/41fb25f4d4484018e5ae386772755078e6962d40) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - `faker.number.float` with default min `Number.MIN_VALUE` and max set to `Number.MAX_VALUE`.

- Updated dependencies [[`f5bae0d`](https://github.com/kubb-labs/kubb/commit/f5bae0db77f50fc11c504ab81bd077883346fd7e)]:
  - @kubb/plugin-oas@3.5.2
  - @kubb/plugin-ts@3.5.2
  - @kubb/core@3.5.2
  - @kubb/fs@3.5.2
  - @kubb/oas@3.5.2
  - @kubb/react@3.5.2

## 3.5.1

### Patch Changes

- Updated dependencies [[`967efeb`](https://github.com/kubb-labs/kubb/commit/967efeb16ced9eac0d2b1fb493b39d9b25afbafa), [`cd539c4`](https://github.com/kubb-labs/kubb/commit/cd539c403d8de72502ab49d51a63a58a76a5c2a2)]:
  - @kubb/core@3.5.1
  - @kubb/plugin-oas@3.5.1
  - @kubb/plugin-ts@3.5.1
  - @kubb/react@3.5.1
  - @kubb/fs@3.5.1
  - @kubb/oas@3.5.1

## 3.5.0

### Minor Changes

- [#1510](https://github.com/kubb-labs/kubb/pull/1510) [`d2b9643`](https://github.com/kubb-labs/kubb/commit/d2b96434da7b168f085d774f839c4ae32ab93977) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - support banner with context for Oas

### Patch Changes

- Updated dependencies [[`d2b9643`](https://github.com/kubb-labs/kubb/commit/d2b96434da7b168f085d774f839c4ae32ab93977)]:
  - @kubb/plugin-oas@3.5.0
  - @kubb/plugin-ts@3.5.0
  - @kubb/core@3.5.0
  - @kubb/react@3.5.0
  - @kubb/fs@3.5.0
  - @kubb/oas@3.5.0

## 3.4.5

### Patch Changes

- Updated dependencies [[`b678aba`](https://github.com/kubb-labs/kubb/commit/b678abae84d0e0e17af1eaa818c47e15341cf67b)]:
  - @kubb/core@3.4.5
  - @kubb/plugin-oas@3.4.5
  - @kubb/plugin-ts@3.4.5
  - @kubb/react@3.4.5
  - @kubb/fs@3.4.5
  - @kubb/oas@3.4.5

## 3.4.4

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.4.4
  - @kubb/fs@3.4.4
  - @kubb/oas@3.4.4
  - @kubb/plugin-oas@3.4.4
  - @kubb/plugin-ts@3.4.4
  - @kubb/react@3.4.4

## 3.4.3

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.4.3
  - @kubb/fs@3.4.3
  - @kubb/oas@3.4.3
  - @kubb/plugin-oas@3.4.3
  - @kubb/plugin-ts@3.4.3
  - @kubb/react@3.4.3

## 3.4.2

### Patch Changes

- [`c98130b`](https://github.com/kubb-labs/kubb/commit/c98130b1d79c9f38b214785f9950ee34376d18c5) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - correct use of grouping for path and tags

- Updated dependencies [[`c98130b`](https://github.com/kubb-labs/kubb/commit/c98130b1d79c9f38b214785f9950ee34376d18c5), [`5febbe5`](https://github.com/kubb-labs/kubb/commit/5febbe5e6cd6e03b43ad2ef5da35ba25a7eb7559)]:
  - @kubb/plugin-oas@3.4.2
  - @kubb/plugin-ts@3.4.2
  - @kubb/core@3.4.2
  - @kubb/react@3.4.2
  - @kubb/fs@3.4.2
  - @kubb/oas@3.4.2

## 3.4.1

### Patch Changes

- [`e10b59a`](https://github.com/kubb-labs/kubb/commit/e10b59aff004f03f45404b97f4480a3b5fc59d13) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - min and max was not applied to the faker functions

- Updated dependencies []:
  - @kubb/core@3.4.1
  - @kubb/fs@3.4.1
  - @kubb/oas@3.4.1
  - @kubb/plugin-oas@3.4.1
  - @kubb/plugin-ts@3.4.1
  - @kubb/react@3.4.1

## 3.4.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.4.0
  - @kubb/fs@3.4.0
  - @kubb/oas@3.4.0
  - @kubb/plugin-oas@3.4.0
  - @kubb/plugin-ts@3.4.0
  - @kubb/react@3.4.0

## 3.3.5

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.3.5
  - @kubb/fs@3.3.5
  - @kubb/oas@3.3.5
  - @kubb/plugin-oas@3.3.5
  - @kubb/plugin-ts@3.3.5
  - @kubb/react@3.3.5

## 3.3.4

### Patch Changes

- Updated dependencies [[`d8ffbfd`](https://github.com/kubb-labs/kubb/commit/d8ffbfdef7edf5ae7b4d3fd57e0a9388757d6c63)]:
  - @kubb/plugin-ts@3.3.4
  - @kubb/core@3.3.4
  - @kubb/fs@3.3.4
  - @kubb/oas@3.3.4
  - @kubb/plugin-oas@3.3.4
  - @kubb/react@3.3.4

## 3.3.3

### Patch Changes

- Updated dependencies [[`17011c8`](https://github.com/kubb-labs/kubb/commit/17011c80c60fd79c5b00b4f260fde27acb93f97f)]:
  - @kubb/react@3.3.3
  - @kubb/plugin-oas@3.3.3
  - @kubb/plugin-ts@3.3.3
  - @kubb/core@3.3.3
  - @kubb/fs@3.3.3
  - @kubb/oas@3.3.3

## 3.3.2

### Patch Changes

- Updated dependencies [[`fd3831e`](https://github.com/kubb-labs/kubb/commit/fd3831e090c0356280a3c17e9e1878e843705e60)]:
  - @kubb/react@3.3.2
  - @kubb/plugin-oas@3.3.2
  - @kubb/plugin-ts@3.3.2
  - @kubb/core@3.3.2
  - @kubb/fs@3.3.2
  - @kubb/oas@3.3.2

## 3.3.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.3.1
  - @kubb/fs@3.3.1
  - @kubb/oas@3.3.1
  - @kubb/plugin-oas@3.3.1
  - @kubb/plugin-ts@3.3.1
  - @kubb/react@3.3.1

## 3.3.0

### Patch Changes

- Updated dependencies [[`ed08de3`](https://github.com/kubb-labs/kubb/commit/ed08de333ffc4a6de61707b3a0c2c9d647cd16fd)]:
  - @kubb/plugin-ts@3.3.0
  - @kubb/core@3.3.0
  - @kubb/fs@3.3.0
  - @kubb/oas@3.3.0
  - @kubb/plugin-oas@3.3.0
  - @kubb/react@3.3.0

## 3.2.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.2.0
  - @kubb/fs@3.2.0
  - @kubb/oas@3.2.0
  - @kubb/plugin-oas@3.2.0
  - @kubb/plugin-ts@3.2.0
  - @kubb/react@3.2.0

## 3.1.0

### Minor Changes

- [#1441](https://github.com/kubb-labs/kubb/pull/1441) [`55cbb62`](https://github.com/kubb-labs/kubb/commit/55cbb62d9d7a4e08886dfb91b52e275254c2c4b1) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Group API clients by path structure

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.1.0
  - @kubb/fs@3.1.0
  - @kubb/oas@3.1.0
  - @kubb/plugin-oas@3.1.0
  - @kubb/plugin-ts@3.1.0
  - @kubb/react@3.1.0

## 3.0.14

### Patch Changes

- Updated dependencies [[`c94ebdc`](https://github.com/kubb-labs/kubb/commit/c94ebdc08587eea345ae17e545168e4497999f4e)]:
  - @kubb/plugin-oas@3.0.14
  - @kubb/plugin-ts@3.0.14
  - @kubb/core@3.0.14
  - @kubb/fs@3.0.14
  - @kubb/oas@3.0.14
  - @kubb/react@3.0.14

## 3.0.13

### Patch Changes

- Updated dependencies [[`d2a69a3`](https://github.com/kubb-labs/kubb/commit/d2a69a3b11c02d2836081202c07954f8e49aef83)]:
  - @kubb/plugin-oas@3.0.13
  - @kubb/core@3.0.13
  - @kubb/oas@3.0.13
  - @kubb/fs@3.0.13
  - @kubb/plugin-ts@3.0.13
  - @kubb/react@3.0.13

## 3.0.12

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.0.12
  - @kubb/fs@3.0.12
  - @kubb/oas@3.0.12
  - @kubb/plugin-oas@3.0.12
  - @kubb/plugin-ts@3.0.12
  - @kubb/react@3.0.12

## 3.0.11

### Patch Changes

- Updated dependencies [[`b53eb44`](https://github.com/kubb-labs/kubb/commit/b53eb443db252b797089bb3ebcd92d7da12fc9e2), [`b53eb44`](https://github.com/kubb-labs/kubb/commit/b53eb443db252b797089bb3ebcd92d7da12fc9e2), [`b53eb44`](https://github.com/kubb-labs/kubb/commit/b53eb443db252b797089bb3ebcd92d7da12fc9e2)]:
  - @kubb/core@3.0.11
  - @kubb/plugin-oas@3.0.11
  - @kubb/plugin-ts@3.0.11
  - @kubb/react@3.0.11
  - @kubb/fs@3.0.11
  - @kubb/oas@3.0.11

## 3.0.10

### Patch Changes

- [`ad977aa`](https://github.com/kubb-labs/kubb/commit/ad977aaec348c877405e780b6ea89bbbfbd282b7) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - `data` should have a higher priority than faker defaults generation

- Updated dependencies []:
  - @kubb/core@3.0.10
  - @kubb/fs@3.0.10
  - @kubb/oas@3.0.10
  - @kubb/plugin-oas@3.0.10
  - @kubb/plugin-ts@3.0.10
  - @kubb/react@3.0.10

## 3.0.9

### Patch Changes

- Updated dependencies [[`260801e`](https://github.com/kubb-labs/kubb/commit/260801eb69155e25c28e7166e8f820d16e93ca96), [`260801e`](https://github.com/kubb-labs/kubb/commit/260801eb69155e25c28e7166e8f820d16e93ca96)]:
  - @kubb/core@3.0.9
  - @kubb/oas@3.0.9
  - @kubb/plugin-oas@3.0.9
  - @kubb/plugin-ts@3.0.9
  - @kubb/react@3.0.9
  - @kubb/fs@3.0.9

## 3.0.8

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.0.8
  - @kubb/fs@3.0.8
  - @kubb/oas@3.0.8
  - @kubb/plugin-oas@3.0.8
  - @kubb/plugin-ts@3.0.8
  - @kubb/react@3.0.8

## 3.0.7

### Patch Changes

- Updated dependencies [[`ca3b862`](https://github.com/kubb-labs/kubb/commit/ca3b8624acd5a58b2a206362c943f549d7d778b3)]:
  - @kubb/core@3.0.7
  - @kubb/plugin-oas@3.0.7
  - @kubb/plugin-ts@3.0.7
  - @kubb/react@3.0.7
  - @kubb/fs@3.0.7
  - @kubb/oas@3.0.7

## 3.0.6

### Patch Changes

- Updated dependencies [[`fa04933`](https://github.com/kubb-labs/kubb/commit/fa049330f3c41fd148169b6483ca1bdaa223c715), [`b634bc9`](https://github.com/kubb-labs/kubb/commit/b634bc905fc660e270908d6ee09b01b7f3811bf5), [`a12aa73`](https://github.com/kubb-labs/kubb/commit/a12aa737cf9e5fe63f1b5347cde151de2a6e405e), [`a12aa73`](https://github.com/kubb-labs/kubb/commit/a12aa737cf9e5fe63f1b5347cde151de2a6e405e)]:
  - @kubb/react@3.0.6
  - @kubb/oas@3.0.6
  - @kubb/core@3.0.6
  - @kubb/plugin-oas@3.0.6
  - @kubb/plugin-ts@3.0.6
  - @kubb/fs@3.0.6

## 3.0.5

### Patch Changes

- Updated dependencies [[`23b8137`](https://github.com/kubb-labs/kubb/commit/23b8137bd69cbc896046a497dc4cbf7bf23d70ec)]:
  - @kubb/react@3.0.5
  - @kubb/plugin-oas@3.0.5
  - @kubb/plugin-ts@3.0.5
  - @kubb/core@3.0.5
  - @kubb/fs@3.0.5
  - @kubb/oas@3.0.5

## 3.0.4

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.0.4
  - @kubb/fs@3.0.4
  - @kubb/oas@3.0.4
  - @kubb/plugin-oas@3.0.4
  - @kubb/plugin-ts@3.0.4
  - @kubb/react@3.0.4

## 3.0.3

### Patch Changes

- Updated dependencies [[`b3540fe`](https://github.com/kubb-labs/kubb/commit/b3540fe67e682bc367c2f39ca7595decab94a6aa)]:
  - @kubb/plugin-oas@3.0.3
  - @kubb/plugin-ts@3.0.3
  - @kubb/core@3.0.3
  - @kubb/fs@3.0.3
  - @kubb/oas@3.0.3
  - @kubb/react@3.0.3

## 3.0.2

### Patch Changes

- [#1384](https://github.com/kubb-labs/kubb/pull/1384) [`c540082`](https://github.com/kubb-labs/kubb/commit/c540082c56329de322d6b5326f8c14a18c588c8d) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Correct faker functions for uuid, pattern and email

- Updated dependencies []:
  - @kubb/core@3.0.2
  - @kubb/fs@3.0.2
  - @kubb/oas@3.0.2
  - @kubb/plugin-oas@3.0.2
  - @kubb/plugin-ts@3.0.2
  - @kubb/react@3.0.2

## 3.0.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.0.1
  - @kubb/fs@3.0.1
  - @kubb/oas@3.0.1
  - @kubb/plugin-oas@3.0.1
  - @kubb/plugin-ts@3.0.1
  - @kubb/react@3.0.1

## 3.0.0

### Major Changes

- [#1118](https://github.com/kubb-labs/kubb/pull/1118) [`2fbc18a`](https://github.com/kubb-labs/kubb/commit/2fbc18a74d4e78effb9ce9844ad3ffe7ce7afbdf) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Minimal support of node 20

- [#1274](https://github.com/kubb-labs/kubb/pull/1274) [`39072a9`](https://github.com/kubb-labs/kubb/commit/39072a98195adb22b83d5e9857afbc329f20ecac) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Removal of `extName` in every plugin in favour of one `output.extension`

- [#1276](https://github.com/kubb-labs/kubb/pull/1276) [`ebbfac2`](https://github.com/kubb-labs/kubb/commit/ebbfac2dfa9f5245a928070c5fee3fdca7f76059) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Removal of `group.output` in favour of `group.name`(no need to specify the output/root)

- [#1118](https://github.com/kubb-labs/kubb/pull/1118) [`2fbc18a`](https://github.com/kubb-labs/kubb/commit/2fbc18a74d4e78effb9ce9844ad3ffe7ce7afbdf) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - removal of swagger prefix packages in favour of @kubb/plugin-x

### Minor Changes

- [`8e7a819`](https://github.com/kubb-labs/kubb/commit/8e7a819e72abc1a2abb570947a73c8f72c89a069) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - banner and footer for every file

- [`959da15`](https://github.com/kubb-labs/kubb/commit/959da15e8bd20779fbbd791c566ca81b19173bac) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Use of `faker.image.url()` instead of `faker.image.imageUrl()`

- [#1259](https://github.com/kubb-labs/kubb/pull/1259) [`2c860f2`](https://github.com/kubb-labs/kubb/commit/2c860f2b8c49cda8ad08540cd3cbfbdd7c12632a) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - 'generators' option for all plugins

- [#1162](https://github.com/kubb-labs/kubb/pull/1162) [`79c2153`](https://github.com/kubb-labs/kubb/commit/79c2153b93187c2dad7d54bc00d6ad869213bb7b) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - output option for all plugins(KubbPlugin) to track the barrel exportType or the output root of every plugin

### Patch Changes

- [#1127](https://github.com/kubb-labs/kubb/pull/1127) [`9ef278a`](https://github.com/kubb-labs/kubb/commit/9ef278acc3550b96d9477ef3770e5e68fead2cba) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - remove declare module(not being used)

- [#1129](https://github.com/kubb-labs/kubb/pull/1129) [`0860556`](https://github.com/kubb-labs/kubb/commit/08605565794fb1181677a33ea8610b2237f4ee94) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - remove load, transform and writeFile in the plugin context

- [`5b7852b`](https://github.com/kubb-labs/kubb/commit/5b7852b461886f3ae6e7ee75c195013be8d7859c) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Reduce package size

- [#1162](https://github.com/kubb-labs/kubb/pull/1162) [`79c2153`](https://github.com/kubb-labs/kubb/commit/79c2153b93187c2dad7d54bc00d6ad869213bb7b) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Rewrite of generation for exportType 'barrelNamed'

- [#1339](https://github.com/kubb-labs/kubb/pull/1339) [`5ca19f7`](https://github.com/kubb-labs/kubb/commit/5ca19f7223f7ce0d10800de53a785f13662360d5) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Min/Max for type array to generate better `faker.helpers.arrayElements` functionality

- Updated dependencies [[`c8cb50d`](https://github.com/kubb-labs/kubb/commit/c8cb50d1e4a13669a05ca11a18352b86a558bce1), [`8ad561d`](https://github.com/kubb-labs/kubb/commit/8ad561d3ff79b0e3dac21bc970106049a2338fba), [`9ef278a`](https://github.com/kubb-labs/kubb/commit/9ef278acc3550b96d9477ef3770e5e68fead2cba), [`833da08`](https://github.com/kubb-labs/kubb/commit/833da0820d3b91051d829e53ea2b981a74d37e84), [`7bb4a34`](https://github.com/kubb-labs/kubb/commit/7bb4a340927077d5f587f938d09b1381787a4310), [`8413897`](https://github.com/kubb-labs/kubb/commit/8413897bdc8511090cfdebd7783ad4823a6abf30), [`2fbc18a`](https://github.com/kubb-labs/kubb/commit/2fbc18a74d4e78effb9ce9844ad3ffe7ce7afbdf), [`39072a9`](https://github.com/kubb-labs/kubb/commit/39072a98195adb22b83d5e9857afbc329f20ecac), [`b5bccfa`](https://github.com/kubb-labs/kubb/commit/b5bccfaa79064f74925692966b12ae7906f2eed7), [`a8d645c`](https://github.com/kubb-labs/kubb/commit/a8d645c6a2e1b823f28679d5d27c8166c44cc7e2), [`0fc2205`](https://github.com/kubb-labs/kubb/commit/0fc22058bf79cf8ad543428fbd938cccd604d15c), [`8e7a819`](https://github.com/kubb-labs/kubb/commit/8e7a819e72abc1a2abb570947a73c8f72c89a069), [`20930e9`](https://github.com/kubb-labs/kubb/commit/20930e9b944cb30e134fdf22ddefefab9a1190c0), [`0860556`](https://github.com/kubb-labs/kubb/commit/08605565794fb1181677a33ea8610b2237f4ee94), [`20930e9`](https://github.com/kubb-labs/kubb/commit/20930e9b944cb30e134fdf22ddefefab9a1190c0), [`20930e9`](https://github.com/kubb-labs/kubb/commit/20930e9b944cb30e134fdf22ddefefab9a1190c0), [`20930e9`](https://github.com/kubb-labs/kubb/commit/20930e9b944cb30e134fdf22ddefefab9a1190c0), [`3a9859a`](https://github.com/kubb-labs/kubb/commit/3a9859a5f383f6832a9f056136665f1f7ca6fb72), [`3afc193`](https://github.com/kubb-labs/kubb/commit/3afc1935af6c5ad5233c22ad7c9a135693f0a850), [`2c860f2`](https://github.com/kubb-labs/kubb/commit/2c860f2b8c49cda8ad08540cd3cbfbdd7c12632a), [`5b7852b`](https://github.com/kubb-labs/kubb/commit/5b7852b461886f3ae6e7ee75c195013be8d7859c), [`79c2153`](https://github.com/kubb-labs/kubb/commit/79c2153b93187c2dad7d54bc00d6ad869213bb7b), [`79c2153`](https://github.com/kubb-labs/kubb/commit/79c2153b93187c2dad7d54bc00d6ad869213bb7b), [`a5b8d9e`](https://github.com/kubb-labs/kubb/commit/a5b8d9e396e2b4a61126696309c0d6dbf6d3b990), [`e8e5e03`](https://github.com/kubb-labs/kubb/commit/e8e5e039b413680f4420eb74b2f00c4ef7ed306f), [`622073d`](https://github.com/kubb-labs/kubb/commit/622073d5223180f0945ef0919dc3df841359019f), [`ede86d6`](https://github.com/kubb-labs/kubb/commit/ede86d69e5083252d80f1b1e2f1c18c55e245937), [`81b3a78`](https://github.com/kubb-labs/kubb/commit/81b3a78474b3e53446d98db88571a31a452384e0), [`ebbfac2`](https://github.com/kubb-labs/kubb/commit/ebbfac2dfa9f5245a928070c5fee3fdca7f76059), [`962e2d6`](https://github.com/kubb-labs/kubb/commit/962e2d6d49dff55563be13b1ded832d10743ec29), [`4d5f8d3`](https://github.com/kubb-labs/kubb/commit/4d5f8d3dae94e2cbe82fbbb6578532bdf41bee0d), [`4ae54c7`](https://github.com/kubb-labs/kubb/commit/4ae54c7b0a2ab52701b1215f341595a9d1e7903d), [`ebfcb48`](https://github.com/kubb-labs/kubb/commit/ebfcb48dd59e0dc5ec28582b94035d8e25c9ea8d), [`2fbc18a`](https://github.com/kubb-labs/kubb/commit/2fbc18a74d4e78effb9ce9844ad3ffe7ce7afbdf)]:
  - @kubb/plugin-oas@3.0.0
  - @kubb/plugin-ts@3.0.0
  - @kubb/oas@3.0.0
  - @kubb/core@3.0.0
  - @kubb/react@3.0.0
  - @kubb/fs@3.0.0

## 3.0.0-beta.12

### Patch Changes

- Updated dependencies [[`a8d645c`](https://github.com/kubb-labs/kubb/commit/a8d645c6a2e1b823f28679d5d27c8166c44cc7e2)]:
  - @kubb/core@3.0.0-beta.12
  - @kubb/plugin-oas@3.0.0-beta.12
  - @kubb/plugin-ts@3.0.0-beta.12
  - @kubb/react@3.0.0-beta.12
  - @kubb/fs@3.0.0-beta.12
  - @kubb/oas@3.0.0-beta.12

## 3.0.0-beta.11

### Patch Changes

- Updated dependencies [[`622073d`](https://github.com/kubb-labs/kubb/commit/622073d5223180f0945ef0919dc3df841359019f), [`4d5f8d3`](https://github.com/kubb-labs/kubb/commit/4d5f8d3dae94e2cbe82fbbb6578532bdf41bee0d)]:
  - @kubb/plugin-oas@3.0.0-beta.11
  - @kubb/plugin-ts@3.0.0-beta.11
  - @kubb/core@3.0.0-beta.11
  - @kubb/fs@3.0.0-beta.11
  - @kubb/oas@3.0.0-beta.11
  - @kubb/react@3.0.0-beta.11

## 3.0.0-beta.10

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.0.0-beta.10
  - @kubb/fs@3.0.0-beta.10
  - @kubb/oas@3.0.0-beta.10
  - @kubb/plugin-oas@3.0.0-beta.10
  - @kubb/plugin-ts@3.0.0-beta.10
  - @kubb/react@3.0.0-beta.10

## 3.0.0-beta.9

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.0.0-beta.9
  - @kubb/fs@3.0.0-beta.9
  - @kubb/oas@3.0.0-beta.9
  - @kubb/plugin-oas@3.0.0-beta.9
  - @kubb/plugin-ts@3.0.0-beta.9
  - @kubb/react@3.0.0-beta.9

## 3.0.0-beta.8

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.0.0-beta.8
  - @kubb/fs@3.0.0-beta.8
  - @kubb/oas@3.0.0-beta.8
  - @kubb/plugin-oas@3.0.0-beta.8
  - @kubb/plugin-ts@3.0.0-beta.8
  - @kubb/react@3.0.0-beta.8

## 3.0.0-beta.7

### Patch Changes

- Updated dependencies [[`e8e5e03`](https://github.com/kubb-labs/kubb/commit/e8e5e039b413680f4420eb74b2f00c4ef7ed306f)]:
  - @kubb/plugin-oas@3.0.0-beta.7
  - @kubb/plugin-ts@3.0.0-beta.7
  - @kubb/core@3.0.0-beta.7
  - @kubb/fs@3.0.0-beta.7
  - @kubb/oas@3.0.0-beta.7
  - @kubb/react@3.0.0-beta.7

## 3.0.0-beta.6

### Patch Changes

- [#1339](https://github.com/kubb-labs/kubb/pull/1339) [`5ca19f7`](https://github.com/kubb-labs/kubb/commit/5ca19f7223f7ce0d10800de53a785f13662360d5) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Min/Max for type array to generate better `faker.helpers.arrayElements` functionality

- Updated dependencies []:
  - @kubb/core@3.0.0-beta.6
  - @kubb/fs@3.0.0-beta.6
  - @kubb/oas@3.0.0-beta.6
  - @kubb/plugin-oas@3.0.0-beta.6
  - @kubb/plugin-ts@3.0.0-beta.6
  - @kubb/react@3.0.0-beta.6

## 3.0.0-beta.5

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.0.0-beta.5
  - @kubb/fs@3.0.0-beta.5
  - @kubb/oas@3.0.0-beta.5
  - @kubb/plugin-oas@3.0.0-beta.5
  - @kubb/plugin-ts@3.0.0-beta.5
  - @kubb/react@3.0.0-beta.5

## 3.0.0-beta.4

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.0.0-beta.4
  - @kubb/fs@3.0.0-beta.4
  - @kubb/oas@3.0.0-beta.4
  - @kubb/plugin-oas@3.0.0-beta.4
  - @kubb/plugin-ts@3.0.0-beta.4
  - @kubb/react@3.0.0-beta.4

## 3.0.0-beta.3

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.0.0-beta.3
  - @kubb/fs@3.0.0-beta.3
  - @kubb/oas@3.0.0-beta.3
  - @kubb/plugin-oas@3.0.0-beta.3
  - @kubb/plugin-ts@3.0.0-beta.3
  - @kubb/react@3.0.0-beta.3

## 3.0.0-beta.2

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.0.0-beta.2
  - @kubb/plugin-ts@3.0.0-beta.2
  - @kubb/react@3.0.0-beta.2
  - @kubb/plugin-oas@3.0.0-beta.2
  - @kubb/fs@3.0.0-beta.2
  - @kubb/oas@3.0.0-beta.2

## 3.0.0-beta.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.0.0-beta.1
  - @kubb/fs@3.0.0-beta.1
  - @kubb/oas@3.0.0-beta.1
  - @kubb/plugin-oas@3.0.0-beta.1
  - @kubb/plugin-ts@3.0.0-beta.1
  - @kubb/react@3.0.0-beta.1

## 3.0.0-alpha.31

### Major Changes

- [#1276](https://github.com/kubb-labs/kubb/pull/1276) [`ebbfac2`](https://github.com/kubb-labs/kubb/commit/ebbfac2dfa9f5245a928070c5fee3fdca7f76059) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Removal of `group.output` in favour of `group.name`(no need to specify the output/root)

### Patch Changes

- Updated dependencies [[`ebbfac2`](https://github.com/kubb-labs/kubb/commit/ebbfac2dfa9f5245a928070c5fee3fdca7f76059)]:
  - @kubb/plugin-oas@3.0.0-alpha.31
  - @kubb/plugin-ts@3.0.0-alpha.31
  - @kubb/react@3.0.0-alpha.31
  - @kubb/core@3.0.0-alpha.31
  - @kubb/fs@3.0.0-alpha.31
  - @kubb/oas@3.0.0-alpha.31

## 3.0.0-alpha.30

### Major Changes

- [#1274](https://github.com/kubb-labs/kubb/pull/1274) [`39072a9`](https://github.com/kubb-labs/kubb/commit/39072a98195adb22b83d5e9857afbc329f20ecac) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Removal of `extName` in every plugin in favour of one `output.extension`

### Patch Changes

- Updated dependencies [[`39072a9`](https://github.com/kubb-labs/kubb/commit/39072a98195adb22b83d5e9857afbc329f20ecac)]:
  - @kubb/plugin-oas@3.0.0-alpha.30
  - @kubb/plugin-ts@3.0.0-alpha.30
  - @kubb/react@3.0.0-alpha.30
  - @kubb/core@3.0.0-alpha.30
  - @kubb/fs@3.0.0-alpha.30
  - @kubb/oas@3.0.0-alpha.30

## 3.0.0-alpha.29

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.0.0-alpha.29
  - @kubb/fs@3.0.0-alpha.29
  - @kubb/oas@3.0.0-alpha.29
  - @kubb/plugin-oas@3.0.0-alpha.29
  - @kubb/plugin-ts@3.0.0-alpha.29
  - @kubb/react@3.0.0-alpha.29

## 3.0.0-alpha.28

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.0.0-alpha.28
  - @kubb/fs@3.0.0-alpha.28
  - @kubb/oas@3.0.0-alpha.28
  - @kubb/plugin-oas@3.0.0-alpha.28
  - @kubb/plugin-ts@3.0.0-alpha.28
  - @kubb/react@3.0.0-alpha.28

## 3.0.0-alpha.27

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.0.0-alpha.27
  - @kubb/fs@3.0.0-alpha.27
  - @kubb/oas@3.0.0-alpha.27
  - @kubb/plugin-oas@3.0.0-alpha.27
  - @kubb/plugin-ts@3.0.0-alpha.27
  - @kubb/react@3.0.0-alpha.27

## 3.0.0-alpha.26

### Minor Changes

- [#1259](https://github.com/kubb-labs/kubb/pull/1259) [`2c860f2`](https://github.com/kubb-labs/kubb/commit/2c860f2b8c49cda8ad08540cd3cbfbdd7c12632a) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - 'generators' option for all plugins

### Patch Changes

- Updated dependencies [[`2c860f2`](https://github.com/kubb-labs/kubb/commit/2c860f2b8c49cda8ad08540cd3cbfbdd7c12632a)]:
  - @kubb/plugin-ts@3.0.0-alpha.26
  - @kubb/core@3.0.0-alpha.26
  - @kubb/fs@3.0.0-alpha.26
  - @kubb/oas@3.0.0-alpha.26
  - @kubb/plugin-oas@3.0.0-alpha.26
  - @kubb/react@3.0.0-alpha.26

## 3.0.0-alpha.25

### Patch Changes

- Updated dependencies [[`c8cb50d`](https://github.com/kubb-labs/kubb/commit/c8cb50d1e4a13669a05ca11a18352b86a558bce1)]:
  - @kubb/plugin-oas@3.0.0-alpha.25
  - @kubb/plugin-ts@3.0.0-alpha.25
  - @kubb/oas@3.0.0-alpha.25
  - @kubb/core@3.0.0-alpha.25
  - @kubb/fs@3.0.0-alpha.25
  - @kubb/react@3.0.0-alpha.25

## 3.0.0-alpha.24

### Patch Changes

- Updated dependencies [[`a5b8d9e`](https://github.com/kubb-labs/kubb/commit/a5b8d9e396e2b4a61126696309c0d6dbf6d3b990)]:
  - @kubb/plugin-oas@3.0.0-alpha.24
  - @kubb/plugin-ts@3.0.0-alpha.24
  - @kubb/core@3.0.0-alpha.24
  - @kubb/fs@3.0.0-alpha.24
  - @kubb/oas@3.0.0-alpha.24
  - @kubb/react@3.0.0-alpha.24

## 3.0.0-alpha.23

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.0.0-alpha.23
  - @kubb/fs@3.0.0-alpha.23
  - @kubb/oas@3.0.0-alpha.23
  - @kubb/plugin-oas@3.0.0-alpha.23
  - @kubb/plugin-ts@3.0.0-alpha.23
  - @kubb/react@3.0.0-alpha.23

## 3.0.0-alpha.22

### Patch Changes

- Updated dependencies [[`8413897`](https://github.com/kubb-labs/kubb/commit/8413897bdc8511090cfdebd7783ad4823a6abf30), [`b5bccfa`](https://github.com/kubb-labs/kubb/commit/b5bccfaa79064f74925692966b12ae7906f2eed7), [`ebfcb48`](https://github.com/kubb-labs/kubb/commit/ebfcb48dd59e0dc5ec28582b94035d8e25c9ea8d)]:
  - @kubb/plugin-oas@3.0.0-alpha.22
  - @kubb/plugin-ts@3.0.0-alpha.22
  - @kubb/core@3.0.0-alpha.22
  - @kubb/fs@3.0.0-alpha.22
  - @kubb/oas@3.0.0-alpha.22
  - @kubb/react@3.0.0-alpha.22

## 3.0.0-alpha.21

### Minor Changes

- [`959da15`](https://github.com/kubb-labs/kubb/commit/959da15e8bd20779fbbd791c566ca81b19173bac) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Use of `faker.image.url()` instead of `faker.image.imageUrl()`

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.0.0-alpha.21
  - @kubb/fs@3.0.0-alpha.21
  - @kubb/oas@3.0.0-alpha.21
  - @kubb/plugin-oas@3.0.0-alpha.21
  - @kubb/plugin-ts@3.0.0-alpha.21
  - @kubb/react@3.0.0-alpha.21

## 3.0.0-alpha.20

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.0.0-alpha.20
  - @kubb/fs@3.0.0-alpha.20
  - @kubb/oas@3.0.0-alpha.20
  - @kubb/plugin-oas@3.0.0-alpha.20
  - @kubb/plugin-ts@3.0.0-alpha.20
  - @kubb/react@3.0.0-alpha.20

## 3.0.0-alpha.19

### Minor Changes

- [`8e7a819`](https://github.com/kubb-labs/kubb/commit/8e7a819e72abc1a2abb570947a73c8f72c89a069) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - banner and footer for every file

### Patch Changes

- Updated dependencies [[`8e7a819`](https://github.com/kubb-labs/kubb/commit/8e7a819e72abc1a2abb570947a73c8f72c89a069)]:
  - @kubb/plugin-oas@3.0.0-alpha.19
  - @kubb/plugin-ts@3.0.0-alpha.19
  - @kubb/react@3.0.0-alpha.19
  - @kubb/core@3.0.0-alpha.19
  - @kubb/oas@3.0.0-alpha.19
  - @kubb/fs@3.0.0-alpha.19

## 3.0.0-alpha.18

### Patch Changes

- [`5b7852b`](https://github.com/kubb-labs/kubb/commit/5b7852b461886f3ae6e7ee75c195013be8d7859c) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Reduce package size

- Updated dependencies [[`5b7852b`](https://github.com/kubb-labs/kubb/commit/5b7852b461886f3ae6e7ee75c195013be8d7859c)]:
  - @kubb/core@3.0.0-alpha.18
  - @kubb/fs@3.0.0-alpha.18
  - @kubb/oas@3.0.0-alpha.18
  - @kubb/plugin-oas@3.0.0-alpha.18
  - @kubb/plugin-ts@3.0.0-alpha.18
  - @kubb/react@3.0.0-alpha.18

## 3.0.0-alpha.17

### Patch Changes

- Updated dependencies [[`4ae54c7`](https://github.com/kubb-labs/kubb/commit/4ae54c7b0a2ab52701b1215f341595a9d1e7903d)]:
  - @kubb/plugin-oas@3.0.0-alpha.17
  - @kubb/plugin-ts@3.0.0-alpha.17
  - @kubb/core@3.0.0-alpha.17
  - @kubb/fs@3.0.0-alpha.17
  - @kubb/oas@3.0.0-alpha.17
  - @kubb/parser-ts@3.0.0-alpha.17
  - @kubb/react@3.0.0-alpha.17

## 3.0.0-alpha.16

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.0.0-alpha.16
  - @kubb/fs@3.0.0-alpha.16
  - @kubb/oas@3.0.0-alpha.16
  - @kubb/parser-ts@3.0.0-alpha.16
  - @kubb/plugin-oas@3.0.0-alpha.16
  - @kubb/plugin-ts@3.0.0-alpha.16
  - @kubb/react@3.0.0-alpha.16

## 3.0.0-alpha.15

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.0.0-alpha.15
  - @kubb/fs@3.0.0-alpha.15
  - @kubb/oas@3.0.0-alpha.15
  - @kubb/parser-ts@3.0.0-alpha.15
  - @kubb/plugin-oas@3.0.0-alpha.15
  - @kubb/plugin-ts@3.0.0-alpha.15
  - @kubb/react@3.0.0-alpha.15

## 3.0.0-alpha.14

### Patch Changes

- Updated dependencies [[`ede86d6`](https://github.com/kubb-labs/kubb/commit/ede86d69e5083252d80f1b1e2f1c18c55e245937)]:
  - @kubb/plugin-oas@3.0.0-alpha.14
  - @kubb/plugin-ts@3.0.0-alpha.14
  - @kubb/core@3.0.0-alpha.14
  - @kubb/fs@3.0.0-alpha.14
  - @kubb/oas@3.0.0-alpha.14
  - @kubb/parser-ts@3.0.0-alpha.14
  - @kubb/react@3.0.0-alpha.14

## 3.0.0-alpha.13

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.0.0-alpha.13
  - @kubb/fs@3.0.0-alpha.13
  - @kubb/oas@3.0.0-alpha.13
  - @kubb/parser-ts@3.0.0-alpha.13
  - @kubb/plugin-oas@3.0.0-alpha.13
  - @kubb/plugin-ts@3.0.0-alpha.13
  - @kubb/react@3.0.0-alpha.13

## 3.0.0-alpha.12

### Patch Changes

- Updated dependencies [[`833da08`](https://github.com/kubb-labs/kubb/commit/833da0820d3b91051d829e53ea2b981a74d37e84)]:
  - @kubb/react@3.0.0-alpha.12
  - @kubb/core@3.0.0-alpha.12
  - @kubb/plugin-oas@3.0.0-alpha.12
  - @kubb/plugin-ts@3.0.0-alpha.12
  - @kubb/fs@3.0.0-alpha.12
  - @kubb/oas@3.0.0-alpha.12
  - @kubb/parser-ts@3.0.0-alpha.12

## 3.0.0-alpha.11

### Patch Changes

- Updated dependencies [[`81b3a78`](https://github.com/kubb-labs/kubb/commit/81b3a78474b3e53446d98db88571a31a452384e0)]:
  - @kubb/react@3.0.0-alpha.11
  - @kubb/plugin-oas@3.0.0-alpha.11
  - @kubb/plugin-ts@3.0.0-alpha.11
  - @kubb/core@3.0.0-alpha.11
  - @kubb/fs@3.0.0-alpha.11
  - @kubb/oas@3.0.0-alpha.11
  - @kubb/parser-ts@3.0.0-alpha.11

## 3.0.0-alpha.10

### Patch Changes

- Updated dependencies [[`3afc193`](https://github.com/kubb-labs/kubb/commit/3afc1935af6c5ad5233c22ad7c9a135693f0a850)]:
  - @kubb/core@3.0.0-alpha.10
  - @kubb/plugin-oas@3.0.0-alpha.10
  - @kubb/plugin-ts@3.0.0-alpha.10
  - @kubb/react@3.0.0-alpha.10
  - @kubb/fs@3.0.0-alpha.10
  - @kubb/oas@3.0.0-alpha.10
  - @kubb/parser-ts@3.0.0-alpha.10

## 3.0.0-alpha.9

### Patch Changes

- Updated dependencies [[`7bb4a34`](https://github.com/kubb-labs/kubb/commit/7bb4a340927077d5f587f938d09b1381787a4310)]:
  - @kubb/plugin-oas@3.0.0-alpha.9
  - @kubb/plugin-ts@3.0.0-alpha.9
  - @kubb/core@3.0.0-alpha.9
  - @kubb/fs@3.0.0-alpha.9
  - @kubb/oas@3.0.0-alpha.9
  - @kubb/parser-ts@3.0.0-alpha.9
  - @kubb/react@3.0.0-alpha.9

## 3.0.0-alpha.8

### Patch Changes

- Updated dependencies [[`962e2d6`](https://github.com/kubb-labs/kubb/commit/962e2d6d49dff55563be13b1ded832d10743ec29)]:
  - @kubb/react@3.0.0-alpha.8
  - @kubb/core@3.0.0-alpha.8
  - @kubb/fs@3.0.0-alpha.8
  - @kubb/plugin-oas@3.0.0-alpha.8
  - @kubb/plugin-ts@3.0.0-alpha.8
  - @kubb/oas@3.0.0-alpha.8
  - @kubb/parser-ts@3.0.0-alpha.8

## 3.0.0-alpha.7

### Minor Changes

- [#1162](https://github.com/kubb-labs/kubb/pull/1162) [`79c2153`](https://github.com/kubb-labs/kubb/commit/79c2153b93187c2dad7d54bc00d6ad869213bb7b) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - output option for all plugins(KubbPlugin) to track the barrel exportType or the output root of every plugin

### Patch Changes

- [#1162](https://github.com/kubb-labs/kubb/pull/1162) [`79c2153`](https://github.com/kubb-labs/kubb/commit/79c2153b93187c2dad7d54bc00d6ad869213bb7b) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Rewrite of generation for exportType 'barrelNamed'

- Updated dependencies [[`79c2153`](https://github.com/kubb-labs/kubb/commit/79c2153b93187c2dad7d54bc00d6ad869213bb7b), [`79c2153`](https://github.com/kubb-labs/kubb/commit/79c2153b93187c2dad7d54bc00d6ad869213bb7b)]:
  - @kubb/plugin-oas@3.0.0-alpha.7
  - @kubb/plugin-ts@3.0.0-alpha.7
  - @kubb/core@3.0.0-alpha.7
  - @kubb/oas@3.0.0-alpha.7
  - @kubb/parser-ts@3.0.0-alpha.7
  - @kubb/react@3.0.0-alpha.7
  - @kubb/fs@3.0.0-alpha.7

## 3.0.0-alpha.6

### Patch Changes

- Updated dependencies [[`20930e9`](https://github.com/kubb-labs/kubb/commit/20930e9b944cb30e134fdf22ddefefab9a1190c0), [`20930e9`](https://github.com/kubb-labs/kubb/commit/20930e9b944cb30e134fdf22ddefefab9a1190c0), [`20930e9`](https://github.com/kubb-labs/kubb/commit/20930e9b944cb30e134fdf22ddefefab9a1190c0), [`20930e9`](https://github.com/kubb-labs/kubb/commit/20930e9b944cb30e134fdf22ddefefab9a1190c0)]:
  - @kubb/react@3.0.0-alpha.6
  - @kubb/core@3.0.0-alpha.6
  - @kubb/plugin-oas@3.0.0-alpha.6
  - @kubb/plugin-ts@3.0.0-alpha.6
  - @kubb/fs@3.0.0-alpha.6
  - @kubb/oas@3.0.0-alpha.6
  - @kubb/parser-ts@3.0.0-alpha.6

## 3.0.0-alpha.5

### Patch Changes

- Updated dependencies [[`3a9859a`](https://github.com/kubb-labs/kubb/commit/3a9859a5f383f6832a9f056136665f1f7ca6fb72)]:
  - @kubb/core@3.0.0-alpha.5
  - @kubb/plugin-oas@3.0.0-alpha.5
  - @kubb/plugin-ts@3.0.0-alpha.5
  - @kubb/react@3.0.0-alpha.5
  - @kubb/fs@3.0.0-alpha.5
  - @kubb/oas@3.0.0-alpha.5
  - @kubb/parser-ts@3.0.0-alpha.5

## 3.0.0-alpha.4

### Patch Changes

- Updated dependencies [[`0fc2205`](https://github.com/kubb-labs/kubb/commit/0fc22058bf79cf8ad543428fbd938cccd604d15c)]:
  - @kubb/core@3.0.0-alpha.4
  - @kubb/plugin-oas@3.0.0-alpha.4
  - @kubb/plugin-ts@3.0.0-alpha.4
  - @kubb/react@3.0.0-alpha.4
  - @kubb/fs@3.0.0-alpha.4
  - @kubb/oas@3.0.0-alpha.4
  - @kubb/parser-ts@3.0.0-alpha.4

## 3.0.0-alpha.3

### Patch Changes

- Updated dependencies [[`8ad561d`](https://github.com/kubb-labs/kubb/commit/8ad561d3ff79b0e3dac21bc970106049a2338fba)]:
  - @kubb/plugin-oas@3.0.0-alpha.3
  - @kubb/plugin-ts@3.0.0-alpha.3
  - @kubb/core@3.0.0-alpha.3
  - @kubb/fs@3.0.0-alpha.3
  - @kubb/oas@3.0.0-alpha.3
  - @kubb/parser-ts@3.0.0-alpha.3
  - @kubb/react@3.0.0-alpha.3

## 3.0.0-alpha.2

### Patch Changes

- [#1129](https://github.com/kubb-labs/kubb/pull/1129) [`0860556`](https://github.com/kubb-labs/kubb/commit/08605565794fb1181677a33ea8610b2237f4ee94) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - remove load, transform and writeFile in the plugin context

- Updated dependencies [[`0860556`](https://github.com/kubb-labs/kubb/commit/08605565794fb1181677a33ea8610b2237f4ee94)]:
  - @kubb/plugin-oas@3.0.0-alpha.2
  - @kubb/plugin-ts@3.0.0-alpha.2
  - @kubb/core@3.0.0-alpha.2
  - @kubb/react@3.0.0-alpha.2
  - @kubb/fs@3.0.0-alpha.2
  - @kubb/oas@3.0.0-alpha.2
  - @kubb/parser-ts@3.0.0-alpha.2

## 3.0.0-alpha.1

### Patch Changes

- [#1127](https://github.com/kubb-labs/kubb/pull/1127) [`9ef278a`](https://github.com/kubb-labs/kubb/commit/9ef278acc3550b96d9477ef3770e5e68fead2cba) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - remove declare module(not being used)

- Updated dependencies [[`9ef278a`](https://github.com/kubb-labs/kubb/commit/9ef278acc3550b96d9477ef3770e5e68fead2cba)]:
  - @kubb/plugin-oas@3.0.0-alpha.1
  - @kubb/plugin-ts@3.0.0-alpha.1
  - @kubb/core@3.0.0-alpha.1
  - @kubb/react@3.0.0-alpha.1
  - @kubb/fs@3.0.0-alpha.1
  - @kubb/oas@3.0.0-alpha.1
  - @kubb/parser-ts@3.0.0-alpha.1

## 3.0.0-alpha.0

### Major Changes

- [`73d008c`](https://github.com/kubb-labs/kubb/commit/73d008c72521cc7f7f367b1951758da3919d5c67) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Minimal support of node 20

- [`c105cf1`](https://github.com/kubb-labs/kubb/commit/c105cf1a9ecc572d053daa794ceaba69e227dda4) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - removal of swagger prefix packages in favour of @kubb/plugin-x

### Patch Changes

- Updated dependencies [[`73d008c`](https://github.com/kubb-labs/kubb/commit/73d008c72521cc7f7f367b1951758da3919d5c67), [`c105cf1`](https://github.com/kubb-labs/kubb/commit/c105cf1a9ecc572d053daa794ceaba69e227dda4)]:
  - @kubb/core@3.0.0-alpha.0
  - @kubb/fs@3.0.0-alpha.0
  - @kubb/oas@3.0.0-alpha.0
  - @kubb/parser-ts@3.0.0-alpha.0
  - @kubb/plugin-oas@3.0.0-alpha.0
  - @kubb/plugin-ts@3.0.0-alpha.0
  - @kubb/react@3.0.0-alpha.0

## 2.25.1

### Patch Changes

- [#1110](https://github.com/kubb-labs/kubb/pull/1110) [`3f27fab`](https://github.com/kubb-labs/kubb/commit/3f27fab6ce329d86fd432fc8933890efe07f8319) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - always add extName to import when defined

- Updated dependencies [[`3f27fab`](https://github.com/kubb-labs/kubb/commit/3f27fab6ce329d86fd432fc8933890efe07f8319)]:
  - @kubb/plugin-oas@2.25.1
  - @kubb/swagger-ts@2.25.1
  - @kubb/parser-ts@2.25.1
  - @kubb/react@2.25.1
  - @kubb/core@2.25.1
  - @kubb/oas@2.25.1
  - @kubb/fs@2.25.1

## 2.25.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@2.25.0
  - @kubb/fs@2.25.0
  - @kubb/oas@2.25.0
  - @kubb/parser-ts@2.25.0
  - @kubb/plugin-oas@2.25.0
  - @kubb/react@2.25.0
  - @kubb/swagger-ts@2.25.0

## 2.24.0

### Patch Changes

- Updated dependencies [[`cb0b748`](https://github.com/kubb-labs/kubb/commit/cb0b7485646a9448cbdc55b77e2c02c5b7a4900c)]:
  - @kubb/plugin-oas@2.24.0
  - @kubb/oas@2.24.0
  - @kubb/swagger-ts@2.24.0
  - @kubb/core@2.24.0
  - @kubb/fs@2.24.0
  - @kubb/parser-ts@2.24.0
  - @kubb/react@2.24.0

## 2.23.4

### Patch Changes

- Updated dependencies [[`4970e0d`](https://github.com/kubb-labs/kubb/commit/4970e0dd0288028b03d18719e4c68b435fd5e74c)]:
  - @kubb/oas@2.23.4
  - @kubb/plugin-oas@2.23.4
  - @kubb/swagger-ts@2.23.4
  - @kubb/core@2.23.4
  - @kubb/fs@2.23.4
  - @kubb/parser-ts@2.23.4
  - @kubb/react@2.23.4

## 2.23.3

### Patch Changes

- Updated dependencies []:
  - @kubb/core@2.23.3
  - @kubb/fs@2.23.3
  - @kubb/oas@2.23.3
  - @kubb/parser-ts@2.23.3
  - @kubb/plugin-oas@2.23.3
  - @kubb/react@2.23.3
  - @kubb/plugin-ts@2.23.3

## 2.23.2

### Patch Changes

- Updated dependencies [[`da3cb26`](https://github.com/kubb-labs/kubb/commit/da3cb26148fde6205ef7773e78c88c1d92ffbd37)]:
  - @kubb/plugin-ts@2.23.2
  - @kubb/core@2.23.2
  - @kubb/fs@2.23.2
  - @kubb/oas@2.23.2
  - @kubb/parser-ts@2.23.2
  - @kubb/plugin-oas@2.23.2
  - @kubb/react@2.23.2

## 2.23.1

### Patch Changes

- [`b540b72`](https://github.com/kubb-labs/kubb/commit/b540b729aec5e2c74cc506966a15236085ebad76) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - randexp import for operations

- Updated dependencies []:
  - @kubb/core@2.23.1
  - @kubb/fs@2.23.1
  - @kubb/oas@2.23.1
  - @kubb/parser-ts@2.23.1
  - @kubb/plugin-oas@2.23.1
  - @kubb/react@2.23.1
  - @kubb/plugin-ts@2.23.1

## 2.23.0

### Minor Changes

- [#1070](https://github.com/kubb-labs/kubb/pull/1070) [`d636806`](https://github.com/kubb-labs/kubb/commit/d63680600b1219115f12ea2d9932cfb4cac82bbe) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - support for RandExp generator when format is a regex(default: 'faker')

### Patch Changes

- Updated dependencies []:
  - @kubb/core@2.23.0
  - @kubb/fs@2.23.0
  - @kubb/oas@2.23.0
  - @kubb/parser-ts@2.23.0
  - @kubb/plugin-oas@2.23.0
  - @kubb/react@2.23.0
  - @kubb/plugin-ts@2.23.0

## 2.22.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@2.22.1
  - @kubb/fs@2.22.1
  - @kubb/oas@2.22.1
  - @kubb/parser-ts@2.22.1
  - @kubb/plugin-oas@2.22.1
  - @kubb/react@2.22.1
  - @kubb/plugin-ts@2.22.1

## 2.22.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@2.22.0
  - @kubb/fs@2.22.0
  - @kubb/oas@2.22.0
  - @kubb/parser-ts@2.22.0
  - @kubb/plugin-oas@2.22.0
  - @kubb/react@2.22.0
  - @kubb/plugin-ts@2.22.0

## 2.21.2

### Patch Changes

- Updated dependencies []:
  - @kubb/core@2.21.2
  - @kubb/fs@2.21.2
  - @kubb/oas@2.21.2
  - @kubb/parser-ts@2.21.2
  - @kubb/plugin-oas@2.21.2
  - @kubb/react@2.21.2
  - @kubb/plugin-ts@2.21.2

## 2.21.1

### Patch Changes

- Updated dependencies [[`72a6a18`](https://github.com/kubb-labs/kubb/commit/72a6a18d20c984c8b54b6f685c8f13395253a05e)]:
  - @kubb/plugin-ts@2.21.1
  - @kubb/core@2.21.1
  - @kubb/fs@2.21.1
  - @kubb/oas@2.21.1
  - @kubb/parser-ts@2.21.1
  - @kubb/plugin-oas@2.21.1
  - @kubb/react@2.21.1

## 2.21.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@2.21.0
  - @kubb/fs@2.21.0
  - @kubb/oas@2.21.0
  - @kubb/parser-ts@2.21.0
  - @kubb/plugin-oas@2.21.0
  - @kubb/react@2.21.0
  - @kubb/plugin-ts@2.21.0

## 2.20.0

### Patch Changes

- [#1045](https://github.com/kubb-labs/kubb/pull/1045) [`9d100d6`](https://github.com/kubb-labs/kubb/commit/9d100d6f5157af03d051fc389eec182a92651902) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Issue with Incorrect Imported Names in Generated Hooks(use of pluginKey and type for getSchemas)

- Updated dependencies [[`9d100d6`](https://github.com/kubb-labs/kubb/commit/9d100d6f5157af03d051fc389eec182a92651902)]:
  - @kubb/plugin-oas@2.20.0
  - @kubb/parser-ts@2.20.0
  - @kubb/core@2.20.0
  - @kubb/oas@2.20.0
  - @kubb/fs@2.20.0
  - @kubb/react@2.20.0
  - @kubb/plugin-ts@2.20.0

## 2.19.6

### Patch Changes

- Updated dependencies [[`6e654c9`](https://github.com/kubb-labs/kubb/commit/6e654c92a7acc850f2e4dae609e153c4730ef580), [`c0e2a9c`](https://github.com/kubb-labs/kubb/commit/c0e2a9c5bbc85e657e9a1dee3534b5113d67b4aa)]:
  - @kubb/plugin-oas@2.19.6
  - @kubb/core@2.19.6
  - @kubb/plugin-ts@2.19.6
  - @kubb/react@2.19.6
  - @kubb/fs@2.19.6
  - @kubb/oas@2.19.6
  - @kubb/parser-ts@2.19.6

## 2.19.5

### Patch Changes

- Updated dependencies [[`1480324`](https://github.com/kubb-labs/kubb/commit/1480324785cd8dbaf0de2d1161ae2c4a3a82bb8e)]:
  - @kubb/plugin-oas@2.19.5
  - @kubb/parser-ts@2.19.5
  - @kubb/core@2.19.5
  - @kubb/oas@2.19.5
  - @kubb/plugin-ts@2.19.5
  - @kubb/react@2.19.5
  - @kubb/fs@2.19.5

## 2.19.4

### Patch Changes

- Updated dependencies [[`d91fd08`](https://github.com/kubb-labs/kubb/commit/d91fd08bf139cfbf96b687d2ed926a16ce1e1e15)]:
  - @kubb/oas@2.19.4
  - @kubb/plugin-oas@2.19.4
  - @kubb/plugin-ts@2.19.4
  - @kubb/core@2.19.4
  - @kubb/fs@2.19.4
  - @kubb/parser-ts@2.19.4
  - @kubb/react@2.19.4

## 2.19.3

### Patch Changes

- [`35b7a0a`](https://github.com/kubb-labs/kubb/commit/35b7a0a7822716b9625c0c96a904ec0c7b9ebe4a) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - zod cannot use min/max for z.tuple when using object

- Updated dependencies [[`35b7a0a`](https://github.com/kubb-labs/kubb/commit/35b7a0a7822716b9625c0c96a904ec0c7b9ebe4a)]:
  - @kubb/plugin-oas@2.19.3
  - @kubb/plugin-ts@2.19.3
  - @kubb/core@2.19.3
  - @kubb/fs@2.19.3
  - @kubb/oas@2.19.3
  - @kubb/parser-ts@2.19.3
  - @kubb/react@2.19.3

## 2.19.2

### Patch Changes

- Updated dependencies []:
  - @kubb/core@2.19.2
  - @kubb/fs@2.19.2
  - @kubb/oas@2.19.2
  - @kubb/parser-ts@2.19.2
  - @kubb/plugin-oas@2.19.2
  - @kubb/react@2.19.2
  - @kubb/plugin-ts@2.19.2

## 2.19.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@2.19.1
  - @kubb/fs@2.19.1
  - @kubb/oas@2.19.1
  - @kubb/parser-ts@2.19.1
  - @kubb/plugin-oas@2.19.1
  - @kubb/react@2.19.1
  - @kubb/plugin-ts@2.19.1

## 2.19.0

### Minor Changes

- [#1012](https://github.com/kubb-labs/kubb/pull/1012) [`f34d3dd`](https://github.com/kubb-labs/kubb/commit/f34d3dda835a2e17afd8c35311c2eea08590d77d) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - dateParser to support ISO 8601 with Dayjs/Moment/...

### Patch Changes

- Updated dependencies []:
  - @kubb/core@2.19.0
  - @kubb/fs@2.19.0
  - @kubb/oas@2.19.0
  - @kubb/parser-ts@2.19.0
  - @kubb/plugin-oas@2.19.0
  - @kubb/react@2.19.0
  - @kubb/plugin-ts@2.19.0

## 2.18.9

### Patch Changes

- [`8be5a22`](https://github.com/kubb-labs/kubb/commit/8be5a223c3167e372763d80335336144ebd98b60) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Removal of packageManager

- Updated dependencies [[`8be5a22`](https://github.com/kubb-labs/kubb/commit/8be5a223c3167e372763d80335336144ebd98b60)]:
  - @kubb/plugin-oas@2.18.9
  - @kubb/plugin-ts@2.18.9
  - @kubb/parser-ts@2.18.9
  - @kubb/react@2.18.9
  - @kubb/core@2.18.9
  - @kubb/oas@2.18.9
  - @kubb/fs@2.18.9

## 2.18.8

### Patch Changes

- Updated dependencies [[`200fe5d`](https://github.com/kubb-labs/kubb/commit/200fe5d2b6e9a871250b4193b24634a16fe1decf)]:
  - @kubb/plugin-oas@2.18.8
  - @kubb/plugin-ts@2.18.8
  - @kubb/core@2.18.8
  - @kubb/fs@2.18.8
  - @kubb/oas@2.18.8
  - @kubb/parser-ts@2.18.8
  - @kubb/react@2.18.8

## 2.18.7

### Patch Changes

- Updated dependencies [[`f6a50b7`](https://github.com/kubb-labs/kubb/commit/f6a50b76210f338a1874bd6eafe2e8a392dbcbc2)]:
  - @kubb/plugin-oas@2.18.7
  - @kubb/plugin-ts@2.18.7
  - @kubb/core@2.18.7
  - @kubb/fs@2.18.7
  - @kubb/oas@2.18.7
  - @kubb/parser-ts@2.18.7
  - @kubb/react@2.18.7

## 2.18.6

### Patch Changes

- Updated dependencies [[`4b4c762`](https://github.com/kubb-labs/kubb/commit/4b4c7620ab7be718a386292d965d8335cad6c1ec)]:
  - @kubb/plugin-ts@2.18.6
  - @kubb/core@2.18.6
  - @kubb/fs@2.18.6
  - @kubb/oas@2.18.6
  - @kubb/parser-ts@2.18.6
  - @kubb/plugin-oas@2.18.6
  - @kubb/react@2.18.6

## 2.18.5

### Patch Changes

- Updated dependencies [[`d4581fd`](https://github.com/kubb-labs/kubb/commit/d4581fd006d8ecca026512c7b1f63229bec88b21)]:
  - @kubb/plugin-ts@2.18.5
  - @kubb/core@2.18.5
  - @kubb/fs@2.18.5
  - @kubb/oas@2.18.5
  - @kubb/parser-ts@2.18.5
  - @kubb/plugin-oas@2.18.5
  - @kubb/react@2.18.5

## 2.18.4

### Patch Changes

- Updated dependencies []:
  - @kubb/core@2.18.4
  - @kubb/oas@2.18.4
  - @kubb/parser-ts@2.18.4
  - @kubb/plugin-oas@2.18.4
  - @kubb/react@2.18.4
  - @kubb/plugin-ts@2.18.4

## 2.18.3

### Patch Changes

- Updated dependencies [[`a4cead3`](https://github.com/kubb-labs/kubb/commit/a4cead3979d39543f92b3d3babaeee7d31857d4d)]:
  - @kubb/plugin-oas@2.18.3
  - @kubb/plugin-ts@2.18.3
  - @kubb/core@2.18.3
  - @kubb/oas@2.18.3
  - @kubb/parser-ts@2.18.3
  - @kubb/react@2.18.3

## 2.18.2

### Patch Changes

- Updated dependencies [[`815faaa`](https://github.com/kubb-labs/kubb/commit/815faaa849c1b62a07865aefab8c86763c1d36ac)]:
  - @kubb/oas@2.18.2
  - @kubb/swagger@2.18.2
  - @kubb/plugin-ts@2.18.2
  - @kubb/core@2.18.2
  - @kubb/parser-ts@2.18.2
  - @kubb/react@2.18.2

## 2.18.1

### Patch Changes

- [#986](https://github.com/kubb-labs/kubb/pull/986) [`4b52765`](https://github.com/kubb-labs/kubb/commit/4b5276572bd0b5c59b85ec4eddebc3d7c331c0fa) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Better naming for plugins

- Updated dependencies [[`4b52765`](https://github.com/kubb-labs/kubb/commit/4b5276572bd0b5c59b85ec4eddebc3d7c331c0fa)]:
  - @kubb/plugin-ts@2.18.1
  - @kubb/swagger@2.18.1
  - @kubb/core@2.18.1
  - @kubb/react@2.18.1
  - @kubb/oas@2.18.1
  - @kubb/parser-ts@2.18.1

## 2.18.0

### Patch Changes

- [`852be83`](https://github.com/kubb-labs/kubb/commit/852be83029d1bf4ea858340ee5b474ece20aa8c9) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - dateType: 'string` will use faker.date.anytime().toString() inside the fakerParser

- Updated dependencies [[`bd78381`](https://github.com/kubb-labs/kubb/commit/bd78381ce4bb1bfd83017b7f8b559119de12880a)]:
  - @kubb/swagger@2.18.0
  - @kubb/plugin-ts@2.18.0
  - @kubb/core@2.18.0
  - @kubb/oas@2.18.0
  - @kubb/react@2.18.0
  - @kubb/parser-ts@2.18.0

## 2.17.0

### Patch Changes

- Updated dependencies [[`5349115`](https://github.com/kubb-labs/kubb/commit/5349115aa59abc83c7211804f21c952b62a58415), [`e4d5b66`](https://github.com/kubb-labs/kubb/commit/e4d5b66ecaba34f19ae7426e945692f6ce848d81)]:
  - @kubb/swagger@2.17.0
  - @kubb/react@2.17.0
  - @kubb/plugin-ts@2.17.0
  - @kubb/core@2.17.0
  - @kubb/oas@2.17.0
  - @kubb/parser@2.17.0

## 2.16.3

### Patch Changes

- Updated dependencies [[`605d121`](https://github.com/kubb-labs/kubb/commit/605d121d4d261ed9463989348a3f9668cd3302fc)]:
  - @kubb/oas@2.16.3
  - @kubb/swagger@2.16.3
  - @kubb/plugin-ts@2.16.3
  - @kubb/core@2.16.3
  - @kubb/parser@2.16.3
  - @kubb/react@2.16.3

## 2.16.2

### Patch Changes

- Updated dependencies [[`c8e5753`](https://github.com/kubb-labs/kubb/commit/c8e575310815307bf9282779932d51a59f3ab2a0)]:
  - @kubb/plugin-ts@2.16.2
  - @kubb/core@2.16.2
  - @kubb/oas@2.16.2
  - @kubb/parser@2.16.2
  - @kubb/react@2.16.2
  - @kubb/swagger@2.16.2

## 2.16.1

### Patch Changes

- Updated dependencies [[`319e721`](https://github.com/kubb-labs/kubb/commit/319e7218ccf7eab2cfbd5d9c202066634681f793)]:
  - @kubb/swagger@2.16.1
  - @kubb/oas@2.16.1
  - @kubb/plugin-ts@2.16.1
  - @kubb/core@2.16.1
  - @kubb/parser@2.16.1
  - @kubb/react@2.16.1

## 2.16.0

### Patch Changes

- Updated dependencies [[`d620eb0`](https://github.com/kubb-labs/kubb/commit/d620eb09c92c1381f740f21d8e7afb7621d9193e), [`d620eb0`](https://github.com/kubb-labs/kubb/commit/d620eb09c92c1381f740f21d8e7afb7621d9193e)]:
  - @kubb/swagger@2.16.0
  - @kubb/oas@2.16.0
  - @kubb/plugin-ts@2.16.0
  - @kubb/core@2.16.0
  - @kubb/parser@2.16.0
  - @kubb/react@2.16.0

## 2.15.0

### Patch Changes

- Updated dependencies [[`bb9f51f`](https://github.com/kubb-labs/kubb/commit/bb9f51f03f533c79b63036d787b39f044f7fccd5)]:
  - @kubb/swagger@2.15.0
  - @kubb/oas@2.15.0
  - @kubb/plugin-ts@2.15.0
  - @kubb/core@2.15.0
  - @kubb/parser@2.15.0
  - @kubb/react@2.15.0

## 2.14.0

### Patch Changes

- Updated dependencies [[`f58269f`](https://github.com/kubb-labs/kubb/commit/f58269f776e459c9bae21e8122a8f60fde8702e1)]:
  - @kubb/swagger@2.14.0
  - @kubb/plugin-ts@2.14.0
  - @kubb/core@2.14.0
  - @kubb/parser@2.14.0
  - @kubb/react@2.14.0

## 2.13.3

### Patch Changes

- Updated dependencies [[`eac4bb5`](https://github.com/kubb-labs/kubb/commit/eac4bb525a6857b3a0e4c04d52e3de5d2f568d4f)]:
  - @kubb/swagger@2.13.3
  - @kubb/plugin-ts@2.13.3
  - @kubb/core@2.13.3
  - @kubb/parser@2.13.3
  - @kubb/react@2.13.3

## 2.13.2

### Patch Changes

- Updated dependencies []:
  - @kubb/swagger@2.13.2
  - @kubb/plugin-ts@2.13.2
  - @kubb/core@2.13.2
  - @kubb/parser@2.13.2
  - @kubb/react@2.13.2

## 2.13.1

### Patch Changes

- [#945](https://github.com/kubb-labs/kubb/pull/945) [`cfa8d0e`](https://github.com/kubb-labs/kubb/commit/cfa8d0ea1d2eeb434e9c3f5164774317e193a959) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - correct use of dateTime, date and time

- Updated dependencies []:
  - @kubb/core@2.13.1
  - @kubb/parser@2.13.1
  - @kubb/react@2.13.1
  - @kubb/swagger@2.13.1
  - @kubb/plugin-ts@2.13.1

## 2.13.0

### Minor Changes

- [#935](https://github.com/kubb-labs/kubb/pull/935) [`316d067`](https://github.com/kubb-labs/kubb/commit/316d0678558e8d631f839d859971c7f6a66390dd) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Give format precendence over type property

### Patch Changes

- Updated dependencies [[`316d067`](https://github.com/kubb-labs/kubb/commit/316d0678558e8d631f839d859971c7f6a66390dd)]:
  - @kubb/plugin-ts@2.13.0
  - @kubb/swagger@2.13.0
  - @kubb/core@2.13.0
  - @kubb/parser@2.13.0
  - @kubb/react@2.13.0

## 2.12.6

### Patch Changes

- [`af666ae`](https://github.com/kubb-labs/kubb/commit/af666ae970eaa496efb90e60757057d13bc75086) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - ESLint no-unused-vars for mocks that return base types instead of objects

- Updated dependencies [[`e32b6bd`](https://github.com/kubb-labs/kubb/commit/e32b6bda3d676b099dd28c6ab380cf22abb44895), [`e32b6bd`](https://github.com/kubb-labs/kubb/commit/e32b6bda3d676b099dd28c6ab380cf22abb44895)]:
  - @kubb/plugin-ts@2.12.6
  - @kubb/swagger@2.12.6
  - @kubb/core@2.12.6
  - @kubb/parser@2.12.6
  - @kubb/react@2.12.6

## 2.12.5

### Patch Changes

- Updated dependencies [[`95c37c6`](https://github.com/kubb-labs/kubb/commit/95c37c6793344022bbb8129bc570fb200c700800)]:
  - @kubb/swagger@2.12.5
  - @kubb/plugin-ts@2.12.5
  - @kubb/core@2.12.5
  - @kubb/parser@2.12.5
  - @kubb/react@2.12.5

## 2.12.4

### Patch Changes

- [`e12072c`](https://github.com/kubb-labs/kubb/commit/e12072cec19d35ce3ea35fb3560bc13439d9cf5e) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - ESLint no-unused-vars for mocks of 204 (No content) responses

- Updated dependencies []:
  - @kubb/core@2.12.4
  - @kubb/parser@2.12.4
  - @kubb/react@2.12.4
  - @kubb/swagger@2.12.4
  - @kubb/plugin-ts@2.12.4

## 2.12.3

### Patch Changes

- Updated dependencies [[`5003315`](https://github.com/kubb-labs/kubb/commit/500331545421acb2a8b4ba1b9fc2f21b8cba83ae)]:
  - @kubb/core@2.12.3
  - @kubb/react@2.12.3
  - @kubb/swagger@2.12.3
  - @kubb/plugin-ts@2.12.3
  - @kubb/parser@2.12.3

## 2.12.2

### Patch Changes

- Updated dependencies [[`2f3f3ea`](https://github.com/kubb-labs/kubb/commit/2f3f3ea66cc12ec185893892d7408c4458631531)]:
  - @kubb/core@2.12.2
  - @kubb/react@2.12.2
  - @kubb/swagger@2.12.2
  - @kubb/plugin-ts@2.12.2
  - @kubb/parser@2.12.2

## 2.12.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@2.12.1
  - @kubb/parser@2.12.1
  - @kubb/react@2.12.1
  - @kubb/swagger@2.12.1
  - @kubb/plugin-ts@2.12.1

## 2.12.0

### Patch Changes

- Updated dependencies [[`d9191db`](https://github.com/kubb-labs/kubb/commit/d9191db9267b13acf4af40fb0bbe9c9d2cd39ca3)]:
  - @kubb/core@2.12.0
  - @kubb/react@2.12.0
  - @kubb/swagger@2.12.0
  - @kubb/plugin-ts@2.12.0
  - @kubb/parser@2.12.0

## 2.11.1

### Patch Changes

- [#889](https://github.com/kubb-labs/kubb/pull/889) [`83fdc44`](https://github.com/kubb-labs/kubb/commit/83fdc4421110eb07c94665d78c7b23642af854d5) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - faker gives wrong string format for date, causes zodios mock failed to parse type properly

- Updated dependencies []:
  - @kubb/core@2.11.1
  - @kubb/parser@2.11.1
  - @kubb/react@2.11.1
  - @kubb/swagger@2.11.1
  - @kubb/plugin-ts@2.11.1

## 2.11.0

### Minor Changes

- [#883](https://github.com/kubb-labs/kubb/pull/883) [`b97c061`](https://github.com/kubb-labs/kubb/commit/b97c0616c231f8aa51e4551e5558573ad43ada98) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - use of unified SchemaGenerator to create schemas for TypeScript, Zod and the Fake Plugin

### Patch Changes

- Updated dependencies [[`b97c061`](https://github.com/kubb-labs/kubb/commit/b97c0616c231f8aa51e4551e5558573ad43ada98), [`b97c061`](https://github.com/kubb-labs/kubb/commit/b97c0616c231f8aa51e4551e5558573ad43ada98)]:
  - @kubb/plugin-ts@2.11.0
  - @kubb/swagger@2.11.0
  - @kubb/react@2.11.0
  - @kubb/core@2.11.0
  - @kubb/parser@2.11.0

## 2.10.0

### Patch Changes

- Updated dependencies [[`a80cc2d`](https://github.com/kubb-labs/kubb/commit/a80cc2d2a4f109ff1e814707e5dd104bd730fb64)]:
  - @kubb/swagger@2.10.0
  - @kubb/core@2.10.0
  - @kubb/plugin-ts@2.10.0
  - @kubb/react@2.10.0
  - @kubb/parser@2.10.0

## 2.9.1

### Patch Changes

- Updated dependencies [[`6109ffa`](https://github.com/kubb-labs/kubb/commit/6109ffa77aa9e6d629eff06850d2fe4bcd62088c)]:
  - @kubb/core@2.9.1
  - @kubb/react@2.9.1
  - @kubb/swagger@2.9.1
  - @kubb/plugin-ts@2.9.1
  - @kubb/parser@2.9.1

## 2.9.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@2.9.0
  - @kubb/parser@2.9.0
  - @kubb/react@2.9.0
  - @kubb/swagger@2.9.0
  - @kubb/plugin-ts@2.9.0

## 2.8.2

### Patch Changes

- Updated dependencies [[`9759907`](https://github.com/kubb-labs/kubb/commit/9759907ac07abd69021712666331f34fc8fa33f0)]:
  - @kubb/parser@2.8.2
  - @kubb/core@2.8.2
  - @kubb/react@2.8.2
  - @kubb/plugin-ts@2.8.2
  - @kubb/swagger@2.8.2

## 2.8.1

### Patch Changes

- [`e9396d7`](https://github.com/kubb-labs/kubb/commit/e9396d76a74fd3992444bbc21f3dedda1ee99ea4) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - use of faker.number.int for type integer

- Updated dependencies []:
  - @kubb/core@2.8.1
  - @kubb/parser@2.8.1
  - @kubb/react@2.8.1
  - @kubb/swagger@2.8.1
  - @kubb/plugin-ts@2.8.1

## 2.8.0

### Patch Changes

- [#852](https://github.com/kubb-labs/kubb/pull/852) [`752f9a0`](https://github.com/kubb-labs/kubb/commit/752f9a02f642f2c5e948b96622fdc73c33d571b8) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - useOperation and useSchema with a component Oas and Oas.Operation

- Updated dependencies [[`752f9a0`](https://github.com/kubb-labs/kubb/commit/752f9a02f642f2c5e948b96622fdc73c33d571b8), [`e2eed44`](https://github.com/kubb-labs/kubb/commit/e2eed4482e2e49d41c87e64eb484ebedbeb3ccc8)]:
  - @kubb/plugin-ts@2.8.0
  - @kubb/swagger@2.8.0
  - @kubb/react@2.8.0
  - @kubb/core@2.8.0
  - @kubb/parser@2.8.0

## 2.7.2

### Patch Changes

- [#848](https://github.com/kubb-labs/kubb/pull/848) [`7027af9`](https://github.com/kubb-labs/kubb/commit/7027af91c28475c9ab98b16d237fc3fb429962b4) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - correct use of regex for faker

- Updated dependencies [[`5857667`](https://github.com/kubb-labs/kubb/commit/5857667ca41cbc8fb983d335691fa8c8047e1f48)]:
  - @kubb/plugin-ts@2.7.2
  - @kubb/core@2.7.2
  - @kubb/parser@2.7.2
  - @kubb/react@2.7.2
  - @kubb/swagger@2.7.2

## 2.7.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@2.7.1
  - @kubb/parser@2.7.1
  - @kubb/react@2.7.1
  - @kubb/swagger@2.7.1
  - @kubb/plugin-ts@2.7.1

## 2.7.0

### Patch Changes

- Updated dependencies [[`26dcce7`](https://github.com/kubb-labs/kubb/commit/26dcce7c21ecc81e03943f80a60178f5456caeef)]:
  - @kubb/react@2.7.0
  - @kubb/swagger@2.7.0
  - @kubb/plugin-ts@2.7.0
  - @kubb/core@2.7.0
  - @kubb/parser@2.7.0

## 2.6.7

### Patch Changes

- Updated dependencies [[`93940b3`](https://github.com/kubb-labs/kubb/commit/93940b34dbe0c0ad5e81db3c0db5c40dfeed380f)]:
  - @kubb/core@2.6.7
  - @kubb/react@2.6.7
  - @kubb/swagger@2.6.7
  - @kubb/plugin-ts@2.6.7
  - @kubb/parser@2.6.7

## 2.6.6

### Patch Changes

- Updated dependencies []:
  - @kubb/core@2.6.6
  - @kubb/parser@2.6.6
  - @kubb/react@2.6.6
  - @kubb/swagger@2.6.6
  - @kubb/plugin-ts@2.6.6

## 2.6.5

### Patch Changes

- Updated dependencies []:
  - @kubb/core@2.6.5
  - @kubb/parser@2.6.5
  - @kubb/react@2.6.5
  - @kubb/swagger@2.6.5
  - @kubb/plugin-ts@2.6.5

## 2.6.4

### Patch Changes

- Updated dependencies [[`ee1dd8e`](https://github.com/kubb-labs/kubb/commit/ee1dd8ebf6cd7331176670af7bbb2c9cf98b4ce9)]:
  - @kubb/swagger@2.6.4
  - @kubb/plugin-ts@2.6.4
  - @kubb/core@2.6.4
  - @kubb/parser@2.6.4
  - @kubb/react@2.6.4

## 2.6.3

### Patch Changes

- Updated dependencies [[`52e802a`](https://github.com/kubb-labs/kubb/commit/52e802ac61a5c1820020ad1ec80ddcf930a647f1)]:
  - @kubb/swagger@2.6.3
  - @kubb/plugin-ts@2.6.3
  - @kubb/core@2.6.3
  - @kubb/parser@2.6.3
  - @kubb/react@2.6.3

## 2.6.2

### Patch Changes

- Updated dependencies []:
  - @kubb/core@2.6.2
  - @kubb/parser@2.6.2
  - @kubb/react@2.6.2
  - @kubb/swagger@2.6.2
  - @kubb/plugin-ts@2.6.2

## 2.6.1

### Patch Changes

- Updated dependencies [[`69897f5`](https://github.com/kubb-labs/kubb/commit/69897f5ab4097ec1970b874d724319fb1e1e7f30)]:
  - @kubb/plugin-ts@2.6.1
  - @kubb/swagger@2.6.1
  - @kubb/core@2.6.1
  - @kubb/parser@2.6.1
  - @kubb/react@2.6.1

## 2.6.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@2.6.0
  - @kubb/parser@2.6.0
  - @kubb/react@2.6.0
  - @kubb/swagger@2.6.0
  - @kubb/plugin-ts@2.6.0

## 2.5.3

### Patch Changes

- [`4e8de2e`](https://github.com/kubb-labs/kubb/commit/4e8de2ea5e8d9df594b6a7041bb3dd48ff849c4d) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - make it possible to override faker creators

- Updated dependencies []:
  - @kubb/core@2.5.3
  - @kubb/parser@2.5.3
  - @kubb/react@2.5.3
  - @kubb/swagger@2.5.3
  - @kubb/plugin-ts@2.5.3

## 2.5.2

### Patch Changes

- Updated dependencies []:
  - @kubb/core@2.5.2
  - @kubb/parser@2.5.2
  - @kubb/react@2.5.2
  - @kubb/swagger@2.5.2
  - @kubb/plugin-ts@2.5.2

## 2.5.1

### Patch Changes

- Updated dependencies [[`96461a6`](https://github.com/kubb-labs/kubb/commit/96461a6028d5be9cf0903d3729fd6153185092c2)]:
  - @kubb/plugin-ts@2.5.1
  - @kubb/core@2.5.1
  - @kubb/parser@2.5.1
  - @kubb/react@2.5.1
  - @kubb/swagger@2.5.1

## 2.5.0

### Minor Changes

- [#795](https://github.com/kubb-labs/kubb/pull/795) [`457ee7f`](https://github.com/kubb-labs/kubb/commit/457ee7fc6c6b6e37f7bf499e8a2182cd8f56fa97) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Allow to use unknown instead of any

### Patch Changes

- Updated dependencies [[`457ee7f`](https://github.com/kubb-labs/kubb/commit/457ee7fc6c6b6e37f7bf499e8a2182cd8f56fa97)]:
  - @kubb/plugin-ts@2.5.0
  - @kubb/core@2.5.0
  - @kubb/parser@2.5.0
  - @kubb/react@2.5.0
  - @kubb/swagger@2.5.0

## 2.4.1

### Patch Changes

- Updated dependencies [[`bf1e521`](https://github.com/kubb-labs/kubb/commit/bf1e52182b636cef8c2cd54bcb123baf47d2d624), [`e9aaa92`](https://github.com/kubb-labs/kubb/commit/e9aaa92b891971d22cbb19f4a1bd37edbdc8bd7d), [`3e46f03`](https://github.com/kubb-labs/kubb/commit/3e46f031e4d54ea2cb197446c5922280b09326d5)]:
  - @kubb/plugin-ts@2.4.1
  - @kubb/core@2.4.1
  - @kubb/swagger@2.4.1
  - @kubb/react@2.4.1
  - @kubb/parser@2.4.1

## 2.4.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@2.4.0
  - @kubb/parser@2.4.0
  - @kubb/react@2.4.0
  - @kubb/swagger@2.4.0
  - @kubb/plugin-ts@2.4.0

## 2.3.0

### Patch Changes

- Updated dependencies [[`ec9c07d`](https://github.com/kubb-labs/kubb/commit/ec9c07d90eb3472f5d0030a1cbb746e0055b8ab8)]:
  - @kubb/plugin-ts@2.3.0
  - @kubb/parser@2.3.0
  - @kubb/core@2.3.0
  - @kubb/react@2.3.0
  - @kubb/swagger@2.3.0

## 2.2.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@2.2.1
  - @kubb/parser@2.2.1
  - @kubb/react@2.2.1
  - @kubb/swagger@2.2.1
  - @kubb/plugin-ts@2.2.1

## 2.2.0

### Minor Changes

- [`2c20339`](https://github.com/kubb-labs/kubb/commit/2c20339cfac5c0789f6bf9086b6106feba4cbbde) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - support x-enum-varnames

### Patch Changes

- Updated dependencies [[`2c20339`](https://github.com/kubb-labs/kubb/commit/2c20339cfac5c0789f6bf9086b6106feba4cbbde), [`9c17a9e`](https://github.com/kubb-labs/kubb/commit/9c17a9e1538961fe07f21e6999d4be2aedb896ea)]:
  - @kubb/plugin-ts@2.2.0
  - @kubb/swagger@2.2.0
  - @kubb/core@2.2.0
  - @kubb/parser@2.2.0
  - @kubb/react@2.2.0

## 2.1.6

### Patch Changes

- Updated dependencies []:
  - @kubb/core@2.1.6
  - @kubb/parser@2.1.6
  - @kubb/react@2.1.6
  - @kubb/swagger@2.1.6
  - @kubb/plugin-ts@2.1.6

## 2.1.5

### Patch Changes

- Updated dependencies []:
  - @kubb/core@2.1.5
  - @kubb/parser@2.1.5
  - @kubb/react@2.1.5
  - @kubb/swagger@2.1.5
  - @kubb/plugin-ts@2.1.5

## 2.1.4

### Patch Changes

- Updated dependencies []:
  - @kubb/core@2.1.4
  - @kubb/parser@2.1.4
  - @kubb/react@2.1.4
  - @kubb/swagger@2.1.4
  - @kubb/plugin-ts@2.1.4

## 2.1.3

### Patch Changes

- Updated dependencies [[`9307bda`](https://github.com/kubb-labs/kubb/commit/9307bda2c2dc08503809eec7d048bba4e6388121)]:
  - @kubb/core@2.1.3
  - @kubb/react@2.1.3
  - @kubb/swagger@2.1.3
  - @kubb/plugin-ts@2.1.3
  - @kubb/parser@2.1.3

## 2.1.2

### Patch Changes

- Updated dependencies []:
  - @kubb/core@2.1.2
  - @kubb/parser@2.1.2
  - @kubb/react@2.1.2
  - @kubb/swagger@2.1.2
  - @kubb/plugin-ts@2.1.2

## 2.1.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@2.1.1
  - @kubb/parser@2.1.1
  - @kubb/react@2.1.1
  - @kubb/swagger@2.1.1
  - @kubb/plugin-ts@2.1.1

## 2.1.0

### Minor Changes

- [#713](https://github.com/kubb-labs/kubb/pull/713) [`c22433e`](https://github.com/kubb-labs/kubb/commit/c22433ec2c1b04527d72a6de44e524e580e2d876) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - `barrelNamed` for `exportType` to use `export { nameX, nameY } from '.'`

- [#736](https://github.com/kubb-labs/kubb/pull/736) [`897da31`](https://github.com/kubb-labs/kubb/commit/897da317e440c268ef9b75f0d8adfc840d76f8b6) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Faker with `seed` option to specify the overall seed that Faker needs to use. This can be a number or an array of numbers. See https://fakerjs.dev/api/faker.html#seed

### Patch Changes

- Updated dependencies [[`c22433e`](https://github.com/kubb-labs/kubb/commit/c22433ec2c1b04527d72a6de44e524e580e2d876)]:
  - @kubb/plugin-ts@2.1.0
  - @kubb/parser@2.1.0
  - @kubb/core@2.1.0
  - @kubb/react@2.1.0
  - @kubb/swagger@2.1.0

## 2.0.6

### Patch Changes

- Updated dependencies []:
  - @kubb/core@2.0.6
  - @kubb/parser@2.0.6
  - @kubb/react@2.0.6
  - @kubb/swagger@2.0.6
  - @kubb/plugin-ts@2.0.6

## 2.0.5

### Patch Changes

- Updated dependencies []:
  - @kubb/core@2.0.5
  - @kubb/parser@2.0.5
  - @kubb/react@2.0.5
  - @kubb/swagger@2.0.5
  - @kubb/plugin-ts@2.0.5

## 2.0.4

## 2.0.3

### Patch Changes

- Updated dependencies []:
  - @kubb/core@2.0.3
  - @kubb/parser@2.0.3
  - @kubb/react@2.0.3
  - @kubb/swagger@2.0.3
  - @kubb/plugin-ts@2.0.3

## 2.0.2

### Patch Changes

- Updated dependencies []:
  - @kubb/core@2.0.2
  - @kubb/parser@2.0.2
  - @kubb/react@2.0.2
  - @kubb/swagger@2.0.2
  - @kubb/plugin-ts@2.0.2

## 2.0.1

### Patch Changes

- Updated dependencies [[`37bd469`](https://github.com/kubb-labs/kubb/commit/37bd469acbe1b80b9602621c8c128b1b0d456d21)]:
  - @kubb/plugin-ts@2.0.1
  - @kubb/core@2.0.1
  - @kubb/parser@2.0.1
  - @kubb/react@2.0.1
  - @kubb/swagger@2.0.1

## 2.0.0

### Major Changes

- [#686](https://github.com/kubb-labs/kubb/pull/686) [`0c894ca`](https://github.com/kubb-labs/kubb/commit/0c894ca935045272a3427ed5646a83184646e354) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - plugin-ts with output object

- [#678](https://github.com/kubb-labs/kubb/pull/678) [`48b7ff2`](https://github.com/kubb-labs/kubb/commit/48b7ff246a3459bb7a9be6d430407c2538d3b2eb) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - swagger `Infer<typeof oas>` type

### Minor Changes

- [`210d58f`](https://github.com/kubb-labs/kubb/commit/210d58fd1fcc1e8d84f38fdfabbb59630a7394b5) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - `exportType` to disable the creation of barrel files

### Patch Changes

- [#676](https://github.com/kubb-labs/kubb/pull/676) [`d729470`](https://github.com/kubb-labs/kubb/commit/d729470b74121eef6776649654921ce61b35da51) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - feat: use of Query and Mutation component for swagger-faker

- [#676](https://github.com/kubb-labs/kubb/pull/676) [`d729470`](https://github.com/kubb-labs/kubb/commit/d729470b74121eef6776649654921ce61b35da51) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - mapper and transformers.schema to override default fakerParser

- [#689](https://github.com/kubb-labs/kubb/pull/689) [`8044907`](https://github.com/kubb-labs/kubb/commit/8044907f560f1e9a6120df259568b9213a4f1e4a) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - path.extName to set `.ts` or `.js` to the barrel files

- [#707](https://github.com/kubb-labs/kubb/pull/707) [`955f8ed`](https://github.com/kubb-labs/kubb/commit/955f8edc26ca303f3432ed875a97e249c88df89b) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - use of combineFiles

- [`e17bc7c`](https://github.com/kubb-labs/kubb/commit/e17bc7ccfb91aeab52488e847356890464aa6166) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - tsup build cleanup with `splitting`

- [`6d7e994`](https://github.com/kubb-labs/kubb/commit/6d7e9944a26787da924fe1c6d8521f65a9206c98) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - joinItems to have a correct faker.union

- Updated dependencies [[`0c894ca`](https://github.com/kubb-labs/kubb/commit/0c894ca935045272a3427ed5646a83184646e354), [`955f8ed`](https://github.com/kubb-labs/kubb/commit/955f8edc26ca303f3432ed875a97e249c88df89b), [`d729470`](https://github.com/kubb-labs/kubb/commit/d729470b74121eef6776649654921ce61b35da51), [`d729470`](https://github.com/kubb-labs/kubb/commit/d729470b74121eef6776649654921ce61b35da51), [`48b7ff2`](https://github.com/kubb-labs/kubb/commit/48b7ff246a3459bb7a9be6d430407c2538d3b2eb), [`8044907`](https://github.com/kubb-labs/kubb/commit/8044907f560f1e9a6120df259568b9213a4f1e4a), [`6348057`](https://github.com/kubb-labs/kubb/commit/634805723409381eace8e68fd5f2eab6f737dd7a), [`210d58f`](https://github.com/kubb-labs/kubb/commit/210d58fd1fcc1e8d84f38fdfabbb59630a7394b5), [`0c894ca`](https://github.com/kubb-labs/kubb/commit/0c894ca935045272a3427ed5646a83184646e354), [`48b7ff2`](https://github.com/kubb-labs/kubb/commit/48b7ff246a3459bb7a9be6d430407c2538d3b2eb), [`955f8ed`](https://github.com/kubb-labs/kubb/commit/955f8edc26ca303f3432ed875a97e249c88df89b), [`d729470`](https://github.com/kubb-labs/kubb/commit/d729470b74121eef6776649654921ce61b35da51), [`955f8ed`](https://github.com/kubb-labs/kubb/commit/955f8edc26ca303f3432ed875a97e249c88df89b), [`e17bc7c`](https://github.com/kubb-labs/kubb/commit/e17bc7ccfb91aeab52488e847356890464aa6166)]:
  - @kubb/swagger@2.0.0
  - @kubb/core@2.0.0
  - @kubb/parser@2.0.0
  - @kubb/react@2.0.0
  - @kubb/plugin-ts@2.0.0
