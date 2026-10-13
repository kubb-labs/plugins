# @kubb/plugin-client

## 5.5.10

### Patch Changes

- [#1093](https://github.com/kubb-labs/plugins/pull/1093) [`6dff4fe`](https://github.com/kubb-labs/plugins/commit/6dff4fe783ae851205baa226cb411bf4cbccceba) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - List `optionalDependencies` in `kubb-extension.json`.

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
