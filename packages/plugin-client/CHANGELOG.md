# @kubb/plugin-client

## 5.8.0

### Minor Changes

- [#1257](https://github.com/kubb-labs/plugins/pull/1257) [`d6e69b2`](https://github.com/kubb-labs/plugins/commit/d6e69b2f098351924f53e9ea3f6d7ac5e3cca4a9) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - A request body offered in several media types now pairs each body variant with its `contentType.request`. The first media type stays the default; any other variant must pass `contentType`, so sending the JSON body of a multipart-first operation as multipart is a type error.

### Patch Changes

- [#1251](https://github.com/kubb-labs/plugins/pull/1251) [`4c5d703`](https://github.com/kubb-labs/plugins/commit/4c5d70327c9517c39ae16851f973ccf508d7a09e) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Generated clients now pass the `encoding` of a form or multipart request body as `styles.body`.

- [#1259](https://github.com/kubb-labs/plugins/pull/1259) [`73b2ee4`](https://github.com/kubb-labs/plugins/commit/73b2ee42f4b4c6e04331237f2e17d81c299aa2fd) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Emit the declared request media type for JSON bodies and JSON-encode string bodies in the Fetch and Axios clients.

- [#1255](https://github.com/kubb-labs/plugins/pull/1255) [`970e6a1`](https://github.com/kubb-labs/plugins/commit/970e6a1d640f5c4e1872fe7fc8deb6434558756a) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Path parameter styles are keyed by the spec name of the parameter, so `style` and `explode` now apply to path parameters that are not camelCase, such as `pet_id` and `scope.id`.

- [#1288](https://github.com/kubb-labs/plugins/pull/1288) [`9d2d786`](https://github.com/kubb-labs/plugins/commit/9d2d786c59208fd9c80dbf303be70ff45649503d) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Avoid duplicate exports when operations, components, or inline TypeScript enums produce the same name. Requires Kubb 5.14.6.

- [#1258](https://github.com/kubb-labs/plugins/pull/1258) [`e6b99b9`](https://github.com/kubb-labs/plugins/commit/e6b99b9ac8a0b965a881194b2ecc37f5921cfc38) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Prefix reserved-word operation names with `_` so generated functions and their references compile.
- Updated dependencies [[`9d2d786`](https://github.com/kubb-labs/plugins/commit/9d2d786c59208fd9c80dbf303be70ff45649503d), [`cbcac52`](https://github.com/kubb-labs/plugins/commit/cbcac52e9e8f1b6fa65b871c68ea1d5a6b15f761), [`fa27169`](https://github.com/kubb-labs/plugins/commit/fa27169ee15653a3cfd58f89ec30028bb96eb54c), [`6c53ce3`](https://github.com/kubb-labs/plugins/commit/6c53ce350efbca1cfc0836a41e9d297b3f7ff1af), [`758aec3`](https://github.com/kubb-labs/plugins/commit/758aec3d5b4044de9e1d2981c3c02ea1955cd143), [`11389cd`](https://github.com/kubb-labs/plugins/commit/11389cd80f2dae489ba7dfc6df2b4843f6e6ee69), [`cc0a2af`](https://github.com/kubb-labs/plugins/commit/cc0a2af243030248e9735f180561b7bc0c60e6df), [`df86551`](https://github.com/kubb-labs/plugins/commit/df86551b33bac4aa83430cb4ff72c6f47bd090c2), [`d6e69b2`](https://github.com/kubb-labs/plugins/commit/d6e69b2f098351924f53e9ea3f6d7ac5e3cca4a9), [`44bee8e`](https://github.com/kubb-labs/plugins/commit/44bee8e50f4f46935957e9b53614a789e402c8d0), [`aa8b947`](https://github.com/kubb-labs/plugins/commit/aa8b947f15c459ff4d3068c5853e999b05fda7c9), [`754fac6`](https://github.com/kubb-labs/plugins/commit/754fac619734a3edcaea3fbd7b7fd07c1b34243a)]:
  - @kubb/plugin-ts@5.3.0
  - @kubb/plugin-zod@5.7.3

## 5.7.2

### Patch Changes

- [#1218](https://github.com/kubb-labs/plugins/pull/1218) [`1c2c7d6`](https://github.com/kubb-labs/plugins/commit/1c2c7d619203426749fcb31e9b910063d02ea436) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Require Kubb 5.13.1 or later.
- Updated dependencies [[`1c2c7d6`](https://github.com/kubb-labs/plugins/commit/1c2c7d619203426749fcb31e9b910063d02ea436), [`a117810`](https://github.com/kubb-labs/plugins/commit/a117810f9a7f5ec489bc842119f023e918565d83), [`16a4fb8`](https://github.com/kubb-labs/plugins/commit/16a4fb8712c41a5b86324509a3da81171876f43e)]:
  - @kubb/plugin-ts@5.2.0
  - @kubb/plugin-zod@5.7.2

## 5.7.1

### Patch Changes

- [#1210](https://github.com/kubb-labs/plugins/pull/1210) [`0ecc416`](https://github.com/kubb-labs/plugins/commit/0ecc4169c2a5a5d36489c52e7c3d0daec12d6222) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Type clients, query hooks, and MCP handlers from `pluginZod({ inferred: 'codec' })` when it is set, so a custom codec param takes its domain value.
  
  - Types a codec param such as a `URL` with the value the encode schema accepts, instead of the wire `string`, also next to `pluginTs()`.
  - Types the decoded response, such as a `URL` or `bigint`, in `data`.
  - Makes `pluginTs()` optional for React Query, SWR, Vue Query, and MCP when `pluginZod({ inferred })` supplies the types.
  - Renames `inferred: 'direction'` to `inferred: 'codec'`. `'direction'` still works as a deprecated alias.
- Updated dependencies [[`0ecc416`](https://github.com/kubb-labs/plugins/commit/0ecc4169c2a5a5d36489c52e7c3d0daec12d6222)]:
  - @kubb/plugin-zod@5.7.1

## 5.7.0

### Minor Changes

- [#1208](https://github.com/kubb-labs/plugins/pull/1208) [`01c618d`](https://github.com/kubb-labs/plugins/commit/01c618d6f5b0a090abfb834952ec3d7833481bd6) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Add `validator.params: 'zod'` to validate and encode path, query, and header params before a request is sent.
  
  - Sends codec params in their wire form, such as a `Date` as `2026-10-01`, and rejects an invalid param before the request.
  - Merges client and call `headers` case-insensitively, with the call winning.
  - Adds a required `source` field to `ValidationErrorContext`.
  - Narrows `client.getUrl` to a `UrlConfig` instead of a full `RequestConfig`.
  - Requires a custom `@kubb/plugin-client` module to export `toHeadersStandardSchema` when `params` is on.
  
  ```typescript
  pluginZod({ inferred: 'direction' })
  pluginFetch({ validator: { request: 'zod', params: 'zod', response: 'zod' } })
  ```

### Patch Changes

- [#1205](https://github.com/kubb-labs/plugins/pull/1205) [`e50c36e`](https://github.com/kubb-labs/plugins/commit/e50c36e4f9a2a13993fd3271fe161666c12f9ace) Thanks [@xeoneux](https://github.com/xeoneux)! - Pass the operation's OAuth scopes to the `auth` resolver via `Auth.scopes`.
- Updated dependencies [[`01c618d`](https://github.com/kubb-labs/plugins/commit/01c618d6f5b0a090abfb834952ec3d7833481bd6)]:
  - @kubb/plugin-zod@5.7.0

## 5.6.0

### Minor Changes

- [#1201](https://github.com/kubb-labs/plugins/pull/1201) [`c023c0f`](https://github.com/kubb-labs/plugins/commit/c023c0f3f801f5a6a1c0f8211b41f9b139a7ca4e) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Require Node.js 22.22 or newer, to match `kubb` and `@kubb/core`.

### Patch Changes

- Updated dependencies [[`c023c0f`](https://github.com/kubb-labs/plugins/commit/c023c0f3f801f5a6a1c0f8211b41f9b139a7ca4e), [`9f72b82`](https://github.com/kubb-labs/plugins/commit/9f72b82802e28766433316475dcffdee7916046a), [`726eb48`](https://github.com/kubb-labs/plugins/commit/726eb481716135048c03de79d264ae0472e563c6)]:
  - @kubb/plugin-ts@5.1.0
  - @kubb/plugin-zod@5.6.0

## 5.5.16

### Patch Changes

- [#1165](https://github.com/kubb-labs/plugins/pull/1165) [`5d76f27`](https://github.com/kubb-labs/plugins/commit/5d76f2736eabb43ab72b5b7cc6880d54f09e5712) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Studio can now edit more plugin options, because each `kubb-extension.json` lists them:
  
  - Every plugin: `output.banner` and `output.footer` as text.
  - `@kubb/plugin-axios` and `@kubb/plugin-fetch`: `returnType` and `throwOnErrorDefault`.
  - `@kubb/plugin-client`: `throwOnErrorDefault`.
  - `@kubb/plugin-faker`: `typeMode`.
  - `@kubb/plugin-zod`: `compile` and `typeGuards` as on or off.
  - `@kubb/plugin-react-query`: `customOptions.importPath` and `customOptions.name`.
- Updated dependencies [[`ccce85d`](https://github.com/kubb-labs/plugins/commit/ccce85d735d2ac92c42011d4bdf11431de12a7c1), [`5d76f27`](https://github.com/kubb-labs/plugins/commit/5d76f2736eabb43ab72b5b7cc6880d54f09e5712), [`07c62dd`](https://github.com/kubb-labs/plugins/commit/07c62dd57990afbfb12e0c937d446710fbcdc009), [`60cc33e`](https://github.com/kubb-labs/plugins/commit/60cc33e99e72bcf5408738d207434d25ebb6dbdb)]:
  - @kubb/plugin-ts@5.0.15
  - @kubb/plugin-zod@5.4.13

## 5.5.15

### Patch Changes

- [#1124](https://github.com/kubb-labs/plugins/pull/1124) [`d7faeeb`](https://github.com/kubb-labs/plugins/commit/d7faeeb2771132e3cee2c5b17076d95b0a432d62) Thanks [@mohammad-naji7](https://github.com/mohammad-naji7)! - Emit `allowReserved` for query parameters in the generated `styles`, so the runtime keeps reserved characters in those values unencoded.

## 5.5.14

### Patch Changes

- [#1139](https://github.com/kubb-labs/plugins/pull/1139) [`cd003f2`](https://github.com/kubb-labs/plugins/commit/cd003f29b011cc911f8946f9e7627b0ae460a414) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Require Node.js 22.12 or higher.
- Updated dependencies [[`cd003f2`](https://github.com/kubb-labs/plugins/commit/cd003f29b011cc911f8946f9e7627b0ae460a414)]:
  - @kubb/plugin-ts@5.0.14
  - @kubb/plugin-zod@5.4.12

## 5.5.13

### Patch Changes

- [#1135](https://github.com/kubb-labs/plugins/pull/1135) [`214b224`](https://github.com/kubb-labs/plugins/commit/214b224036c69c70cb6279e77b4379dc783eee19) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Ship separate CommonJS type declarations, so `require` consumers get correct types under `moduleResolution: node16` and `nodenext`.
  
  - Points the `require` condition at new `.d.cts` files. It used to reuse the ESM `.d.ts`, which TypeScript then read as ESM.
  - Removes the untyped `rolldown-runtime` import from the published declarations, which failed under `skipLibCheck: false`.
- Updated dependencies [[`214b224`](https://github.com/kubb-labs/plugins/commit/214b224036c69c70cb6279e77b4379dc783eee19)]:
  - @kubb/plugin-ts@5.0.13
  - @kubb/plugin-zod@5.4.11

## 5.5.12

### Patch Changes

- [#1131](https://github.com/kubb-labs/plugins/pull/1131) [`5c9ae77`](https://github.com/kubb-labs/plugins/commit/5c9ae772af531103fd2584cdac0475dbf9c7dea6) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Config mistakes now fail with a diagnostic code and a fix instead of a plugin crash. A client plugin without `pluginTs()` or `pluginZod({ inferred: true })` now fails instead of generating nothing.
- Updated dependencies [[`5c9ae77`](https://github.com/kubb-labs/plugins/commit/5c9ae772af531103fd2584cdac0475dbf9c7dea6), [`d333749`](https://github.com/kubb-labs/plugins/commit/d33374925860b5b3dfe0762eb4b3926c4f9fef59), [`94dcb86`](https://github.com/kubb-labs/plugins/commit/94dcb86a6625f98305da7bbbd747ac36ff460673), [`be793ae`](https://github.com/kubb-labs/plugins/commit/be793ae1f9c73c3a3a6723733564c8f0cb2c0cf2), [`e69f6db`](https://github.com/kubb-labs/plugins/commit/e69f6db78c460f5cf1abe25acd560c3e00901485)]:
  - @kubb/plugin-zod@5.4.10
  - @kubb/plugin-ts@5.0.12

## 5.5.11

### Patch Changes

- [#1113](https://github.com/kubb-labs/plugins/pull/1113) [`6d660cc`](https://github.com/kubb-labs/plugins/commit/6d660cce26b29f80d6e86ad846b4252747dfdde2) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Accept `@kubb/plugin-client` as the client plugin. The `client` option now also takes `'client'`, a lone registered `@kubb/plugin-client` is auto-detected, and the generated hooks and handlers call its operations and import `RequestConfig` and `ResponseErrorConfig` from your `importPath` module.

## 5.5.10

### Patch Changes

- [#1093](https://github.com/kubb-labs/plugins/pull/1093) [`6dff4fe`](https://github.com/kubb-labs/plugins/commit/6dff4fe783ae851205baa226cb411bf4cbccceba) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - List `optionalDependencies` in `kubb-extension.json`.

- [#1098](https://github.com/kubb-labs/plugins/pull/1098) [`868dacd`](https://github.com/kubb-labs/plugins/commit/868dacd513fe7c3c92583a6b1df31d5ffc44a82e) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Type each plugin with `PluginType` from `kubb/kit`, the new name of `PluginFactoryOptions`.
- Updated dependencies [[`868dacd`](https://github.com/kubb-labs/plugins/commit/868dacd513fe7c3c92583a6b1df31d5ffc44a82e)]:
  - @kubb/plugin-ts@5.0.11
  - @kubb/plugin-zod@5.4.9

## 5.5.9

### Patch Changes

- [#1086](https://github.com/kubb-labs/plugins/pull/1086) [`02c4172`](https://github.com/kubb-labs/plugins/commit/02c41722a2872767579dc3b4784159e477962005) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Give each extension page on kubb.dev the same sections (Setup, Options worth knowing, and Example), and fix claims that did not match the code.
  
  - List the peer versions the generated code needs, such as `@tanstack/react-query` 5.82, `swr` 2.2, `@faker-js/faker` v10, and `cypress` v15 or v16.
  - Say that `validator: 'zod'` validates response bodies only, and that `{ request: 'zod', response: 'zod' }` also validates request bodies.
  - Say which React Query and Vue Query options need `hooks: true`.
  - Say that the MCP server starts through `startServer()` and that the generated `.mcp.json` runs `npx tsx`.
- Updated dependencies [[`02c4172`](https://github.com/kubb-labs/plugins/commit/02c41722a2872767579dc3b4784159e477962005)]:
  - @kubb/plugin-ts@5.0.10
  - @kubb/plugin-zod@5.4.8

## 5.5.8

### Patch Changes

- [#1077](https://github.com/kubb-labs/plugins/pull/1077) [`1d2a0f5`](https://github.com/kubb-labs/plugins/commit/1d2a0f5b5233dc362dd0d540341e6689dcd2a07e) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Define each plugin with `defineExtension` instead of the deprecated `definePlugin`. The plugins now require Kubb 5.8.3 or later.

- [#1081](https://github.com/kubb-labs/plugins/pull/1081) [`af4900a`](https://github.com/kubb-labs/plugins/commit/af4900aac3f7e19cc71977333c066d324ad6896a) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Ship the overview, options page, and how-to guides in a `docs/` folder instead of `OVERVIEW.md`.
- Updated dependencies [[`1d2a0f5`](https://github.com/kubb-labs/plugins/commit/1d2a0f5b5233dc362dd0d540341e6689dcd2a07e), [`af4900a`](https://github.com/kubb-labs/plugins/commit/af4900aac3f7e19cc71977333c066d324ad6896a)]:
  - @kubb/plugin-ts@5.0.9
  - @kubb/plugin-zod@5.4.7

## 5.5.7

### Patch Changes

- [#1071](https://github.com/kubb-labs/plugins/pull/1071) [`bd76f8f`](https://github.com/kubb-labs/plugins/commit/bd76f8fc5654770e1ca5c92f106e75ac0fa2c18d) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Ship `kubb-extension.json` and `OVERVIEW.md`. The plugin reads its `meta` from the manifest, and Kubb Studio renders its options from it.

- [#1074](https://github.com/kubb-labs/plugins/pull/1074) [`1739053`](https://github.com/kubb-labs/plugins/commit/173905355dda2835444ac080d7bbfba4085088cc) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Update Kubb to 5.8.1.
- Updated dependencies [[`bd76f8f`](https://github.com/kubb-labs/plugins/commit/bd76f8fc5654770e1ca5c92f106e75ac0fa2c18d), [`1739053`](https://github.com/kubb-labs/plugins/commit/173905355dda2835444ac080d7bbfba4085088cc)]:
  - @kubb/plugin-ts@5.0.8
  - @kubb/plugin-zod@5.4.6

## 5.5.6

### Patch Changes

- [#1068](https://github.com/kubb-labs/plugins/pull/1068) [`7ffc2da`](https://github.com/kubb-labs/plugins/commit/7ffc2dae18a350de6cae382e53a26fbba4b2cd32) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Define every plugin with the object form of `definePlugin`. Each plugin now carries `meta` with its name and package version, and `setup` returns its resolved options.
  
  Required plugins move from `ctx.requirePlugin` to a `dependencies` record. A config without a required plugin now fails before any plugin runs, with `KUBB_MISSING_DEPENDENCY` instead of `KUBB_PLUGIN_NOT_FOUND`. The rules for which plugin needs which stay the same:
  
  - cypress, faker, mcp, msw, react-query, swr, and vue-query need `@kubb/plugin-ts`.
  - mcp needs `@kubb/plugin-zod`, and msw needs `@kubb/plugin-faker` when `parser: 'faker'` is set.
  - client needs `@kubb/plugin-zod` when `validator` is set. axios, fetch, and client only order themselves after plugin-ts and plugin-zod.
  
  Every plugin now requires Kubb 5.8.0 or newer. The object form of `definePlugin` ships in 5.7.0, and 5.8.0 makes the plugin context work in CommonJS configs. `meta.compatibility.kubb` is `>=5.8.0`, and the `kubb` and `@kubb/*` peer ranges move to `^5.8.0`.

- [#1067](https://github.com/kubb-labs/plugins/pull/1067) [`80b22f5`](https://github.com/kubb-labs/plugins/commit/80b22f5aac29f8ec295930219b7e4ca82966d890) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Set up each plugin with the `kubb/kit` composables, such as `addGenerator()`, `setResolver()`, and `injectFile()`, instead of the `kubb` argument. The generated code is unchanged. These plugins now need Kubb 5.8.0 or later, which shares the plugin context between ESM and CommonJS configs.
- Updated dependencies [[`7ffc2da`](https://github.com/kubb-labs/plugins/commit/7ffc2dae18a350de6cae382e53a26fbba4b2cd32), [`80b22f5`](https://github.com/kubb-labs/plugins/commit/80b22f5aac29f8ec295930219b7e4ca82966d890)]:
  - @kubb/plugin-ts@5.0.7
  - @kubb/plugin-zod@5.4.5

## 5.5.5

### Patch Changes

- [#1063](https://github.com/kubb-labs/plugins/pull/1063) [`3276489`](https://github.com/kubb-labs/plugins/commit/3276489fa7fe2023707221671ed822bd4403a1c9) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Fail with a clear error on a missing required plugin or an invalid option value, instead of silently generating different output.
  
  - Require `@kubb/plugin-zod` in `@kubb/plugin-mcp`, and `@kubb/plugin-faker` in `@kubb/plugin-msw` when `parser: 'faker'` is set.
  - Require `@kubb/plugin-ts` in cypress, faker, mcp, msw, react-query, swr, and vue-query. A config without it now fails at setup instead of generating nothing.
  - Reject unknown `enum.type`, `syntaxType`, `arrayType`, and `optionalType` values in `@kubb/plugin-ts`, and an unknown `client` in react-query, vue-query, swr, and mcp.
  - Apply `coercion` in `@kubb/plugin-zod` when `mini: true` is set.
  - Keep an object factory's signature and body together in `@kubb/plugin-faker` output.
  - Correct the `baseURL` docs in msw, cypress, fetch, and axios, which claimed a fallback to the adapter's server URL that no plugin implements.
- Updated dependencies [[`3276489`](https://github.com/kubb-labs/plugins/commit/3276489fa7fe2023707221671ed822bd4403a1c9), [`e4f599f`](https://github.com/kubb-labs/plugins/commit/e4f599fb5f516054a8faa12873296f9245733da2), [`e0244ed`](https://github.com/kubb-labs/plugins/commit/e0244ed55ef48bb15e1fc6d356d9629355a7ac01)]:
  - @kubb/plugin-zod@5.4.4
  - @kubb/plugin-ts@5.0.6

## 5.5.4

### Patch Changes

- [#1028](https://github.com/kubb-labs/plugins/pull/1028) [`c163489`](https://github.com/kubb-labs/plugins/commit/c1634894a264547489d41a57fd9b7078101536e6) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Update the supported Kubb version to 5.5.2.
- Updated dependencies [[`bbcfb10`](https://github.com/kubb-labs/plugins/commit/bbcfb108b91956edd27fc70932d4d8493a7a21c7), [`c163489`](https://github.com/kubb-labs/plugins/commit/c1634894a264547489d41a57fd9b7078101536e6)]:
  - @kubb/plugin-ts@5.0.4
  - @kubb/plugin-zod@5.4.3

## 5.5.3

### Patch Changes

- [#1011](https://github.com/kubb-labs/plugins/pull/1011) [`0621506`](https://github.com/kubb-labs/plugins/commit/0621506e03d13ff0b8112f5a089d2180a63f5ea6) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Require Kubb 5.4.2 or later in plugin peer dependencies.
- Updated dependencies [[`0621506`](https://github.com/kubb-labs/plugins/commit/0621506e03d13ff0b8112f5a089d2180a63f5ea6)]:
  - @kubb/plugin-ts@5.0.3
  - @kubb/plugin-zod@5.4.2

## 5.5.2

### Minor Changes

- [#999](https://github.com/kubb-labs/plugins/pull/999) [`e7caab0`](https://github.com/kubb-labs/plugins/commit/e7caab06c311c2013a8c0c9218ad0b2a6b1d14b4) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Add a client plugin that generates typed operations against a user-provided client module.

### Patch Changes

- Updated dependencies [[`928ea0a`](https://github.com/kubb-labs/plugins/commit/928ea0a1efa3317f1e3d424c1f88d0142c70bcb3)]:
  - @kubb/plugin-zod@5.4.1
