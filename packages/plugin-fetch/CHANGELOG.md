# @kubb/plugin-fetch

## 5.10.0

### Minor Changes

- [#1257](https://github.com/kubb-labs/plugins/pull/1257) [`d6e69b2`](https://github.com/kubb-labs/plugins/commit/d6e69b2f098351924f53e9ea3f6d7ac5e3cca4a9) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - A request body offered in several media types now pairs each body variant with its `contentType.request`. The first media type stays the default; any other variant must pass `contentType`, so sending the JSON body of a multipart-first operation as multipart is a type error.

### Patch Changes

- [#1268](https://github.com/kubb-labs/plugins/pull/1268) [`3b37a18`](https://github.com/kubb-labs/plugins/commit/3b37a18ce0bbe81939188b70c9e5e70f5d0d006d) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Encode HTTP Basic credentials as UTF-8 so non-ASCII usernames and passwords are sent correctly without throwing.

- [#1251](https://github.com/kubb-labs/plugins/pull/1251) [`4c5d703`](https://github.com/kubb-labs/plugins/commit/4c5d70327c9517c39ae16851f973ccf508d7a09e) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Generated clients now pass the `encoding` of a form or multipart request body as `styles.body`.

- [#1261](https://github.com/kubb-labs/plugins/pull/1261) [`324bd89`](https://github.com/kubb-labs/plugins/commit/324bd890ef0884c48d1d3ad15a6f38695f5651f0) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Serialize multipart and URL-encoded request bodies correctly when their media types use mixed case or uppercase.

- [#1259](https://github.com/kubb-labs/plugins/pull/1259) [`73b2ee4`](https://github.com/kubb-labs/plugins/commit/73b2ee42f4b4c6e04331237f2e17d81c299aa2fd) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Emit the declared request media type for JSON bodies and JSON-encode string bodies in the Fetch and Axios clients.

- [#1255](https://github.com/kubb-labs/plugins/pull/1255) [`970e6a1`](https://github.com/kubb-labs/plugins/commit/970e6a1d640f5c4e1872fe7fc8deb6434558756a) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Path parameter styles are keyed by the spec name of the parameter, so `style` and `explode` now apply to path parameters that are not camelCase, such as `pet_id` and `scope.id`.

- [#1258](https://github.com/kubb-labs/plugins/pull/1258) [`e6b99b9`](https://github.com/kubb-labs/plugins/commit/e6b99b9ac8a0b965a881194b2ecc37f5921cfc38) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Prefix reserved-word operation names with `_` so generated functions and their references compile.

- [#1266](https://github.com/kubb-labs/plugins/pull/1266) [`f9fd2b1`](https://github.com/kubb-labs/plugins/commit/f9fd2b141a9679988f1678c9cf9576a888b47c3e) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Serialize dates, nested objects, and arrays correctly in URL-encoded request bodies without encoding metadata, and omit null and undefined properties.
- Updated dependencies [[`cbcac52`](https://github.com/kubb-labs/plugins/commit/cbcac52e9e8f1b6fa65b871c68ea1d5a6b15f761), [`6c53ce3`](https://github.com/kubb-labs/plugins/commit/6c53ce350efbca1cfc0836a41e9d297b3f7ff1af), [`cc0a2af`](https://github.com/kubb-labs/plugins/commit/cc0a2af243030248e9735f180561b7bc0c60e6df), [`df86551`](https://github.com/kubb-labs/plugins/commit/df86551b33bac4aa83430cb4ff72c6f47bd090c2), [`d6e69b2`](https://github.com/kubb-labs/plugins/commit/d6e69b2f098351924f53e9ea3f6d7ac5e3cca4a9), [`44bee8e`](https://github.com/kubb-labs/plugins/commit/44bee8e50f4f46935957e9b53614a789e402c8d0), [`aa8b947`](https://github.com/kubb-labs/plugins/commit/aa8b947f15c459ff4d3068c5853e999b05fda7c9), [`754fac6`](https://github.com/kubb-labs/plugins/commit/754fac619734a3edcaea3fbd7b7fd07c1b34243a)]:
  - @kubb/plugin-ts@5.3.0
  - @kubb/plugin-zod@5.7.3

## 5.9.2

### Patch Changes

- [#1218](https://github.com/kubb-labs/plugins/pull/1218) [`1c2c7d6`](https://github.com/kubb-labs/plugins/commit/1c2c7d619203426749fcb31e9b910063d02ea436) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Require Kubb 5.13.1 or later.

- [#1215](https://github.com/kubb-labs/plugins/pull/1215) [`2b9ded7`](https://github.com/kubb-labs/plugins/commit/2b9ded7fe0682763abe8d507a4366209effa5e01) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Generate smaller fetch and Axios clients by simplifying response handling and interceptor bookkeeping.
- Updated dependencies [[`1c2c7d6`](https://github.com/kubb-labs/plugins/commit/1c2c7d619203426749fcb31e9b910063d02ea436), [`a117810`](https://github.com/kubb-labs/plugins/commit/a117810f9a7f5ec489bc842119f023e918565d83), [`16a4fb8`](https://github.com/kubb-labs/plugins/commit/16a4fb8712c41a5b86324509a3da81171876f43e)]:
  - @kubb/plugin-ts@5.2.0
  - @kubb/plugin-zod@5.7.2

## 5.9.1

### Patch Changes

- [#1210](https://github.com/kubb-labs/plugins/pull/1210) [`0ecc416`](https://github.com/kubb-labs/plugins/commit/0ecc4169c2a5a5d36489c52e7c3d0daec12d6222) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Type clients, query hooks, and MCP handlers from `pluginZod({ inferred: 'codec' })` when it is set, so a custom codec param takes its domain value.
  
  - Types a codec param such as a `URL` with the value the encode schema accepts, instead of the wire `string`, also next to `pluginTs()`.
  - Types the decoded response, such as a `URL` or `bigint`, in `data`.
  - Makes `pluginTs()` optional for React Query, SWR, Vue Query, and MCP when `pluginZod({ inferred })` supplies the types.
  - Renames `inferred: 'direction'` to `inferred: 'codec'`. `'direction'` still works as a deprecated alias.
- Updated dependencies [[`0ecc416`](https://github.com/kubb-labs/plugins/commit/0ecc4169c2a5a5d36489c52e7c3d0daec12d6222)]:
  - @kubb/plugin-zod@5.7.1

## 5.9.0

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

- [#1208](https://github.com/kubb-labs/plugins/pull/1208) [`01c618d`](https://github.com/kubb-labs/plugins/commit/01c618d6f5b0a090abfb834952ec3d7833481bd6) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Keep the headers of a `Headers` instance passed to `client.setConfig` or a call, which were dropped before.
- Updated dependencies [[`01c618d`](https://github.com/kubb-labs/plugins/commit/01c618d6f5b0a090abfb834952ec3d7833481bd6)]:
  - @kubb/plugin-zod@5.7.0

## 5.8.0

### Minor Changes

- [#1201](https://github.com/kubb-labs/plugins/pull/1201) [`c023c0f`](https://github.com/kubb-labs/plugins/commit/c023c0f3f801f5a6a1c0f8211b41f9b139a7ca4e) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Require Node.js 22.22 or newer, to match `kubb` and `@kubb/core`.

### Patch Changes

- Updated dependencies [[`c023c0f`](https://github.com/kubb-labs/plugins/commit/c023c0f3f801f5a6a1c0f8211b41f9b139a7ca4e), [`9f72b82`](https://github.com/kubb-labs/plugins/commit/9f72b82802e28766433316475dcffdee7916046a), [`726eb48`](https://github.com/kubb-labs/plugins/commit/726eb481716135048c03de79d264ae0472e563c6)]:
  - @kubb/plugin-ts@5.1.0
  - @kubb/plugin-zod@5.6.0

## 5.7.2

### Patch Changes

- [#1189](https://github.com/kubb-labs/plugins/pull/1189) [`1d40fdf`](https://github.com/kubb-labs/plugins/commit/1d40fdf183ada98abf02da0ad611a1c82e50fe69) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Remove the setup checks that threw `KUBB_INVALID_PLUGIN_OPTIONS` when an option such as `returnType`, `syntaxType`, or `parser` held a value outside its allowed list. The option types already reject those values. Checks that depend on another option, such as `sdk.mode: 'tag'` with single-file output, still throw.

- [#1182](https://github.com/kubb-labs/plugins/pull/1182) [`c56998c`](https://github.com/kubb-labs/plugins/commit/c56998ce224e496489fa9739132fd687fdfde2c7) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Send parameters described with `content: application/json` (or a `+json` media type) as one JSON-encoded value. A query parameter becomes `?filter=%7B%22status%22%3A%22open%22%7D` instead of the `deepObject` style, a cookie is JSON-encoded and URL-encoded, and a header carries the JSON string. The generated request passes the media type as `contentType` in `styles.query`, `styles.header`, and `styles.cookie`. Requires `@kubb/adapter-oas` with `ParameterNode.contentType` support.
- Updated dependencies [[`1d40fdf`](https://github.com/kubb-labs/plugins/commit/1d40fdf183ada98abf02da0ad611a1c82e50fe69), [`1d40fdf`](https://github.com/kubb-labs/plugins/commit/1d40fdf183ada98abf02da0ad611a1c82e50fe69), [`eb89e09`](https://github.com/kubb-labs/plugins/commit/eb89e0939f50d5cebc65a9b988a7f28baacf6324)]:
  - @kubb/plugin-ts@5.0.16
  - @kubb/plugin-zod@5.5.0

## 5.7.1

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

## 5.7.0

### Minor Changes

- [#1143](https://github.com/kubb-labs/plugins/pull/1143) [`4a2c7ad`](https://github.com/kubb-labs/plugins/commit/4a2c7adac45c328df5839bd98aa10fe03d923af1) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Export `defaultTransport` from the generated `.kubb/client.ts`.
  
  With `@kubb/plugin-fetch`, wrap it in a custom transport to add tracing or other behavior and keep the built-in `fetch` send and response parsing:
  
  ```ts
  import { client, defaultTransport } from './gen/.kubb/client'
  
  client.setConfig({
    transport: (request) => withSpan(request, () => defaultTransport(request)),
  })
  ```
  
  With `@kubb/plugin-axios`, `defaultTransport` is the `axios.create()` instance the default `client` sends through. Add axios interceptors or defaults to it directly. `createClientCore` accepts a matching `defaultTransport` option.

## 5.6.5

### Patch Changes

- [#1124](https://github.com/kubb-labs/plugins/pull/1124) [`d7faeeb`](https://github.com/kubb-labs/plugins/commit/d7faeeb2771132e3cee2c5b17076d95b0a432d62) Thanks [@mohammad-naji7](https://github.com/mohammad-naji7)! - Emit `allowReserved` for query parameters in the generated `styles`, so the runtime keeps reserved characters in those values unencoded.

## 5.6.4

### Patch Changes

- [#1139](https://github.com/kubb-labs/plugins/pull/1139) [`cd003f2`](https://github.com/kubb-labs/plugins/commit/cd003f29b011cc911f8946f9e7627b0ae460a414) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Require Node.js 22.12 or higher.
- Updated dependencies [[`cd003f2`](https://github.com/kubb-labs/plugins/commit/cd003f29b011cc911f8946f9e7627b0ae460a414)]:
  - @kubb/plugin-ts@5.0.14
  - @kubb/plugin-zod@5.4.12

## 5.6.3

### Patch Changes

- [#1135](https://github.com/kubb-labs/plugins/pull/1135) [`214b224`](https://github.com/kubb-labs/plugins/commit/214b224036c69c70cb6279e77b4379dc783eee19) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Ship separate CommonJS type declarations, so `require` consumers get correct types under `moduleResolution: node16` and `nodenext`.
  
  - Points the `require` condition at new `.d.cts` files. It used to reuse the ESM `.d.ts`, which TypeScript then read as ESM.
  - Removes the untyped `rolldown-runtime` import from the published declarations, which failed under `skipLibCheck: false`.
- Updated dependencies [[`214b224`](https://github.com/kubb-labs/plugins/commit/214b224036c69c70cb6279e77b4379dc783eee19)]:
  - @kubb/plugin-ts@5.0.13
  - @kubb/plugin-zod@5.4.11

## 5.6.2

### Patch Changes

- [#1131](https://github.com/kubb-labs/plugins/pull/1131) [`5c9ae77`](https://github.com/kubb-labs/plugins/commit/5c9ae772af531103fd2584cdac0475dbf9c7dea6) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Config mistakes now fail with a diagnostic code and a fix instead of a plugin crash. A client plugin without `pluginTs()` or `pluginZod({ inferred: true })` now fails instead of generating nothing.
- Updated dependencies [[`5c9ae77`](https://github.com/kubb-labs/plugins/commit/5c9ae772af531103fd2584cdac0475dbf9c7dea6), [`d333749`](https://github.com/kubb-labs/plugins/commit/d33374925860b5b3dfe0762eb4b3926c4f9fef59), [`94dcb86`](https://github.com/kubb-labs/plugins/commit/94dcb86a6625f98305da7bbbd747ac36ff460673), [`be793ae`](https://github.com/kubb-labs/plugins/commit/be793ae1f9c73c3a3a6723733564c8f0cb2c0cf2), [`e69f6db`](https://github.com/kubb-labs/plugins/commit/e69f6db78c460f5cf1abe25acd560c3e00901485)]:
  - @kubb/plugin-zod@5.4.10
  - @kubb/plugin-ts@5.0.12

## 5.6.1

### Patch Changes

- [#1118](https://github.com/kubb-labs/plugins/pull/1118) [`d056634`](https://github.com/kubb-labs/plugins/commit/d056634db6914ae014b2773c1ad776f431d3e948) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Ship declaration files for the templates so importing their types from `@kubb/plugin-fetch/templates/*` and `@kubb/plugin-axios/templates/*` no longer requires `allowImportingTsExtensions`.

## 5.6.0

### Minor Changes

- [#1106](https://github.com/kubb-labs/plugins/pull/1106) [`f88d584`](https://github.com/kubb-labs/plugins/commit/f88d5841d5108ad732bba1a6af8e9719d00ccca3) Thanks [@mohammad-naji7](https://github.com/mohammad-naji7)! - Support operations using the HTTP QUERY method (RFC 10008), which `@kubb/adapter-oas` parses from the OpenAPI 3.2 `query` field.
  
  - `@kubb/plugin-fetch` and `@kubb/plugin-axios`: `RequestConfig['method']` accepts `'QUERY'`.
  - `@kubb/plugin-react-query`, `@kubb/plugin-vue-query` and `@kubb/plugin-swr`: `query.methods` defaults to `['GET', 'QUERY']`, so a QUERY operation gets query hooks keyed by its body, like a GET.
  - `@kubb/plugin-msw`: MSW has no `http.query`, so a QUERY handler is registered with `http.all` and answers only QUERY requests, letting other methods on the same path pass through.

## 5.5.12

### Patch Changes

- [#1095](https://github.com/kubb-labs/plugins/pull/1095) [`f8aae34`](https://github.com/kubb-labs/plugins/commit/f8aae34f33f34a21d88bf53f18fc42a2657fefea) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Remove the "See also" sections from the guides. Each guide links what it needs inline.

- [#1093](https://github.com/kubb-labs/plugins/pull/1093) [`6dff4fe`](https://github.com/kubb-labs/plugins/commit/6dff4fe783ae851205baa226cb411bf4cbccceba) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - List `optionalDependencies` in `kubb-extension.json`.

- [#1098](https://github.com/kubb-labs/plugins/pull/1098) [`868dacd`](https://github.com/kubb-labs/plugins/commit/868dacd513fe7c3c92583a6b1df31d5ffc44a82e) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Type each plugin with `PluginType` from `kubb/kit`, the new name of `PluginFactoryOptions`.
- Updated dependencies [[`868dacd`](https://github.com/kubb-labs/plugins/commit/868dacd513fe7c3c92583a6b1df31d5ffc44a82e)]:
  - @kubb/plugin-ts@5.0.11
  - @kubb/plugin-zod@5.4.9

## 5.5.11

### Patch Changes

- [#1091](https://github.com/kubb-labs/plugins/pull/1091) [`b4a1d46`](https://github.com/kubb-labs/plugins/commit/b4a1d467288d653d58f77eaee872c76831a4487d) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Remove the `comments` option from the options docs. Neither plugin has this option.

- [#1086](https://github.com/kubb-labs/plugins/pull/1086) [`02c4172`](https://github.com/kubb-labs/plugins/commit/02c41722a2872767579dc3b4784159e477962005) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Give each extension page on kubb.dev the same sections (Setup, Options worth knowing, and Example), and fix claims that did not match the code.
  
  - List the peer versions the generated code needs, such as `@tanstack/react-query` 5.82, `swr` 2.2, `@faker-js/faker` v10, and `cypress` v15 or v16.
  - Say that `validator: 'zod'` validates response bodies only, and that `{ request: 'zod', response: 'zod' }` also validates request bodies.
  - Say which React Query and Vue Query options need `hooks: true`.
  - Say that the MCP server starts through `startServer()` and that the generated `.mcp.json` runs `npx tsx`.
- Updated dependencies [[`02c4172`](https://github.com/kubb-labs/plugins/commit/02c41722a2872767579dc3b4784159e477962005)]:
  - @kubb/plugin-ts@5.0.10
  - @kubb/plugin-zod@5.4.8

## 5.5.10

### Patch Changes

- [#1077](https://github.com/kubb-labs/plugins/pull/1077) [`1d2a0f5`](https://github.com/kubb-labs/plugins/commit/1d2a0f5b5233dc362dd0d540341e6689dcd2a07e) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Define each plugin with `defineExtension` instead of the deprecated `definePlugin`. The plugins now require Kubb 5.8.3 or later.

- [#1081](https://github.com/kubb-labs/plugins/pull/1081) [`af4900a`](https://github.com/kubb-labs/plugins/commit/af4900aac3f7e19cc71977333c066d324ad6896a) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Ship the overview, options page, and how-to guides in a `docs/` folder instead of `OVERVIEW.md`.
- Updated dependencies [[`1d2a0f5`](https://github.com/kubb-labs/plugins/commit/1d2a0f5b5233dc362dd0d540341e6689dcd2a07e), [`af4900a`](https://github.com/kubb-labs/plugins/commit/af4900aac3f7e19cc71977333c066d324ad6896a)]:
  - @kubb/plugin-ts@5.0.9
  - @kubb/plugin-zod@5.4.7

## 5.5.9

### Patch Changes

- [#1071](https://github.com/kubb-labs/plugins/pull/1071) [`bd76f8f`](https://github.com/kubb-labs/plugins/commit/bd76f8fc5654770e1ca5c92f106e75ac0fa2c18d) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Ship `kubb-extension.json` and `OVERVIEW.md`. The plugin reads its `meta` from the manifest, and Kubb Studio renders its options from it.

- [#1074](https://github.com/kubb-labs/plugins/pull/1074) [`1739053`](https://github.com/kubb-labs/plugins/commit/173905355dda2835444ac080d7bbfba4085088cc) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Update Kubb to 5.8.1.
- Updated dependencies [[`bd76f8f`](https://github.com/kubb-labs/plugins/commit/bd76f8fc5654770e1ca5c92f106e75ac0fa2c18d), [`1739053`](https://github.com/kubb-labs/plugins/commit/173905355dda2835444ac080d7bbfba4085088cc)]:
  - @kubb/plugin-ts@5.0.8
  - @kubb/plugin-zod@5.4.6

## 5.5.8

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

## 5.5.7

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

## 5.5.6

### Patch Changes

- [#1041](https://github.com/kubb-labs/plugins/pull/1041) [`a6ec11d`](https://github.com/kubb-labs/plugins/commit/a6ec11db92a62f89655713ed449e62c6361d86e1) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Keep the request `contentType` in generated SDK methods when `sdk.mode` is `'tag'`, so operations with a non-JSON request body such as `application/x-www-form-urlencoded` send the right content type.

## 5.5.5

### Patch Changes

- [#1003](https://github.com/kubb-labs/plugins/pull/1003) [`baa54fd`](https://github.com/kubb-labs/plugins/commit/baa54fdf99e839b0cf16c6518a45a30f208f5d40) Thanks [@georgialoper](https://github.com/georgialoper)! - Honor client-level fetch credentials when resolving requests.
- Updated dependencies [[`1b41106`](https://github.com/kubb-labs/plugins/commit/1b41106399e76d9b1f14bd7ec80da8f461dfe9c1)]:
  - @kubb/plugin-ts@5.0.5

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

### Patch Changes

- [#961](https://github.com/kubb-labs/plugins/pull/961) [`f4d6f5e`](https://github.com/kubb-labs/plugins/commit/f4d6f5ea2202a82b25c5b9d060e0fc91307944ed) Thanks [@xeoneux](https://github.com/xeoneux)! - `ResponseError` names the request in its message and gains a `ResponseError.is` guard.
  
  The message was only `Request failed with status 500`, so logs and test failures that print `error.message` could not tell which call failed. It now reads `GET https://api.example.com/pet/1 failed with status 404 Not Found`. The query string is left out, since an API key can be sent as a query parameter. A `ResponseError` constructed directly without `method` / `url` keeps the old message.
  
  Every generated client bundles its own `ResponseError`, so `instanceof` fails for an error thrown by another client in the same app. `ResponseError.is(error)` matches on `name` instead:
  
  ```typescript
  if (ResponseError.is(error) && error.status === 404) {
    // works for errors from any Kubb-generated client
  }
  ```

- [#978](https://github.com/kubb-labs/plugins/pull/978) [`21bd9a6`](https://github.com/kubb-labs/plugins/commit/21bd9a6d037a98d7225a018809e3ebcc99c8893a) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Fix `sdk.mode: 'tag'` silently collapsing every tag into one class when `output.mode: 'file'`. The generator now throws `KUBB_INVALID_PLUGIN_OPTIONS` instead of merging every tag's operations into whichever controller is built first.
  
  Set `sdk.mode: 'flat'` to emit one class into that file, or give `output.path` an extensionless directory name (or set `output.mode: 'directory'` explicitly) so each tag gets its own file.
- Updated dependencies [[`adaf6c6`](https://github.com/kubb-labs/plugins/commit/adaf6c6674ba309224e01c4c9917ab847b9cc429), [`20cc521`](https://github.com/kubb-labs/plugins/commit/20cc521cc019e9fc501103b0d240856197d9bf18)]:
  - @kubb/plugin-zod@5.4.0

## 5.5.1

### Patch Changes

- [#952](https://github.com/kubb-labs/plugins/pull/952) [`a1593ce`](https://github.com/kubb-labs/plugins/commit/a1593ce7d307d63bd2e424e1df790fe41db46bf2) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Emit `.kubb/client.ts` with `copy`, so the parser's `extension` option now reaches the runtime imports through the parser `copy` hook added in kubb 5.3.15, instead of a regex over the template. The generated runtime header follows the same import order as other generated files.

## 5.5.0

### Minor Changes

- [#941](https://github.com/kubb-labs/plugins/pull/941) [`dd521c1`](https://github.com/kubb-labs/plugins/commit/dd521c12d69e5ee35268ea010f60961881a93c2b) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Set generated Fetch and Axios operations' error behavior and return types together with `throwOnErrorDefault`.
  Copied Fetch and Axios runtimes now follow the TypeScript parser's import extension setting, including `.ts` for Node's native TypeScript execution.
  
  ```typescript
  pluginFetch({ throwOnErrorDefault: false })
  // or pluginAxios({ throwOnErrorDefault: false })
  
  const result = await getPetById({ path: { petId: 1 } })
  if (result.error) console.error(result.error)
  ```

## 5.4.2

### Patch Changes

- [#935](https://github.com/kubb-labs/plugins/pull/935) [`7215b46`](https://github.com/kubb-labs/plugins/commit/7215b465664eb082a936b0cb6564e3c2f8197c5c) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Pass each call's `RequestConfig` to client interceptors and apply the configured TypeScript parser extension to runtime imports.

## 5.4.1

### Patch Changes

- [#888](https://github.com/kubb-labs/plugins/pull/888) [`a892c1e`](https://github.com/kubb-labs/plugins/commit/a892c1eb1434c7165f02efe1002fb62a56a6781c) Thanks [@ghettoDdOS](https://github.com/ghettoDdOS)! - `RequestConfig`'s `path`, `headers`, and `cookies` fields no longer require an index signature.
  With `pluginTs({ syntaxType: 'interface' })`, the generated per-operation `Path`/`Headers`/
  `Cookies` types are `interface`s, which TypeScript never gives an implicit index signature (unlike
  a `type` alias), so passing one to the generated client failed to typecheck (`TS2345`). These
  fields now accept `unknown`, the same treatment `query` already had.

## 5.4.0

### Minor Changes

- [#879](https://github.com/kubb-labs/plugins/pull/879) [`9e292cb`](https://github.com/kubb-labs/plugins/commit/9e292cb1509fb1ba4485edfc10f6f316e75e52a4) Thanks [@rajp33](https://github.com/rajp33)! - Add `onValidationError` to `ClientConfig` and `RequestConfig`, so a body that fails its schema no longer has to throw. The handler receives the `ParseError` plus the failing `value` and the call's `direction` / `method` / `url` / `status`; returning nothing rethrows (the default, unchanged), and returning `{ value }` resolves the call with that value instead. This makes it possible to report a drifted response to your error tracker and still render the page.

### Patch Changes

- [#869](https://github.com/kubb-labs/plugins/pull/869) [`7e936bc`](https://github.com/kubb-labs/plugins/commit/7e936bce055fa8f35de5d53e4354e7fd574b651d) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Add a `kubb.dev/sponsors` entry to each package's `funding` field, alongside the existing GitHub
  Sponsors and Open Collective links.
- Updated dependencies [[`1ba9310`](https://github.com/kubb-labs/plugins/commit/1ba9310cd1584b390b94aa53658adf955f79f8e4), [`7e936bc`](https://github.com/kubb-labs/plugins/commit/7e936bce055fa8f35de5d53e4354e7fd574b651d)]:
  - @kubb/plugin-ts@5.0.2
  - @kubb/plugin-zod@5.1.5

## 5.3.0

### Minor Changes

- [#818](https://github.com/kubb-labs/plugins/pull/818) [`353c2f1`](https://github.com/kubb-labs/plugins/commit/353c2f1165d47d5717df90e37fa054b41f8580d6) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Add a `returnType` option (`'full' | 'data'`, default `'full'`) to the standalone client
  functions and the class-based SDK. `'data'` resolves a call to the bare success body instead of
  the full `{ status, data, error, contentType, request, response }` result, once `throwOnError`
  (on by default) rules out the error branch.
  
  `plugin-react-query`, `plugin-vue-query`, and `plugin-swr` now read this option off the
  registered client plugin, so their generated hooks work with either setting instead of assuming
  the full result.

## 5.2.2

### Patch Changes

- [#839](https://github.com/kubb-labs/plugins/pull/839) [`eddfd39`](https://github.com/kubb-labs/plugins/commit/eddfd39bb78ce48bb7e02e5b50eba82f61919c15) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Fix the generated client failing to type-check in Node-only projects (`@types/node` without the `dom` lib). The generated `.kubb/client.ts` and `.kubb/serializers.ts` no longer reference the global `BodyInit` name, which such a project never declares. They now use a local `RequestBody` type derived from `RequestInit['body']`.

## 5.2.1

### Patch Changes

- [#835](https://github.com/kubb-labs/plugins/pull/835) [`0e791e1`](https://github.com/kubb-labs/plugins/commit/0e791e1b7c27ee6f75e8ee303dbb86b968bad38d) Thanks [@julian99m](https://github.com/julian99m)! - Explicit `types` fields for each package.json `exports` entry, so that it works with tsconfig.json `moduleResulotion: 'bundler'`
- Updated dependencies [[`0e791e1`](https://github.com/kubb-labs/plugins/commit/0e791e1b7c27ee6f75e8ee303dbb86b968bad38d)]:
  - @kubb/plugin-ts@5.0.1
  - @kubb/plugin-zod@5.1.3

## 5.2.0

### Minor Changes

- [#820](https://github.com/kubb-labs/plugins/pull/820) [`15b789f`](https://github.com/kubb-labs/plugins/commit/15b789fb8a3b8933df5d2415888f0c4d44640a1b) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Generated calls now return a promise with an extra `unwrap()` method. Calling it gives you the bare
  success body, or rejects with `error` when the call was made with `throwOnError: false`.
  
  ```ts
  const { data, error } = await getPetById({ path: { petId: 1 } })
  const pet = await getPetById({ path: { petId: 1 } }).unwrap()
  ```
  
  Awaiting the call directly still gives the full result, so nothing existing changes.
  
  `plugin-react-query`, `plugin-vue-query`, and `plugin-swr` now build their generated query and
  mutation bodies on top of `unwrap()` too, instead of destructuring the result by hand.

## 5.1.2

### Patch Changes

- [#814](https://github.com/kubb-labs/plugins/pull/814) [`8223e64`](https://github.com/kubb-labs/plugins/commit/8223e64ccac5ecbfb145e3f62d81e1d072b55eca) Thanks [@julian99m](https://github.com/julian99m)! - Changed client template to comply with TypeScript's `noPropertyAccessFromIndexSignature` rule

## 5.1.1

### Patch Changes

- [#800](https://github.com/kubb-labs/plugins/pull/800) [`fc33804`](https://github.com/kubb-labs/plugins/commit/fc338044a0865bdb26fc2449d8b09d6abe82a399) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - A request body containing a `format: int64` field threw `TypeError: Do not know how to serialize a BigInt` before the call left the client, because `defaultBodySerializer` passed the body to a bare `JSON.stringify`. Bigints now serialize as JSON numbers.
  
  A value past `Number.MAX_SAFE_INTEGER` still throws, now with a message naming the cause, rather than going out silently truncated. Register a `serializer.body` or a per-content-type codec to send those.
- Updated dependencies [[`bb127d6`](https://github.com/kubb-labs/plugins/commit/bb127d69e996aa9117062129ccae1910706514ad), [`4f97e63`](https://github.com/kubb-labs/plugins/commit/4f97e632b6d3bcb215b95d1c62a1ee9349d762f6)]:
  - @kubb/plugin-zod@5.1.1

## 5.1.0

### Minor Changes

- [#789](https://github.com/kubb-labs/plugins/pull/789) [`86eb5b4`](https://github.com/kubb-labs/plugins/commit/86eb5b4289f8b8857850e76b00d698ef644f4015) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Source operation types from `pluginZod({ inferred: true })` when `pluginTs` is not in the pipeline. `pluginFetch` and `pluginAxios` previously generated nothing for an operation without `pluginTs`, since both generators looked up its `Options` and `Responses` types unconditionally. They now fall back to the zod plugin's inferred types, so a client built on zod codecs is typed by what the codecs decode to (a `Temporal` instance, a `Date`) instead of the raw wire type:
  
  ```ts
  export default defineConfig({
    input: './petStore.yaml',
    output: { path: './src/gen' },
    plugins: [
      pluginZod({ inferred: true, output: { path: 'schemas', mode: 'directory' } }),
      pluginFetch({ validator: 'zod', output: { path: 'fetcher.ts' } }),
    ],
  })
  ```
  
  `pluginTs` still wins whenever it is present, so existing configs generate the same types as before. To support this, `pluginZod({ inferred: true })` now also emits the per-status `<operation>ResponsesSchema` and its inferred type, alongside the `<operation>OptionsSchema` it already emitted. Both are built from the same shared schemas as the `plugin-ts` equivalents, so the two paths stay in lockstep.

### Patch Changes

- Updated dependencies [[`86eb5b4`](https://github.com/kubb-labs/plugins/commit/86eb5b4289f8b8857850e76b00d698ef644f4015)]:
  - @kubb/plugin-zod@5.1.0

## 5.0.1

### Patch Changes

- [#779](https://github.com/kubb-labs/plugins/pull/779) [`5a4db35`](https://github.com/kubb-labs/plugins/commit/5a4db35ed57ceb08e28b9ceb79e612431da2d9c4) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Fix the generated `client.ts` importing `./standardSchema.ts` with a `.ts` extension while every other sibling import (`./serializers`) omits it.
  
  Under `"moduleResolution": "nodenext"` an extensioned relative specifier is resolved as CommonJS even in an ESM package, which TypeScript 6 now rejects when the rest of the config expects ESM resolution. Dropping the extension makes the import consistent with the other generated files and compiles under `nodenext`.
  
  ```ts
  // before
  import { type StandardSchemaValidator, validateStandardSchema } from './standardSchema.ts'
  
  // after
  import { type StandardSchemaValidator, validateStandardSchema } from './standardSchema'
  ```
  
  Only the import specifier changes, so regenerating produces a one-line diff in existing `client.ts` files without any behavior change.

- [#779](https://github.com/kubb-labs/plugins/pull/779) [`5a4db35`](https://github.com/kubb-labs/plugins/commit/5a4db35ed57ceb08e28b9ceb79e612431da2d9c4) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Fix `validateStandardSchema` failing to typecheck in the generated `standardSchema.ts` when a consumer's `tsconfig.json` sets `"strict": false`.
  
  The function narrowed `StandardSchemaResult` by checking `if (result.issues)` and then read `result.value` on the remaining branch. That narrowing depends on `strictNullChecks`: with `strict: false`, TypeScript keeps treating `result` as the full union after the check, and `value` isn't a property shared by both union members, so the read fails to compile.
  
  ```ts
  // before
  return result.value as TOutput
  
  // after
  return (result as { value: TOutput }).value
  ```
  
  Only the generated `standardSchema.ts` changes, so regenerating produces a one-line diff in existing output without any behavior change.

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

### Minor Changes

- Serialize path, query, header, and cookie parameters plus urlencoded bodies by their `style` / `explode`, and fix array and object path params rendering as `[object Object]`. The generator reads each parameter's `style` / `explode` straight from the OpenAPI document and emits it on the call, so the right serialization applies without extra configuration (needs `@kubb/core` 5.0.0-beta.76 or later).
  
  ```ts
  defaultPathSerializer({ name: 'id', value: [3, 4, 5] }) // '3,4,5'
  defaultPathSerializer({ name: 'id', value: [3, 4, 5], options: { style: 'matrix', explode: true } }) // ';id=3;id=4;id=5'
  defaultQuerySerializer({ id: [3, 4, 5] }, { id: { style: 'pipeDelimited', explode: false } }) // 'id=3|4|5'
  serializeCookies({ ids: [1, 2] }) // 'ids=1,2'
  ```
  
  A request carries the per-parameter metadata under one `serialization` object (`{ path, query, header, cookie, body }`), pairing with the `serializer` option (the functions). Params without metadata keep the previous defaults, so existing output is unchanged.
  
  The default serializers now live in their own `.kubb/serializers.ts`, emitted next to `.kubb/client.ts`, which imports them. Override a serializer through the `serializer` option as before.
  
  Breaking: `querySerializer` and `bodySerializer` move under one `serializer` object.
  
  ```ts
  - client({ querySerializer, bodySerializer })
  + client({ serializer: { query: querySerializer, body: bodySerializer, path: pathSerializer } })
  ```

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

- Add `@kubb/plugin-fetch`, an HTTP client plugin pinned to the Fetch API. Each operation becomes one async function that takes a single grouped `options` object and returns the shared `RequestResult` contract, with a per-call `throwOnError` flag (default `true`):
  
  - `throwOnError: true` (default): a non-2xx status throws `ResponseError` and `data` is always defined.
  - `throwOnError: false`: errors are returned as values, discriminated by `error`.
  
  The runtime is always bundled into `.kubb/client.ts`, so generated code never imports from `@kubb/plugin-fetch` and the only runtime dependency is the global `fetch`. A default `client` and a `createClient` factory are exported from the generated output. Swap or extend the transport through the client config (`client.setConfig({ transport })`).
  
  Options: `output`, `group`, `include`/`exclude`/`override`, `baseURL`, `validator` (zod, success bodies only), and `macros`.

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

- Discriminate the `RequestResult` contract by a top-level `status`.
  
  A resolved call now carries its numeric HTTP status as `result.status`, and the result is a union of one variant per documented status. Switching on `result.status` narrows `data` and `error` to that status' payload, so an operation that documents more than one success body (200 vs 201) or several error bodies (400 vs 404) can be handled at the call site:
  
  ```ts
  const result = await getPetById({ path: { petId: 1 }, throwOnError: false })
  switch (result.status) {
    case 200:
      result.data // GetPetByIdStatus200
      break
    case 404:
      result.error // GetPetByIdStatus404
      break
  }
  ```
  
  The change is additive. `data`, `error`, `request`, and `response` keep their shapes, `if (result.error)` still splits success from failure, and `result.status` falls back to `number` for an operation with no documented responses. With `throwOnError` (the default) the result stays the union of the 2xx variants and `error` is `undefined`. The query plugins built on `plugin-fetch` / `plugin-axios` gain the same narrowing.

- Support Server-Sent Events (`text/event-stream`) responses in the generated client.
  
  An operation whose primary success response is `text/event-stream` now generates a function that returns a typed event stream instead of a one-shot result. Both the fetch and axios clients share the same syntax:
  
  ```ts
  const { stream } = await streamEvents({ ...options })
  
  for await (const event of stream) {
    console.log(event.data) // typed from the operation's event schema, JSON-parsed when it is JSON
  }
  ```
  
  Under the hood the call sets `responseType: 'stream'` and the runtime exposes `parseEventStream`, `toEventStream`, `EventStreamResult`, and `ServerSentEvent`. The parser handles the SSE wire format (`data:`, `event:`, `id:`, `retry:`), concatenates multi-line `data`, ignores comment and heartbeat lines, normalizes CRLF, keeps non-JSON `data` as a string, and stops when an `AbortSignal` aborts. It reads a web `ReadableStream` (fetch) or any async iterable of byte chunks (the axios stream response).
  
  For the axios client, stream requests default to the fetch adapter so the body arrives as a `ReadableStream` in the browser too, not just in Node. An explicit `adapter` is left untouched.
  
  Non-streaming operations are unchanged. Requires `@kubb/adapter-oas` and `@kubb/ast` with response `content` support.

- The `parser` option is renamed to `validator` across the client and query plugins. Set `validator: 'zod'` (or `{ request: 'zod', response: 'zod' }`) where you previously set `parser`. The accepted values are unchanged.
  
  Generated clients pass the schema straight to the `validator` slot instead of wrapping it in a `.parse(data)` call. The slot takes a Standard Schema validator, and only `client.ts` calls `validateStandardSchema`, so the helper stays in one place instead of being imported into every operation file.
  
  A `validateStandardSchema` helper is injected into `.kubb/standardSchema.ts` next to the client. It handles sync and async `validate()` results and throws `ParseError({ issues })` on failure, so callers get a consistent `{ issues }` array instead of a raw `ZodError`. Any schema that exposes `~standard.validate` works, including zod, valibot, and arktype.
  
  Error-body validation now runs on the throwing path too. `validator.error` executes before `ResponseError` is constructed, so `error.data` always holds the validated body regardless of the `throwOnError` setting.

### Patch Changes

- [#731](https://github.com/kubb-labs/plugins/pull/731) [`8bf93a5`](https://github.com/kubb-labs/plugins/commit/8bf93a5dd7728694c47cb142a35d073b69d770d9) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Cache a dependency plugin's resolved name and file per operation node, reported in kubb-labs/kubb#3813.
  
  A dependent used to call `driver.getResolver(dep)` and re-resolve the dependency's name and path for every node. `plugin-react-query`'s query, mutation, and infinite-query generators each recomputed `plugin-ts`'s and the contract client's file for the same operation, and `plugin-swr`, `plugin-vue-query`, `plugin-mcp`, `plugin-msw`, `plugin-faker`, and `plugin-cypress` each recomputed `plugin-ts`'s file independently.
  
  `resolveClientOperation` and the new `resolveDependencyOperationFile` helper now read and write the current node's shared cache (`ctx.cache`, from kubb-labs/kubb#3812), so the first plugin that resolves a dependency for a node computes it once and every other plugin generating from that same node reuses the result. The contract client's own generator (`plugin-fetch`/`plugin-axios`) populates the cache first, so its dependents usually hit it directly. Generated output is unchanged.

- [#486](https://github.com/kubb-labs/plugins/pull/486) [`fcb28c1`](https://github.com/kubb-labs/plugins/commit/fcb28c13595d74520bacb526685129350d3bc185) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Inline the option defaults in each client plugin instead of sharing a `resolveOptions` helper, matching how `@kubb/plugin-ts` and `@kubb/plugin-zod` resolve their options. Generated output is unchanged.

- [#640](https://github.com/kubb-labs/plugins/pull/640) [`22f1221`](https://github.com/kubb-labs/plugins/commit/22f122170dc2330e788d54e9c2278c03f867cfb8) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Drop the unused internal utils devDependency flagged by knip. None of these packages import from it, they use the shared internals package, `ast`, or their own `utils.ts` instead. Runtime behavior is unchanged.
- Updated dependencies [[`92482b1`](https://github.com/kubb-labs/plugins/commit/92482b1ee0a0b70c2bc0293f5d3d8dbd5519af75), [`451f3b7`](https://github.com/kubb-labs/plugins/commit/451f3b7a24eb95fb4881bee8de59839e81686386), [`7bf4c87`](https://github.com/kubb-labs/plugins/commit/7bf4c87304143708f7c7619b4af5013f40fb81cf)]:
  - @kubb/plugin-ts@5.0.0
  - @kubb/plugin-zod@5.0.0
