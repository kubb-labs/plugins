# @kubb/plugin-swr

## 5.7.0

### Minor Changes

- [#1314](https://github.com/kubb-labs/plugins/pull/1314) [`c40a8a0`](https://github.com/kubb-labs/plugins/commit/c40a8a0b77ede6b436a905ec4b1e35aabbe69b77) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Plugins no longer need the `kubb` package. They import `@kubb/kit` and `@kubb/renderer-jsx` directly and list them as dependencies instead of a peer on `kubb`. A project that runs Kubb from code with `createKubb` from `@kubb/core` no longer installs the CLI, MCP server, Studio, and bundler integrations that `kubb` brings. This works with npm, pnpm, Yarn (including Plug'n'Play), and Bun without extra installs. If you use the `kubb` CLI, nothing changes.
  
  `@kubb/plugin-ts` no longer installs `@kubb/parser-ts`. It is now an optional peer dependency, needed only when a `printer.nodes` handler returns a TypeScript compiler node, which is deprecated. If that happens and `@kubb/parser-ts` is missing, the build fails with `KUBB_MISSING_DEPENDENCY` and tells you to run `npm i -D @kubb/parser-ts`. Return a string from the handler instead to avoid the dependency.
  
  `@kubb/plugin-redoc` lists `@kubb/adapter-oas` as a peer dependency instead of a dependency, so it uses your project's copy.
  
  A project that pins an older Kubb version keeps one `@kubb/core` with npm and Bun. With pnpm or Yarn, pin `@kubb/kit` and `@kubb/renderer-jsx` to your Kubb version in `overrides` or `resolutions` to get the same.

### Patch Changes

- [#1313](https://github.com/kubb-labs/plugins/pull/1313) [`25cb730`](https://github.com/kubb-labs/plugins/commit/25cb730ce55b6f4c97c087d0eabc6b5281f75612) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Depend on Kubb `^5.15.2`: `@kubb/kit` and `@kubb/renderer-jsx` for every plugin, `@kubb/parser-ts` as the optional peer of `@kubb/plugin-ts`, and `@kubb/adapter-oas` as the peer of `@kubb/plugin-redoc`.

- [#1313](https://github.com/kubb-labs/plugins/pull/1313) [`25cb730`](https://github.com/kubb-labs/plugins/commit/25cb730ce55b6f4c97c087d0eabc6b5281f75612) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Cache each operation's client and dependency file with `ctx.memo` instead of `ctx.cache`. This keeps the plugins working once `@kubb/core` drops `ctx.cache`. Generated output does not change.

- [#1304](https://github.com/kubb-labs/plugins/pull/1304) [`4bed009`](https://github.com/kubb-labs/plugins/commit/4bed00935f652cc50358d1058a42d28adf1b3af8) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Compute build-constant work once per build through `memo` instead of once per schema or operation node: the Zod printers, the operation type source a client or hook takes its types from, the `TData` and `TError` expressions of each hook, and the circular and enum name sets. Each key prefix is registered in `Kubb.MemoRegistry`.

- [#1307](https://github.com/kubb-labs/plugins/pull/1307) [`5d013e3`](https://github.com/kubb-labs/plugins/commit/5d013e3d8a747780f81b7eb67be603695ac9c0bb) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Remove `resolver.query.clientName` and `resolver.mutation.typeName`, which no generator called. Overriding them never changed the output, so delete them from a custom `resolver`.
- Updated dependencies [[`1fd420e`](https://github.com/kubb-labs/plugins/commit/1fd420edfc2d479808b8af6d48526ea923aa6a41), [`25cb730`](https://github.com/kubb-labs/plugins/commit/25cb730ce55b6f4c97c087d0eabc6b5281f75612), [`4bed009`](https://github.com/kubb-labs/plugins/commit/4bed00935f652cc50358d1058a42d28adf1b3af8), [`c40a8a0`](https://github.com/kubb-labs/plugins/commit/c40a8a0b77ede6b436a905ec4b1e35aabbe69b77), [`b4c30d3`](https://github.com/kubb-labs/plugins/commit/b4c30d3ae240548e0d5ab69f5f3a06fba8ebf49d)]:
  - @kubb/plugin-ts@5.4.0

## 5.6.1

### Patch Changes

- [#1299](https://github.com/kubb-labs/plugins/pull/1299) [`d3a8c5d`](https://github.com/kubb-labs/plugins/commit/d3a8c5dec2eab6e920b7dd9ff7e8637f7addd85f) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Import `camelCase` and `pascalCase` from `kubb/kit` instead of a copy bundled into each plugin, and compute each resolved name once per build through `this.memo`, with the key prefixes registered in `Kubb.MemoRegistry`. A grouped SDK class whose tag starts with a digit now gets a valid class name. Needs kubb 5.15 or later.
- Updated dependencies [[`d3a8c5d`](https://github.com/kubb-labs/plugins/commit/d3a8c5dec2eab6e920b7dd9ff7e8637f7addd85f)]:
  - @kubb/plugin-ts@5.3.3

## 5.6.0

### Minor Changes

- [#1257](https://github.com/kubb-labs/plugins/pull/1257) [`d6e69b2`](https://github.com/kubb-labs/plugins/commit/d6e69b2f098351924f53e9ea3f6d7ac5e3cca4a9) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - A request body offered in several media types now pairs each body variant with its `contentType.request`. The first media type stays the default; any other variant must pass `contentType`, so sending the JSON body of a multipart-first operation as multipart is a type error.

### Patch Changes

- [#1288](https://github.com/kubb-labs/plugins/pull/1288) [`9d2d786`](https://github.com/kubb-labs/plugins/commit/9d2d786c59208fd9c80dbf303be70ff45649503d) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Avoid duplicate exports when operations, components, or inline TypeScript enums produce the same name. Requires Kubb 5.14.6.

- [#1258](https://github.com/kubb-labs/plugins/pull/1258) [`e6b99b9`](https://github.com/kubb-labs/plugins/commit/e6b99b9ac8a0b965a881194b2ecc37f5921cfc38) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Prefix reserved-word operation names with `_` so generated functions and their references compile.

- [#1269](https://github.com/kubb-labs/plugins/pull/1269) [`5db0ea2`](https://github.com/kubb-labs/plugins/commit/5db0ea2a6dc675c9dbd5e82823ceafb1b30d4891) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Skip hooks for `text/event-stream` operations to avoid invalid `.unwrap()` calls. Use the generated streaming clients to consume Server-Sent Events.
- Updated dependencies [[`9d2d786`](https://github.com/kubb-labs/plugins/commit/9d2d786c59208fd9c80dbf303be70ff45649503d), [`cbcac52`](https://github.com/kubb-labs/plugins/commit/cbcac52e9e8f1b6fa65b871c68ea1d5a6b15f761), [`fa27169`](https://github.com/kubb-labs/plugins/commit/fa27169ee15653a3cfd58f89ec30028bb96eb54c), [`6c53ce3`](https://github.com/kubb-labs/plugins/commit/6c53ce350efbca1cfc0836a41e9d297b3f7ff1af), [`cc0a2af`](https://github.com/kubb-labs/plugins/commit/cc0a2af243030248e9735f180561b7bc0c60e6df), [`d6e69b2`](https://github.com/kubb-labs/plugins/commit/d6e69b2f098351924f53e9ea3f6d7ac5e3cca4a9), [`44bee8e`](https://github.com/kubb-labs/plugins/commit/44bee8e50f4f46935957e9b53614a789e402c8d0)]:
  - @kubb/plugin-ts@5.3.0

## 5.5.2

### Patch Changes

- [#1218](https://github.com/kubb-labs/plugins/pull/1218) [`1c2c7d6`](https://github.com/kubb-labs/plugins/commit/1c2c7d619203426749fcb31e9b910063d02ea436) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Require Kubb 5.13.1 or later.
- Updated dependencies [[`1c2c7d6`](https://github.com/kubb-labs/plugins/commit/1c2c7d619203426749fcb31e9b910063d02ea436), [`a117810`](https://github.com/kubb-labs/plugins/commit/a117810f9a7f5ec489bc842119f023e918565d83)]:
  - @kubb/plugin-ts@5.2.0

## 5.5.1

### Patch Changes

- [#1210](https://github.com/kubb-labs/plugins/pull/1210) [`0ecc416`](https://github.com/kubb-labs/plugins/commit/0ecc4169c2a5a5d36489c52e7c3d0daec12d6222) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Type clients, query hooks, and MCP handlers from `pluginZod({ inferred: 'codec' })` when it is set, so a custom codec param takes its domain value.
  
  - Types a codec param such as a `URL` with the value the encode schema accepts, instead of the wire `string`, also next to `pluginTs()`.
  - Types the decoded response, such as a `URL` or `bigint`, in `data`.
  - Makes `pluginTs()` optional for React Query, SWR, Vue Query, and MCP when `pluginZod({ inferred })` supplies the types.
  - Renames `inferred: 'direction'` to `inferred: 'codec'`. `'direction'` still works as a deprecated alias.

## 5.5.0

### Minor Changes

- [#1201](https://github.com/kubb-labs/plugins/pull/1201) [`c023c0f`](https://github.com/kubb-labs/plugins/commit/c023c0f3f801f5a6a1c0f8211b41f9b139a7ca4e) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Require Node.js 22.22 or newer, to match `kubb` and `@kubb/core`.

### Patch Changes

- Updated dependencies [[`c023c0f`](https://github.com/kubb-labs/plugins/commit/c023c0f3f801f5a6a1c0f8211b41f9b139a7ca4e), [`9f72b82`](https://github.com/kubb-labs/plugins/commit/9f72b82802e28766433316475dcffdee7916046a), [`726eb48`](https://github.com/kubb-labs/plugins/commit/726eb481716135048c03de79d264ae0472e563c6)]:
  - @kubb/plugin-ts@5.1.0

## 5.4.5

### Patch Changes

- [#1165](https://github.com/kubb-labs/plugins/pull/1165) [`5d76f27`](https://github.com/kubb-labs/plugins/commit/5d76f2736eabb43ab72b5b7cc6880d54f09e5712) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Studio can now edit more plugin options, because each `kubb-extension.json` lists them:
  
  - Every plugin: `output.banner` and `output.footer` as text.
  - `@kubb/plugin-axios` and `@kubb/plugin-fetch`: `returnType` and `throwOnErrorDefault`.
  - `@kubb/plugin-client`: `throwOnErrorDefault`.
  - `@kubb/plugin-faker`: `typeMode`.
  - `@kubb/plugin-zod`: `compile` and `typeGuards` as on or off.
  - `@kubb/plugin-react-query`: `customOptions.importPath` and `customOptions.name`.

- [#1171](https://github.com/kubb-labs/plugins/pull/1171) [`60cc33e`](https://github.com/kubb-labs/plugins/commit/60cc33e99e72bcf5408738d207434d25ebb6dbdb) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Cache the results of `camelCase` and `pascalCase`. A build resolves the same names many times, about 35,000 calls from `@kubb/plugin-ts` and `@kubb/plugin-zod` alone for a spec with 1,000 schemas, and each call ran four regular expressions. The cache holds up to 10,000 entries and then starts over.
- Updated dependencies [[`ccce85d`](https://github.com/kubb-labs/plugins/commit/ccce85d735d2ac92c42011d4bdf11431de12a7c1), [`5d76f27`](https://github.com/kubb-labs/plugins/commit/5d76f2736eabb43ab72b5b7cc6880d54f09e5712), [`07c62dd`](https://github.com/kubb-labs/plugins/commit/07c62dd57990afbfb12e0c937d446710fbcdc009), [`60cc33e`](https://github.com/kubb-labs/plugins/commit/60cc33e99e72bcf5408738d207434d25ebb6dbdb)]:
  - @kubb/plugin-ts@5.0.15

## 5.4.4

### Patch Changes

- [#1147](https://github.com/kubb-labs/plugins/pull/1147) [`3545fe6`](https://github.com/kubb-labs/plugins/commit/3545fe6c42e1524a5de5d35a653753153c136865) Thanks [@DesselBane](https://github.com/DesselBane)! - Export the default `queryKeyTransformer` and `mutationKeyTransformer` so a custom `queryKey` or `mutationKey` builder can extend the default key instead of copying it. `@kubb/plugin-vue-query` and `@kubb/plugin-react-query` also export the `Transformer` type now. Generated output is unchanged.
  
  ```ts
  import { queryKeyTransformer } from '@kubb/plugin-vue-query'
  
  pluginVueQuery({
    queryKey: (props) => [JSON.stringify(props.node.operationId), ...queryKeyTransformer(props)],
  })
  ```

## 5.4.3

### Patch Changes

- [#1139](https://github.com/kubb-labs/plugins/pull/1139) [`cd003f2`](https://github.com/kubb-labs/plugins/commit/cd003f29b011cc911f8946f9e7627b0ae460a414) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Require Node.js 22.12 or higher.
- Updated dependencies [[`cd003f2`](https://github.com/kubb-labs/plugins/commit/cd003f29b011cc911f8946f9e7627b0ae460a414)]:
  - @kubb/plugin-ts@5.0.14

## 5.4.2

### Patch Changes

- [#1135](https://github.com/kubb-labs/plugins/pull/1135) [`214b224`](https://github.com/kubb-labs/plugins/commit/214b224036c69c70cb6279e77b4379dc783eee19) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Ship separate CommonJS type declarations, so `require` consumers get correct types under `moduleResolution: node16` and `nodenext`.
  
  - Points the `require` condition at new `.d.cts` files. It used to reuse the ESM `.d.ts`, which TypeScript then read as ESM.
  - Removes the untyped `rolldown-runtime` import from the published declarations, which failed under `skipLibCheck: false`.
- Updated dependencies [[`214b224`](https://github.com/kubb-labs/plugins/commit/214b224036c69c70cb6279e77b4379dc783eee19)]:
  - @kubb/plugin-ts@5.0.13

## 5.4.1

### Patch Changes

- [#1131](https://github.com/kubb-labs/plugins/pull/1131) [`5c9ae77`](https://github.com/kubb-labs/plugins/commit/5c9ae772af531103fd2584cdac0475dbf9c7dea6) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Config mistakes now fail with a diagnostic code and a fix instead of a plugin crash. A client plugin without `pluginTs()` or `pluginZod({ inferred: true })` now fails instead of generating nothing.

- [#1122](https://github.com/kubb-labs/plugins/pull/1122) [`d333749`](https://github.com/kubb-labs/plugins/commit/d33374925860b5b3dfe0762eb4b3926c4f9fef59) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Internal restructure. Generated output is unchanged.

- [#1122](https://github.com/kubb-labs/plugins/pull/1122) [`be793ae`](https://github.com/kubb-labs/plugins/commit/be793ae1f9c73c3a3a6723733564c8f0cb2c0cf2) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Internal cleanup. Generated output is unchanged.
- Updated dependencies [[`d333749`](https://github.com/kubb-labs/plugins/commit/d33374925860b5b3dfe0762eb4b3926c4f9fef59), [`94dcb86`](https://github.com/kubb-labs/plugins/commit/94dcb86a6625f98305da7bbbd747ac36ff460673), [`be793ae`](https://github.com/kubb-labs/plugins/commit/be793ae1f9c73c3a3a6723733564c8f0cb2c0cf2)]:
  - @kubb/plugin-ts@5.0.12

## 5.4.0

### Minor Changes

- [#1106](https://github.com/kubb-labs/plugins/pull/1106) [`f88d584`](https://github.com/kubb-labs/plugins/commit/f88d5841d5108ad732bba1a6af8e9719d00ccca3) Thanks [@mohammad-naji7](https://github.com/mohammad-naji7)! - Support operations using the HTTP QUERY method (RFC 10008), which `@kubb/adapter-oas` parses from the OpenAPI 3.2 `query` field.
  
  - `@kubb/plugin-fetch` and `@kubb/plugin-axios`: `RequestConfig['method']` accepts `'QUERY'`.
  - `@kubb/plugin-react-query`, `@kubb/plugin-vue-query` and `@kubb/plugin-swr`: `query.methods` defaults to `['GET', 'QUERY']`, so a QUERY operation gets query hooks keyed by its body, like a GET.
  - `@kubb/plugin-msw`: MSW has no `http.query`, so a QUERY handler is registered with `http.all` and answers only QUERY requests, letting other methods on the same path pass through.

## 5.3.0

### Minor Changes

- [#1113](https://github.com/kubb-labs/plugins/pull/1113) [`6d660cc`](https://github.com/kubb-labs/plugins/commit/6d660cce26b29f80d6e86ad846b4252747dfdde2) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Accept `@kubb/plugin-client` as the client plugin. The `client` option now also takes `'client'`, a lone registered `@kubb/plugin-client` is auto-detected, and the generated hooks and handlers call its operations and import `RequestConfig` and `ResponseErrorConfig` from your `importPath` module.

## 5.2.6

### Patch Changes

- [#1098](https://github.com/kubb-labs/plugins/pull/1098) [`868dacd`](https://github.com/kubb-labs/plugins/commit/868dacd513fe7c3c92583a6b1df31d5ffc44a82e) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Type each plugin with `PluginType` from `kubb/kit`, the new name of `PluginFactoryOptions`.
- Updated dependencies [[`868dacd`](https://github.com/kubb-labs/plugins/commit/868dacd513fe7c3c92583a6b1df31d5ffc44a82e)]:
  - @kubb/plugin-ts@5.0.11

## 5.2.5

### Patch Changes

- [#1086](https://github.com/kubb-labs/plugins/pull/1086) [`02c4172`](https://github.com/kubb-labs/plugins/commit/02c41722a2872767579dc3b4784159e477962005) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Give each extension page on kubb.dev the same sections (Setup, Options worth knowing, and Example), and fix claims that did not match the code.
  
  - List the peer versions the generated code needs, such as `@tanstack/react-query` 5.82, `swr` 2.2, `@faker-js/faker` v10, and `cypress` v15 or v16.
  - Say that `validator: 'zod'` validates response bodies only, and that `{ request: 'zod', response: 'zod' }` also validates request bodies.
  - Say which React Query and Vue Query options need `hooks: true`.
  - Say that the MCP server starts through `startServer()` and that the generated `.mcp.json` runs `npx tsx`.

- [#1090](https://github.com/kubb-labs/plugins/pull/1090) [`49175c7`](https://github.com/kubb-labs/plugins/commit/49175c7449fd648a1d82327e07c7adc2c719a60f) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Raise the `swr` peer range from `^2.0.0` to `^2.2.0`. Generated mutation hooks type their options as `SWRMutationConfiguration<Data, Error, Key, Arg>`, the generic order SWR uses from 2.2.0. SWR 2.0.0 to 2.1.5 declare `<Data, Error, ExtraArg, Key>`, so the output failed to compile against them.
- Updated dependencies [[`02c4172`](https://github.com/kubb-labs/plugins/commit/02c41722a2872767579dc3b4784159e477962005)]:
  - @kubb/plugin-ts@5.0.10

## 5.2.4

### Patch Changes

- [#1077](https://github.com/kubb-labs/plugins/pull/1077) [`1d2a0f5`](https://github.com/kubb-labs/plugins/commit/1d2a0f5b5233dc362dd0d540341e6689dcd2a07e) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Define each plugin with `defineExtension` instead of the deprecated `definePlugin`. The plugins now require Kubb 5.8.3 or later.

- [#1081](https://github.com/kubb-labs/plugins/pull/1081) [`af4900a`](https://github.com/kubb-labs/plugins/commit/af4900aac3f7e19cc71977333c066d324ad6896a) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Ship the overview, options page, and how-to guides in a `docs/` folder instead of `OVERVIEW.md`.
- Updated dependencies [[`1d2a0f5`](https://github.com/kubb-labs/plugins/commit/1d2a0f5b5233dc362dd0d540341e6689dcd2a07e), [`af4900a`](https://github.com/kubb-labs/plugins/commit/af4900aac3f7e19cc71977333c066d324ad6896a)]:
  - @kubb/plugin-ts@5.0.9

## 5.2.3

### Patch Changes

- [#1071](https://github.com/kubb-labs/plugins/pull/1071) [`bd76f8f`](https://github.com/kubb-labs/plugins/commit/bd76f8fc5654770e1ca5c92f106e75ac0fa2c18d) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Ship `kubb-extension.json` and `OVERVIEW.md`. The plugin reads its `meta` from the manifest, and Kubb Studio renders its options from it.

- [#1074](https://github.com/kubb-labs/plugins/pull/1074) [`1739053`](https://github.com/kubb-labs/plugins/commit/173905355dda2835444ac080d7bbfba4085088cc) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Update Kubb to 5.8.1.
- Updated dependencies [[`bd76f8f`](https://github.com/kubb-labs/plugins/commit/bd76f8fc5654770e1ca5c92f106e75ac0fa2c18d), [`1739053`](https://github.com/kubb-labs/plugins/commit/173905355dda2835444ac080d7bbfba4085088cc)]:
  - @kubb/plugin-ts@5.0.8

## 5.2.2

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

## 5.2.1

### Patch Changes

- [#1063](https://github.com/kubb-labs/plugins/pull/1063) [`3276489`](https://github.com/kubb-labs/plugins/commit/3276489fa7fe2023707221671ed822bd4403a1c9) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Fail with a clear error on a missing required plugin or an invalid option value, instead of silently generating different output.
  
  - Require `@kubb/plugin-zod` in `@kubb/plugin-mcp`, and `@kubb/plugin-faker` in `@kubb/plugin-msw` when `parser: 'faker'` is set.
  - Require `@kubb/plugin-ts` in cypress, faker, mcp, msw, react-query, swr, and vue-query. A config without it now fails at setup instead of generating nothing.
  - Reject unknown `enum.type`, `syntaxType`, `arrayType`, and `optionalType` values in `@kubb/plugin-ts`, and an unknown `client` in react-query, vue-query, swr, and mcp.
  - Apply `coercion` in `@kubb/plugin-zod` when `mini: true` is set.
  - Keep an object factory's signature and body together in `@kubb/plugin-faker` output.
  - Correct the `baseURL` docs in msw, cypress, fetch, and axios, which claimed a fallback to the adapter's server URL that no plugin implements.
- Updated dependencies [[`3276489`](https://github.com/kubb-labs/plugins/commit/3276489fa7fe2023707221671ed822bd4403a1c9), [`e4f599f`](https://github.com/kubb-labs/plugins/commit/e4f599fb5f516054a8faa12873296f9245733da2), [`e0244ed`](https://github.com/kubb-labs/plugins/commit/e0244ed55ef48bb15e1fc6d356d9629355a7ac01)]:
  - @kubb/plugin-ts@5.0.6

## 5.2.0

### Minor Changes

- [#1016](https://github.com/kubb-labs/plugins/pull/1016) [`14794c0`](https://github.com/kubb-labs/plugins/commit/14794c00aef0280c98102c4c246f1555ae2d4c1b) Thanks [@xeoneux](https://github.com/xeoneux)! - Give infinite queries their own query key and tell custom `queryKey`/`mutationKey` builders which hook the key is for.
  
  - The default infinite query key adds `infinite: true` to its first segment. It previously equalled the plain query's key, so using both hooks for one request stored `InfiniteData` and the plain response under the same cache entry. Invalidating with the plain key still matches the infinite query.
  - `queryKey` and `mutationKey` receive `variant` (`'query'`, `'suspenseQuery'`, `'infiniteQuery'`, `'suspenseInfiniteQuery'` or `'mutation'`).

## 5.1.6

### Patch Changes

- [#1028](https://github.com/kubb-labs/plugins/pull/1028) [`c163489`](https://github.com/kubb-labs/plugins/commit/c1634894a264547489d41a57fd9b7078101536e6) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Update the supported Kubb version to 5.5.2.
- Updated dependencies [[`bbcfb10`](https://github.com/kubb-labs/plugins/commit/bbcfb108b91956edd27fc70932d4d8493a7a21c7), [`c163489`](https://github.com/kubb-labs/plugins/commit/c1634894a264547489d41a57fd9b7078101536e6)]:
  - @kubb/plugin-ts@5.0.4

## 5.1.5

### Patch Changes

- [#1011](https://github.com/kubb-labs/plugins/pull/1011) [`0621506`](https://github.com/kubb-labs/plugins/commit/0621506e03d13ff0b8112f5a089d2180a63f5ea6) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Require Kubb 5.4.2 or later in plugin peer dependencies.
- Updated dependencies [[`0621506`](https://github.com/kubb-labs/plugins/commit/0621506e03d13ff0b8112f5a089d2180a63f5ea6)]:
  - @kubb/plugin-ts@5.0.3

## 5.1.4

### Patch Changes

- [#1006](https://github.com/kubb-labs/plugins/pull/1006) [`65003ad`](https://github.com/kubb-labs/plugins/commit/65003ad59f58cc8765d122fdbf2915b3fc8a6bab) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Keep error response types out of SWR hook data types.

## 5.1.3

### Patch Changes

- [#959](https://github.com/kubb-labs/plugins/pull/959) [`9f83ed4`](https://github.com/kubb-labs/plugins/commit/9f83ed4ad7db35585b63aa9f7f88caa596a7de79) Thanks [@xeoneux](https://github.com/xeoneux)! - Honor the client plugin's per-operation `override`, `include`, and `exclude` when generating hooks and MCP handlers. A `pluginAxios` / `pluginFetch` `override` that changed `returnType`, `output`, or `group` for some operations was ignored by the dependents, which read the client plugin's global options instead. Their generated call body then no longer matched the `<op>` it called, for example a hook treating a full `RequestResult` as the response body. Operations the client plugin excludes are now skipped instead of importing an `<op>` that was never emitted.
  
  ```typescript
  pluginAxios({
    returnType: 'data',
    // Hooks for getPetById now call `.unwrap()` to match the full result this operation returns
    override: [{ type: 'operationId', pattern: 'getPetById', options: { returnType: 'full' } }],
  })
  ```

- [#975](https://github.com/kubb-labs/plugins/pull/975) [`24e0afa`](https://github.com/kubb-labs/plugins/commit/24e0afaf45602eadb43fc578c90735a9bfa9c099) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Allow mutation generation when query generation is disabled, keeping the `query` and `mutation` options independent.

## 5.1.2

### Patch Changes

- [#891](https://github.com/kubb-labs/plugins/pull/891) [`8be0c24`](https://github.com/kubb-labs/plugins/commit/8be0c24172b2ec28a20c8df80460eafb1bde8ad8) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Declare the generated code's runtime libraries as optional peer dependencies so package managers can report incompatible versions without installing unused libraries.

## 5.1.1

### Patch Changes

- [#869](https://github.com/kubb-labs/plugins/pull/869) [`7e936bc`](https://github.com/kubb-labs/plugins/commit/7e936bce055fa8f35de5d53e4354e7fd574b651d) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Add a `kubb.dev/sponsors` entry to each package's `funding` field, alongside the existing GitHub
  Sponsors and Open Collective links.
- Updated dependencies [[`1ba9310`](https://github.com/kubb-labs/plugins/commit/1ba9310cd1584b390b94aa53658adf955f79f8e4), [`7e936bc`](https://github.com/kubb-labs/plugins/commit/7e936bce055fa8f35de5d53e4354e7fd574b651d)]:
  - @kubb/plugin-ts@5.0.2

## 5.1.0

### Minor Changes

- [#818](https://github.com/kubb-labs/plugins/pull/818) [`353c2f1`](https://github.com/kubb-labs/plugins/commit/353c2f1165d47d5717df90e37fa054b41f8580d6) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Add a `returnType` option (`'full' | 'data'`, default `'full'`) to the standalone client
  functions and the class-based SDK. `'data'` resolves a call to the bare success body instead of
  the full `{ status, data, error, contentType, request, response }` result, once `throwOnError`
  (on by default) rules out the error branch.
  
  `plugin-react-query`, `plugin-vue-query`, and `plugin-swr` now read this option off the
  registered client plugin, so their generated hooks work with either setting instead of assuming
  the full result.

## 5.0.2

### Patch Changes

- [#835](https://github.com/kubb-labs/plugins/pull/835) [`0e791e1`](https://github.com/kubb-labs/plugins/commit/0e791e1b7c27ee6f75e8ee303dbb86b968bad38d) Thanks [@julian99m](https://github.com/julian99m)! - Explicit `types` fields for each package.json `exports` entry, so that it works with tsconfig.json `moduleResulotion: 'bundler'`
- Updated dependencies [[`0e791e1`](https://github.com/kubb-labs/plugins/commit/0e791e1b7c27ee6f75e8ee303dbb86b968bad38d)]:
  - @kubb/plugin-ts@5.0.1

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
