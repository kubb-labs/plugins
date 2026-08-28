# @kubb/plugin-zod

## 5.1.2

### Patch Changes

- [#804](https://github.com/kubb-labs/plugins/pull/804) [`26660b6`](https://github.com/kubb-labs/plugins/commit/26660b68c3f19744a72b5c0bb3010357f6a7d6eb) Thanks [@xeoneux](https://github.com/xeoneux)! - Resolve `$ref` schemas when computing `default` literals and keep array defaults as array literals.
  
  `defaultLiteral` now resolves `$ref` schema targets so that array, bigint, and enum default formatting guards apply to referenced schemas. In addition, `formatDefault` preserves array literals instead of collapsing them to `{}`.

## 5.1.1

### Patch Changes

- [#793](https://github.com/kubb-labs/plugins/pull/793) [`bb127d6`](https://github.com/kubb-labs/plugins/commit/bb127d69e996aa9117062129ccae1910706514ad) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - A `printer.nodes` handler that reads `this.options.direction` now generates an `${name}InputSchema` variant automatically, `$ref` request bodies included.
  
  Such a handler used to only change how a node printed. The generator never learned the schema carried a conversion, so no input variant was emitted and a `$ref` request body kept the decode direction. It now runs the handler for both directions and compares, so nothing extra needs registering.
  
  ```ts
  pluginZod({
    printer: {
      nodes: {
        time() {
          return this.options.direction === 'encode'
            ? 'z.instanceof(Temporal.PlainTime).transform((value) => value.toString())'
            : 'z.iso.time().transform((value) => Temporal.PlainTime.from(value))'
        },
      },
    },
  })
  ```
  
  The built-in `date` conversion (`dateType: 'date'`) is now an ordinary handler on that same map, so overriding `printer.nodes.date` replaces it like any other override.
  
  `direction` also changes values, from `'input' | 'output'` to `'encode' | 'decode'`. The old pair collided with Zod's own `z.input` and `z.output`, and read inverted against them: the schema built at `direction: 'output'` is the one whose `z.input` is the wire type. The new values name the conversion instead, matching `z.codec(a, b, { decode, encode })`. Replace `'input'` with `'encode'` and `'output'` with `'decode'` in any `printer.nodes` handler that reads it.

- [#797](https://github.com/kubb-labs/plugins/pull/797) [`4f97e63`](https://github.com/kubb-labs/plugins/commit/4f97e632b6d3bcb215b95d1c62a1ee9349d762f6) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - `format: int64` fields now print `z.coerce.bigint()` instead of `z.bigint()`. `JSON.parse` returns a `number` for those fields, so a plain `z.bigint()` failed at runtime for every response validated with `pluginFetch({ validator: 'zod' })`.

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

- Rewrite to v5 AST-based architecture. The plugin no longer depends on `@kubb/plugin-oas` or `@kubb/oas`.
  
  **Breaking changes:**
  - Remove `mapper`, `version`, `contentType` options
  - Remove `transformers.name` and `transformers.schema` callbacks
  - Move `integerType`, `emptySchemaType`, `unknownType` to `adapterOas(...)`
  - Remove the `wrapOutput` option. Use a `printer.nodes` override and call `this.base(node)` to wrap the built-in output instead
  - `coercion` accepts granular object `{ dates?, strings?, numbers? }` in addition to `boolean`
  
  **New options:**
  - `resolver`, `printer`, `macros`
  
  **New exports:** `resolverZod`, `printerZod`, `printerZodMini`

- Replace the `transformer` option with `macros`.
  
  Every plugin now takes `macros?: Array<ast.Macro>` instead of `transformer?: ast.Visitor`, and registers them with `ctx.setMacros` in `kubb:plugin:setup`. Macros are named and composable, so a list runs in order and a later macro sees the output of an earlier one. Move a single visitor into a macro by wrapping it: `macros: [{ name: 'my-macro', schema(node) { … } }]`.

- **Breaking:** Remove `pluginKey` in favor of `pluginName`. Each plugin can now only be used once. Duplicate plugins throw an error.

- **Breaking:** Rename `defineAdapter` to `createAdapter` and `PluginManager` to `KubbDriver`. `definePlugin`, `defineGenerator`, and `defineConfig` are unchanged.
  
  | Before | After |
  |---|---|
  | `defineAdapter` | `createAdapter` |
  | `PluginManager` | `KubbDriver` |
  | `pluginManager` (context property) | `driver` |

- **Breaking:** Minimum required Node.js version is now 22.

### Minor Changes

- Fix stack overflows on indirect circular schemas (e.g. `Dog → Pet → Dog`) reported in kubb-labs/kubb#3172.
  
  Both plugins now use shared helpers from `@kubb/ast`:
  - `findCircularSchemas(schemas)`: detects all schemas involved in a cycle (direct or indirect)
  - `containsCircularRef(node, { circularSchemas, excludeName? })`: checks whether a property transitively references a cyclic schema
  
  `plugin-faker` emits a lazy, memoizing getter for properties that reference an indirect cycle, preventing stack overflows at construction time. Direct self-references continue to emit `undefined as unknown as <Type>`.
  
  `plugin-zod` wraps cyclic `$ref`s in `z.lazy(() => …)` and emits object properties as getters when the property schema references a cyclic schema. The getter body is generated without redundant `z.lazy()` wrappers, using a closure-level flag instead of post-processing string replacement.

- Default tag group folders to the plain camelCased tag.
  
  With `group: { type: 'tag' }`, every plugin now writes to `pet/` instead of `petController/` (and the Cypress and MCP plugins drop the `Requests` suffix too). The suffixes were a leftover convention nothing in the output referenced. To keep the old layout, pass `group: { type: 'tag', name: ({ group }) => \`${group}Controller\` }`.

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

- Emit `z.discriminatedUnion` for `oneOf`/`anyOf` schemas with a `discriminator` (kubb-labs/plugins#335).
  
  Variants defined through `allOf` used to render as intersections (`base.and(…)`), which `z.discriminatedUnion` rejects, so the output fell back to a plain `z.union`. Object `allOf` variants now render with `.extend({ … })` (zod) or `z.extend(base, { … })` (zod/mini), so each stays a Zod object and the union discriminates on the property. Variants that can't flatten to an object, like a cyclic `z.lazy(…)` ref, keep the `z.union` fallback.

- Fix `<operation>ResponseSchema` validating the response body against a union of every status code. The schema now covers success (2xx) bodies only, matching the `request<…>` generic that already separates success from error. Multiple 2xx responses produce a union of just those success schemas, and an operation with no documented 2xx schema falls back to `z.unknown()`. Error (4xx/5xx/default) bodies are no longer folded into the success schema. They stay typed by plugin-ts and are surfaced unparsed.
  
  This is the response-validation half of the client plugins' `validator: 'zod'` contract (plugin-fetch, plugin-axios). Fixes [#369](https://github.com/kubb-labs/plugins/issues/369).

- Keep the OpenAPI document's exact parameter names for path, query, and header parameters, instead of forcing them to camelCase (kubb-labs/plugins#631).
  
  ```ts
  export type UpdatePetQuery = {
    include_deleted?: boolean
  }
  
  updatePet({ path: { pet_id: '1' }, query: { include_deleted: true } })
  ```
  
  There's no remapping step anymore, so a query or header name can't collide with a differently cased sibling, like `start_date` next to `startDate`.
  
  A path parameter still falls back to camelCase when its spec name isn't a valid identifier on its own (a hyphenated segment, say), since a few generators bind it directly as a variable. Query and header names are never touched.

### Patch Changes

- [#323](https://github.com/kubb-labs/plugins/pull/323) [`92482b1`](https://github.com/kubb-labs/plugins/commit/92482b1ee0a0b70c2bc0293f5d3d8dbd5519af75) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Consume the shared codegen helpers (`stringify`, `trimQuotes`, `jsStringEscape`, `toRegExpString`,
  `stringifyObject`, `getNestedAccessor`, `buildJSDoc`) from `@kubb/ast/utils` instead of keeping
  local copies. Generated output is unchanged.

- [#414](https://github.com/kubb-labs/plugins/pull/414) [`451f3b7`](https://github.com/kubb-labs/plugins/commit/451f3b7a24eb95fb4881bee8de59839e81686386) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Consume shared schema-traversal helpers (`mapSchemaProperties`, `mapSchemaMembers`,
  `mapSchemaItems`) in the zod, zod-mini, faker, and TypeScript printers,
  replacing the per-printer property, member, and item walks. Generated output is unchanged.

- [#241](https://github.com/kubb-labs/plugins/pull/241) [`7bf4c87`](https://github.com/kubb-labs/plugins/commit/7bf4c87304143708f7c7619b4af5013f40fb81cf) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Replace the per-plugin `group` naming block (duplicated verbatim across nine plugins) with a shared `createGroupConfig` helper. A user-provided `group.name` is still honored across every plugin. The default folder name is covered by the separate group-folder changeset.

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

- [#2700](https://github.com/kubb-labs/kubb/pull/2700) [`29f6d1b`](https://github.com/kubb-labs/kubb/commit/29f6d1b31e0bc922eb5b0ba8e5149241a3a37305) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Fix `$ref` schemas with sibling `default` values not generating `.default()` in Zod output.

  When an OpenAPI query parameter uses a `$ref` with a sibling `default` value (e.g. `{"$ref": "#/components/schemas/ProjectType", "default": "project"}`), the generated Zod schema now correctly includes the `.default()` modifier.

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

- [#2672](https://github.com/kubb-labs/kubb/pull/2672) [`1f51e6e`](https://github.com/kubb-labs/kubb/commit/1f51e6e4cd8982653c4992929eae009cee1ec2db) Thanks [@rajp33](https://github.com/rajp33)! - Prevent `typed: true` Zod generation from emitting duplicate `ToZod` imports in generated files.

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

- [`edfa8fe`](https://github.com/kubb-labs/kubb/commit/edfa8fe016c0ea5bbc4535c68e4cfaeb3a29217b) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - ToZod import is not a type import

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

- [#2577](https://github.com/kubb-labs/kubb/pull/2577) [`9529af1`](https://github.com/kubb-labs/kubb/commit/9529af145dca72991fe7d2a529c717cce0993ea3) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Total size change: -6.7 MB

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

- [#2567](https://github.com/kubb-labs/kubb/pull/2567) [`3690d37`](https://github.com/kubb-labs/kubb/commit/3690d3778cb8e2c48841bf13b73c82c165242ef4) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - refactor: replace resolveModuleSource with static imports and build-time template inlining

  Removed `resolveModuleSource` from `@kubb/core/utils`. Template file contents for `@kubb/plugin-client` (config, axios, fetch) and `@kubb/plugin-zod` (ToZod) are now inlined as string constants at build time via the `importAttributeTextPlugin` rolldown/tsdown plugin, using `import ... with { type: 'text' }` import attributes as the build-time marker. This eliminates all runtime filesystem reads for template sources.

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

### Minor Changes

- [#2509](https://github.com/kubb-labs/kubb/pull/2509) [`af65cde`](https://github.com/kubb-labs/kubb/commit/af65cde624a74e68bfb5dede871e8d9324499114) Thanks [@skoropadas](https://github.com/skoropadas)! - Add a new `guidType` option to control how OpenAPI `format: uuid` is generated in Zod schemas.
  - `guidType` accepts `'uuid'` and `'guid'`
  - default is `'uuid'`
  - `'guid'` is only applied when `version: '4'` (v3 falls back to UUID generation)

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

- [#2419](https://github.com/kubb-labs/kubb/pull/2419) [`be8e4e6`](https://github.com/kubb-labs/kubb/commit/be8e4e68d57b161d592e646657dfddc52c2de133) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Fix zod import to use namespace import (`import * as z from 'zod'`) for better compatibility with different module systems and bundlers.

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

- [#2383](https://github.com/kubb-labs/kubb/pull/2383) [`d91549b`](https://github.com/kubb-labs/kubb/commit/d91549b906e0c8e37e1e06795e13daeaa9562682) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Fix Zod Mini nullish modifier to use functional wrapper instead of method call

  When using `mini: true` option with Zod v4, object properties with nullish modifier now correctly generate `z.nullish(schema)` instead of `schema.nullish()`.

  **Issue:**
  Zod Mini doesn't support chainable methods like `.nullish()`. It only supports functional wrappers like `z.nullish()`.

  **Before** (v4.18.5):

  ```typescript
  export const postApiExampleMutationRequestSchema = z.object({
    email: z.string().nullish(), // ❌ Error: .nullish() doesn't exist in Zod Mini
  });
  ```

  **After** (this fix):

  ```typescript
  export const postApiExampleMutationRequestSchema = z.object({
    email: z.nullish(z.string()), // ✅ Correct functional wrapper
  });
  ```

  This fix ensures consistency with how `optional` and `nullable` modifiers were already being handled in mini mode.

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

- [#2362](https://github.com/kubb-labs/kubb/pull/2362) [`ea23bb4`](https://github.com/kubb-labs/kubb/commit/ea23bb4a2f5a121dd1192b05f0f4cf4207093dc5) Thanks [@ATholin](https://github.com/ATholin)! - Improves zod handling of nullable schemas in OpenAPI 3.1 by recognizing type: null variants that previously only worked in some cases.

- [#2368](https://github.com/kubb-labs/kubb/pull/2368) [`77ec2fd`](https://github.com/kubb-labs/kubb/commit/77ec2fd6a2e9346667b70f31dc714ea1925fa68d) Thanks [@hyoban](https://github.com/hyoban)! - avoid omit on z.union

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

- Updated dependencies []:
  - @kubb/core@4.18.2
  - @kubb/oas@4.18.2
  - @kubb/plugin-oas@4.18.2
  - @kubb/plugin-ts@4.18.2

## 4.18.1

### Patch Changes

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

- [#2248](https://github.com/kubb-labs/kubb/pull/2248) [`be95612`](https://github.com/kubb-labs/kubb/commit/be95612729e185d2919f9bf36093a809acb28924) Thanks [@kamilzki](https://github.com/kamilzki)! - Fixes the issue where the `wrapOutput` function in the Zod generator did not receive the correct `schema` argument for all traversed nodes

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

- [#2232](https://github.com/kubb-labs/kubb/pull/2232) [`600053d`](https://github.com/kubb-labs/kubb/commit/600053db677dc6ba1b60c822d6dad23d6da60507) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - flatten allof to support better Zod schemas

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

### Minor Changes

- [#2082](https://github.com/kubb-labs/kubb/pull/2082) [`9753dfa`](https://github.com/kubb-labs/kubb/commit/9753dfafc8f468d1f865896ed50341a577dfefba) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Add support for Zod Mini with the new `mini` option
  - Added `mini` option to enable Zod Mini's functional API for better tree-shaking
  - When `mini: true`, generates functional syntax (e.g., `z.optional(z.string())`) instead of chainable methods
  - Automatically sets `version` to `'4'` and `importPath` to `'zod/mini'` when mini mode is enabled
  - Updated parser to support `.check()` syntax for constraints in mini mode (e.g., `z.string().check(z.minLength(5))`)

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

- [#2065](https://github.com/kubb-labs/kubb/pull/2065) [`a4de0c4`](https://github.com/kubb-labs/kubb/commit/a4de0c4613fdaff3562e63ba591bc3de465b6e46) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Skip coercion for email, url, uuid with Zod 4. In Zod 4, coerce does not support `z.uuid()`, `z.email()` or `z.url()` and coercion does not make sense with these specific string subtypes. You could coerce a number to string, but you can't coerce a non-string to a valid uuid, url or email.

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

- [#2059](https://github.com/kubb-labs/kubb/pull/2059) [`7c8da51`](https://github.com/kubb-labs/kubb/commit/7c8da51bc7ecea48a839aeaff5d3a9848b5c568f) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Fix Zod v4 uuid/url/email generation with coercion enabled. When coercion is true and version is set to '4', the plugin now correctly generates v4 syntax (e.g., `z.coerce.uuid()`) instead of v3 syntax (e.g., `z.coerce.string().uuid()`).

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

- [#2024](https://github.com/kubb-labs/kubb/pull/2024) [`4e54238`](https://github.com/kubb-labs/kubb/commit/4e54238868b2e44aa98e3f3ef495a130e7d259dc) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Add z.lazy() wrapper to all schema references to resolve circular dependency issues

  This change ensures that all schema references are wrapped in `z.lazy()`, deferring their evaluation until runtime. This prevents "used before declaration" errors that can occur with circular dependencies, particularly when using `oneOf`/`anyOf` constructs.

  For Zod v4, refs inside object property getters skip the z.lazy() wrapper since the getter itself provides lazy evaluation.

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

- [#1978](https://github.com/kubb-labs/kubb/pull/1978) [`39b713a`](https://github.com/kubb-labs/kubb/commit/39b713aaa9917a5d9def277a0215f14e28f3c67f) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Query parameter object with all parameters defaulting incorrectly marked as optional in Zod

- Updated dependencies []:
  - @kubb/core@4.5.1
  - @kubb/oas@4.5.1
  - @kubb/plugin-oas@4.5.1
  - @kubb/plugin-ts@4.5.1

## 4.5.0

### Minor Changes

- [#1970](https://github.com/kubb-labs/kubb/pull/1970) [`7152039`](https://github.com/kubb-labs/kubb/commit/71520392cde27ff58bcbead3930e8f3e38b3be86) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - remove @kubb dependencies

### Patch Changes

- [#1976](https://github.com/kubb-labs/kubb/pull/1976) [`2512b5f`](https://github.com/kubb-labs/kubb/commit/2512b5f8a8216e35886cf4aede9311150f6ba0e8) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Add z.lazy for every reference but use get(){} syntax when using Zod v4 in z.object

- [#1974](https://github.com/kubb-labs/kubb/pull/1974) [`4c964fa`](https://github.com/kubb-labs/kubb/commit/4c964fa89bf0b9dceae615895a6153d4fe777974) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - zod schema is not adding `.max` anymore

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

### Minor Changes

- [#1946](https://github.com/kubb-labs/kubb/pull/1946) [`1a3e1d9`](https://github.com/kubb-labs/kubb/commit/1a3e1d98015ec768c0d5e563888003047fda351c) Thanks [@blackravenx](https://github.com/blackravenx)! - add exclusive minimum and maximum support in schema generator and parser

### Patch Changes

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

- Updated dependencies []:
  - @kubb/core@4.1.4
  - @kubb/oas@4.1.4
  - @kubb/parser-ts@4.1.4
  - @kubb/plugin-oas@4.1.4
  - @kubb/plugin-ts@4.1.4
  - @kubb/react@4.1.4

## 4.1.3

### Patch Changes

- Updated dependencies []:
  - @kubb/core@4.1.3
  - @kubb/oas@4.1.3
  - @kubb/parser-ts@4.1.3
  - @kubb/plugin-oas@4.1.3
  - @kubb/plugin-ts@4.1.3
  - @kubb/react@4.1.3

## 4.1.2

### Patch Changes

- [`0754cdb`](https://github.com/kubb-labs/kubb/commit/0754cdbcfba08b6de3940f26e265206a6597527a) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - url should also set max and min

- Updated dependencies [[`acf033c`](https://github.com/kubb-labs/kubb/commit/acf033c7a2540741e57ab130c6ad94bcdbcf354c)]:
  - @kubb/core@4.1.2
  - @kubb/plugin-oas@4.1.2
  - @kubb/plugin-ts@4.1.2
  - @kubb/react@4.1.2
  - @kubb/oas@4.1.2
  - @kubb/parser-ts@4.1.2

## 4.1.1

### Patch Changes

- [#1901](https://github.com/kubb-labs/kubb/pull/1901) [`2c8882b`](https://github.com/kubb-labs/kubb/commit/2c8882ba3652dabc662660578072d9c0b9abd071) Thanks [@lambdank](https://github.com/lambdank)! - Recursive fields now use string literals

- Updated dependencies []:
  - @kubb/core@4.1.1
  - @kubb/oas@4.1.1
  - @kubb/parser-ts@4.1.1
  - @kubb/plugin-oas@4.1.1
  - @kubb/plugin-ts@4.1.1
  - @kubb/react@4.1.1

## 4.1.0

### Patch Changes

- [`c70ef78`](https://github.com/kubb-labs/kubb/commit/c70ef78d1dd9479f9459a5dcb710505515e2c7c6) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - use of `z.ZodType` when using Zod v4

- Updated dependencies []:
  - @kubb/core@4.1.0
  - @kubb/oas@4.1.0
  - @kubb/parser-ts@4.1.0
  - @kubb/plugin-oas@4.1.0
  - @kubb/plugin-ts@4.1.0
  - @kubb/react@4.1.0

## 4.0.2

### Patch Changes

- [`fe675c6`](https://github.com/kubb-labs/kubb/commit/fe675c66ba624339bccfbba3ab75c8acadeca239) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Escape omit keys

- Updated dependencies []:
  - @kubb/core@4.0.2
  - @kubb/oas@4.0.2
  - @kubb/parser-ts@4.0.2
  - @kubb/plugin-oas@4.0.2
  - @kubb/plugin-ts@4.0.2
  - @kubb/react@4.0.2

## 4.0.1

### Patch Changes

- Updated dependencies [[`c531bb9`](https://github.com/kubb-labs/kubb/commit/c531bb9c898c8974c74a80e3c65ac3ea7229538b)]:
  - @kubb/plugin-ts@4.0.1
  - @kubb/core@4.0.1
  - @kubb/oas@4.0.1
  - @kubb/parser-ts@4.0.1
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
  - @kubb/parser-ts@4.0.0

## 3.18.3

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.18.3
  - @kubb/oas@3.18.3
  - @kubb/parser-ts@3.18.3
  - @kubb/plugin-oas@3.18.3
  - @kubb/plugin-ts@3.18.3
  - @kubb/react@3.18.3

## 3.18.2

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.18.2
  - @kubb/oas@3.18.2
  - @kubb/parser-ts@3.18.2
  - @kubb/plugin-oas@3.18.2
  - @kubb/plugin-ts@3.18.2
  - @kubb/react@3.18.2

## 3.18.1

### Patch Changes

- Updated dependencies [[`7990392`](https://github.com/kubb-labs/kubb/commit/7990392d5174e3d1886ba77c7f7bf6c926943e1b)]:
  - @kubb/parser-ts@3.18.1
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
  - @kubb/parser-ts@3.17.1

## 3.17.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.17.0
  - @kubb/oas@3.17.0
  - @kubb/parser-ts@3.17.0
  - @kubb/plugin-oas@3.17.0
  - @kubb/plugin-ts@3.17.0
  - @kubb/react@3.17.0

## 3.16.4

### Patch Changes

- [#1782](https://github.com/kubb-labs/kubb/pull/1782) [`ce6ebfc`](https://github.com/kubb-labs/kubb/commit/ce6ebfc959229a92b9f779744d9f6556861a5ba1) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - toZod support for Zod v4

- Updated dependencies []:
  - @kubb/core@3.16.4
  - @kubb/oas@3.16.4
  - @kubb/parser-ts@3.16.4
  - @kubb/plugin-oas@3.16.4
  - @kubb/plugin-ts@3.16.4
  - @kubb/react@3.16.4

## 3.16.3

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.16.3
  - @kubb/oas@3.16.3
  - @kubb/parser-ts@3.16.3
  - @kubb/plugin-oas@3.16.3
  - @kubb/plugin-ts@3.16.3
  - @kubb/react@3.16.3

## 3.16.2

### Patch Changes

- Updated dependencies [[`9f386f7`](https://github.com/kubb-labs/kubb/commit/9f386f763728119c1baef4ee50733e6dc2079ac7), [`9f386f7`](https://github.com/kubb-labs/kubb/commit/9f386f763728119c1baef4ee50733e6dc2079ac7)]:
  - @kubb/plugin-ts@3.16.2
  - @kubb/core@3.16.2
  - @kubb/oas@3.16.2
  - @kubb/parser-ts@3.16.2
  - @kubb/plugin-oas@3.16.2
  - @kubb/react@3.16.2

## 3.16.1

### Patch Changes

- Updated dependencies [[`e51db4c`](https://github.com/kubb-labs/kubb/commit/e51db4c77b3bb7e044382d2b19400262e927cd3a)]:
  - @kubb/plugin-oas@3.16.1
  - @kubb/plugin-ts@3.16.1
  - @kubb/core@3.16.1
  - @kubb/oas@3.16.1
  - @kubb/parser-ts@3.16.1
  - @kubb/react@3.16.1

## 3.16.0

### Patch Changes

- Updated dependencies [[`c7360e8`](https://github.com/kubb-labs/kubb/commit/c7360e879436d035229ade7afc2f2870e0538a89)]:
  - @kubb/core@3.16.0
  - @kubb/oas@3.16.0
  - @kubb/plugin-oas@3.16.0
  - @kubb/plugin-ts@3.16.0
  - @kubb/react@3.16.0
  - @kubb/parser-ts@3.16.0

## 3.15.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.15.1
  - @kubb/oas@3.15.1
  - @kubb/parser-ts@3.15.1
  - @kubb/plugin-oas@3.15.1
  - @kubb/plugin-ts@3.15.1
  - @kubb/react@3.15.1

## 3.15.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.15.0
  - @kubb/oas@3.15.0
  - @kubb/parser-ts@3.15.0
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
  - @kubb/parser-ts@3.14.4
  - @kubb/react@3.14.4

## 3.14.3

### Patch Changes

- Updated dependencies [[`2376899`](https://github.com/kubb-labs/kubb/commit/2376899898e92483945e48c7bbca2398d3b8ac9c), [`2376899`](https://github.com/kubb-labs/kubb/commit/2376899898e92483945e48c7bbca2398d3b8ac9c), [`991249c`](https://github.com/kubb-labs/kubb/commit/991249c18e86c6ebdfef3912de44cbfaa81b6891)]:
  - @kubb/plugin-oas@3.14.3
  - @kubb/core@3.14.3
  - @kubb/plugin-ts@3.14.3
  - @kubb/react@3.14.3
  - @kubb/oas@3.14.3
  - @kubb/parser-ts@3.14.3

## 3.14.2

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.14.2
  - @kubb/oas@3.14.2
  - @kubb/parser-ts@3.14.2
  - @kubb/plugin-oas@3.14.2
  - @kubb/plugin-ts@3.14.2
  - @kubb/react@3.14.2

## 3.14.1

### Patch Changes

- Updated dependencies [[`b48928e`](https://github.com/kubb-labs/kubb/commit/b48928e0256f6a5870e7f01e2b9a4419f37cf9bd)]:
  - @kubb/parser-ts@3.14.1
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
  - @kubb/parser-ts@3.14.0
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
  - @kubb/parser-ts@3.13.2

## 3.13.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.13.1
  - @kubb/oas@3.13.1
  - @kubb/parser-ts@3.13.1
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
  - @kubb/parser-ts@3.13.0
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
  - @kubb/parser-ts@3.12.2

## 3.12.1

### Patch Changes

- [`517fedc`](https://github.com/kubb-labs/kubb/commit/517fedc6e1adc748ae1768072bc6823c243bcde5) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Correct v4 imports when no importPath is defined

- Updated dependencies []:
  - @kubb/core@3.12.1
  - @kubb/oas@3.12.1
  - @kubb/parser-ts@3.12.1
  - @kubb/plugin-oas@3.12.1
  - @kubb/plugin-ts@3.12.1
  - @kubb/react@3.12.1

## 3.12.0

### Minor Changes

- [`2ba42c5`](https://github.com/kubb-labs/kubb/commit/2ba42c5603e037b0a324c3b720e7b6505daf9acf) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - full support for Zod v4

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.12.0
  - @kubb/oas@3.12.0
  - @kubb/parser-ts@3.12.0
  - @kubb/plugin-oas@3.12.0
  - @kubb/plugin-ts@3.12.0
  - @kubb/react@3.12.0

## 3.11.1

### Patch Changes

- [#1751](https://github.com/kubb-labs/kubb/pull/1751) [`5400e56`](https://github.com/kubb-labs/kubb/commit/5400e56fd866dbee721cd2dcbdb288088c58d990) Thanks [@rmachado-studocu](https://github.com/rmachado-studocu)! - fix(plugin-zod): avoids converting float values to integers

- Updated dependencies []:
  - @kubb/core@3.11.1
  - @kubb/oas@3.11.1
  - @kubb/parser-ts@3.11.1
  - @kubb/plugin-oas@3.11.1
  - @kubb/plugin-ts@3.11.1
  - @kubb/react@3.11.1

## 3.11.0

### Patch Changes

- [`13189ee`](https://github.com/kubb-labs/kubb/commit/13189ee0c7b297cc42cf9a7d476780ff7e357efe) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - enums of type "number" are parsed to integers

- Updated dependencies [[`55de3d2`](https://github.com/kubb-labs/kubb/commit/55de3d2758ce4957882243ad70d3168d3c41ff40)]:
  - @kubb/plugin-oas@3.11.0
  - @kubb/plugin-ts@3.11.0
  - @kubb/core@3.11.0
  - @kubb/oas@3.11.0
  - @kubb/parser-ts@3.11.0
  - @kubb/react@3.11.0

## 3.10.15

### Patch Changes

- Updated dependencies [[`db73926`](https://github.com/kubb-labs/kubb/commit/db73926f46739e598244bedc52f466591b2d7320)]:
  - @kubb/plugin-ts@3.10.15
  - @kubb/core@3.10.15
  - @kubb/oas@3.10.15
  - @kubb/parser-ts@3.10.15
  - @kubb/plugin-oas@3.10.15
  - @kubb/react@3.10.15

## 3.10.14

### Patch Changes

- Updated dependencies [[`17ebfce`](https://github.com/kubb-labs/kubb/commit/17ebfce849874784aa0625310eae17c8574528b3)]:
  - @kubb/plugin-ts@3.10.14
  - @kubb/core@3.10.14
  - @kubb/oas@3.10.14
  - @kubb/parser-ts@3.10.14
  - @kubb/plugin-oas@3.10.14
  - @kubb/react@3.10.14

## 3.10.13

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.10.13
  - @kubb/oas@3.10.13
  - @kubb/parser-ts@3.10.13
  - @kubb/plugin-oas@3.10.13
  - @kubb/plugin-ts@3.10.13
  - @kubb/react@3.10.13

## 3.10.12

### Patch Changes

- [#1724](https://github.com/kubb-labs/kubb/pull/1724) [`90f78c2`](https://github.com/kubb-labs/kubb/commit/90f78c2bfbc77ec8838e8e82bc521e7b24cecf65) Thanks [@SCdF](https://github.com/SCdF)! - query parameter objects are no longer optional if at least one parameter is defaulted

- Updated dependencies []:
  - @kubb/core@3.10.12
  - @kubb/oas@3.10.12
  - @kubb/parser-ts@3.10.12
  - @kubb/plugin-oas@3.10.12
  - @kubb/plugin-ts@3.10.12
  - @kubb/react@3.10.12

## 3.10.11

### Patch Changes

- [#1714](https://github.com/kubb-labs/kubb/pull/1714) [`bec329e`](https://github.com/kubb-labs/kubb/commit/bec329e79b7ff25f9b5289211e412b52b2a23492) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - update parser to include latest v4 of Zod

- Updated dependencies [[`e666e9a`](https://github.com/kubb-labs/kubb/commit/e666e9a4a038864f1d9e87a916108b291028b42b)]:
  - @kubb/plugin-oas@3.10.11
  - @kubb/plugin-ts@3.10.11
  - @kubb/core@3.10.11
  - @kubb/oas@3.10.11
  - @kubb/parser-ts@3.10.11
  - @kubb/react@3.10.11

## 3.10.10

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.10.10
  - @kubb/oas@3.10.10
  - @kubb/parser-ts@3.10.10
  - @kubb/plugin-oas@3.10.10
  - @kubb/plugin-ts@3.10.10
  - @kubb/react@3.10.10

## 3.10.9

### Patch Changes

- [#1709](https://github.com/kubb-labs/kubb/pull/1709) [`be0b8c2`](https://github.com/kubb-labs/kubb/commit/be0b8c27aee3f86bd29320fc008afe24f78856c4) Thanks [@SCdF](https://github.com/SCdF)! - always coerce numbers and dates in query and path parameters

- Updated dependencies []:
  - @kubb/core@3.10.9
  - @kubb/oas@3.10.9
  - @kubb/parser-ts@3.10.9
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
  - @kubb/parser-ts@3.10.8
  - @kubb/react@3.10.8

## 3.10.7

### Patch Changes

- Updated dependencies [[`f7d5447`](https://github.com/kubb-labs/kubb/commit/f7d54477b8d504a8f5237b70ff7978699556500f)]:
  - @kubb/core@3.10.7
  - @kubb/plugin-oas@3.10.7
  - @kubb/plugin-ts@3.10.7
  - @kubb/react@3.10.7
  - @kubb/oas@3.10.7
  - @kubb/parser-ts@3.10.7

## 3.10.6

### Patch Changes

- Updated dependencies [[`7be571a`](https://github.com/kubb-labs/kubb/commit/7be571aa4ceffb2e18dff1e81b81efa37fef0cc3)]:
  - @kubb/plugin-oas@3.10.6
  - @kubb/parser-ts@3.10.6
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
  - @kubb/parser-ts@3.10.5
  - @kubb/react@3.10.5

## 3.10.4

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.10.4
  - @kubb/fs@3.10.4
  - @kubb/oas@3.10.4
  - @kubb/parser-ts@3.10.4
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
  - @kubb/parser-ts@3.10.3
  - @kubb/react@3.10.3

## 3.10.2

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.10.2
  - @kubb/fs@3.10.2
  - @kubb/oas@3.10.2
  - @kubb/parser-ts@3.10.2
  - @kubb/plugin-oas@3.10.2
  - @kubb/plugin-ts@3.10.2
  - @kubb/react@3.10.2

## 3.10.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.10.1
  - @kubb/fs@3.10.1
  - @kubb/oas@3.10.1
  - @kubb/parser-ts@3.10.1
  - @kubb/plugin-oas@3.10.1
  - @kubb/plugin-ts@3.10.1
  - @kubb/react@3.10.1

## 3.10.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.10.0
  - @kubb/fs@3.10.0
  - @kubb/oas@3.10.0
  - @kubb/parser-ts@3.10.0
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
  - @kubb/parser-ts@3.9.5
  - @kubb/react@3.9.5

## 3.9.4

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.9.4
  - @kubb/fs@3.9.4
  - @kubb/oas@3.9.4
  - @kubb/parser-ts@3.9.4
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
  - @kubb/parser-ts@3.9.3
  - @kubb/plugin-oas@3.9.3
  - @kubb/react@3.9.3

## 3.9.2

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.9.2
  - @kubb/fs@3.9.2
  - @kubb/oas@3.9.2
  - @kubb/parser-ts@3.9.2
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
  - @kubb/parser-ts@3.9.1
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
  - @kubb/parser-ts@3.9.0

## 3.8.1

### Patch Changes

- [#1642](https://github.com/kubb-labs/kubb/pull/1642) [`b6df4d9`](https://github.com/kubb-labs/kubb/commit/b6df4d90d28e310755fd282495426f035470a7d3) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - support for Zod v4(beta)

- Updated dependencies []:
  - @kubb/core@3.8.1
  - @kubb/fs@3.8.1
  - @kubb/oas@3.8.1
  - @kubb/parser-ts@3.8.1
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
  - @kubb/parser-ts@3.8.0

## 3.7.7

### Patch Changes

- Updated dependencies [[`1d415d7`](https://github.com/kubb-labs/kubb/commit/1d415d77370125c9110ea478850c7e8f4e36c13f)]:
  - @kubb/plugin-oas@3.7.7
  - @kubb/plugin-ts@3.7.7
  - @kubb/core@3.7.7
  - @kubb/fs@3.7.7
  - @kubb/oas@3.7.7
  - @kubb/parser-ts@3.7.7
  - @kubb/react@3.7.7

## 3.7.6

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.7.6
  - @kubb/fs@3.7.6
  - @kubb/oas@3.7.6
  - @kubb/parser-ts@3.7.6
  - @kubb/plugin-oas@3.7.6
  - @kubb/plugin-ts@3.7.6
  - @kubb/react@3.7.6

## 3.7.5

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.7.5
  - @kubb/fs@3.7.5
  - @kubb/oas@3.7.5
  - @kubb/parser-ts@3.7.5
  - @kubb/plugin-oas@3.7.5
  - @kubb/plugin-ts@3.7.5
  - @kubb/react@3.7.5

## 3.7.4

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.7.4
  - @kubb/fs@3.7.4
  - @kubb/oas@3.7.4
  - @kubb/parser-ts@3.7.4
  - @kubb/plugin-oas@3.7.4
  - @kubb/plugin-ts@3.7.4
  - @kubb/react@3.7.4

## 3.7.3

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.7.3
  - @kubb/fs@3.7.3
  - @kubb/oas@3.7.3
  - @kubb/parser-ts@3.7.3
  - @kubb/plugin-oas@3.7.3
  - @kubb/plugin-ts@3.7.3
  - @kubb/react@3.7.3

## 3.7.2

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.7.2
  - @kubb/fs@3.7.2
  - @kubb/oas@3.7.2
  - @kubb/parser-ts@3.7.2
  - @kubb/plugin-oas@3.7.2
  - @kubb/plugin-ts@3.7.2
  - @kubb/react@3.7.2

## 3.7.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.7.1
  - @kubb/fs@3.7.1
  - @kubb/oas@3.7.1
  - @kubb/parser-ts@3.7.1
  - @kubb/plugin-oas@3.7.1
  - @kubb/plugin-ts@3.7.1
  - @kubb/react@3.7.1

## 3.7.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.7.0
  - @kubb/fs@3.7.0
  - @kubb/oas@3.7.0
  - @kubb/parser-ts@3.7.0
  - @kubb/plugin-oas@3.7.0
  - @kubb/plugin-ts@3.7.0
  - @kubb/react@3.7.0

## 3.6.5

### Patch Changes

- [`27739c3`](https://github.com/kubb-labs/kubb/commit/27739c350cd9406cb86fbe58e308ccd628e5635c) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - zod omit instead of z.never

- Updated dependencies []:
  - @kubb/core@3.6.5
  - @kubb/fs@3.6.5
  - @kubb/oas@3.6.5
  - @kubb/parser-ts@3.6.5
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
  - @kubb/parser-ts@3.6.4
  - @kubb/react@3.6.4

## 3.6.3

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.6.3
  - @kubb/fs@3.6.3
  - @kubb/oas@3.6.3
  - @kubb/parser-ts@3.6.3
  - @kubb/plugin-oas@3.6.3
  - @kubb/plugin-ts@3.6.3
  - @kubb/react@3.6.3

## 3.6.2

### Patch Changes

- [`3069971`](https://github.com/kubb-labs/kubb/commit/3069971677df4c07da161e94eececf697e4f39d6) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - handling circular dependency properly when using `ToZod` helper

- Updated dependencies []:
  - @kubb/core@3.6.2
  - @kubb/fs@3.6.2
  - @kubb/oas@3.6.2
  - @kubb/parser-ts@3.6.2
  - @kubb/plugin-oas@3.6.2
  - @kubb/plugin-ts@3.6.2
  - @kubb/react@3.6.2

## 3.6.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.6.1
  - @kubb/fs@3.6.1
  - @kubb/oas@3.6.1
  - @kubb/parser-ts@3.6.1
  - @kubb/plugin-oas@3.6.1
  - @kubb/plugin-ts@3.6.1
  - @kubb/react@3.6.1

## 3.6.0

### Minor Changes

- [#1563](https://github.com/kubb-labs/kubb/pull/1563) [`a528a46`](https://github.com/kubb-labs/kubb/commit/a528a460dfaecba6b24f9411826942f1cb813e8b) Thanks [@msutkowski](https://github.com/msutkowski)! - Adds wrapOutput option to allow for further customizing the generated zod schemas

### Patch Changes

- Updated dependencies [[`e48aa64`](https://github.com/kubb-labs/kubb/commit/e48aa6483c023ac988f71a6642a797b09f67d177)]:
  - @kubb/oas@3.6.0
  - @kubb/plugin-oas@3.6.0
  - @kubb/plugin-ts@3.6.0
  - @kubb/core@3.6.0
  - @kubb/fs@3.6.0
  - @kubb/parser-ts@3.6.0
  - @kubb/react@3.6.0

## 3.5.13

### Patch Changes

- Updated dependencies [[`09ed7ba`](https://github.com/kubb-labs/kubb/commit/09ed7ba9d585dabca249a0cddd18c8a0dce6f5e1)]:
  - @kubb/parser-ts@3.5.13
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
  - @kubb/parser-ts@3.5.12
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
  - @kubb/parser-ts@3.5.11
  - @kubb/plugin-oas@3.5.11
  - @kubb/plugin-ts@3.5.11
  - @kubb/react@3.5.11

## 3.5.10

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.5.10
  - @kubb/fs@3.5.10
  - @kubb/oas@3.5.10
  - @kubb/parser-ts@3.5.10
  - @kubb/plugin-oas@3.5.10
  - @kubb/plugin-ts@3.5.10
  - @kubb/react@3.5.10

## 3.5.9

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.5.9
  - @kubb/fs@3.5.9
  - @kubb/oas@3.5.9
  - @kubb/parser-ts@3.5.9
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
  - @kubb/parser-ts@3.5.8
  - @kubb/react@3.5.8

## 3.5.7

### Patch Changes

- Updated dependencies [[`3dec170`](https://github.com/kubb-labs/kubb/commit/3dec170dc38013bbcff625eff9de0a75da05f80e)]:
  - @kubb/react@3.5.7
  - @kubb/core@3.5.7
  - @kubb/fs@3.5.7
  - @kubb/oas@3.5.7
  - @kubb/parser-ts@3.5.7
  - @kubb/plugin-oas@3.5.7
  - @kubb/plugin-ts@3.5.7

## 3.5.6

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.5.6
  - @kubb/fs@3.5.6
  - @kubb/oas@3.5.6
  - @kubb/parser-ts@3.5.6
  - @kubb/plugin-oas@3.5.6
  - @kubb/plugin-ts@3.5.6
  - @kubb/react@3.5.6

## 3.5.5

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.5.5
  - @kubb/fs@3.5.5
  - @kubb/oas@3.5.5
  - @kubb/parser-ts@3.5.5
  - @kubb/plugin-oas@3.5.5
  - @kubb/plugin-ts@3.5.5
  - @kubb/react@3.5.5

## 3.5.4

### Patch Changes

- [`ce201f0`](https://github.com/kubb-labs/kubb/commit/ce201f0e4cac2236ba10dc020c29741ea62b28a5) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Support uniqueItems in Zod

- Updated dependencies []:
  - @kubb/core@3.5.4
  - @kubb/fs@3.5.4
  - @kubb/oas@3.5.4
  - @kubb/parser-ts@3.5.4
  - @kubb/plugin-oas@3.5.4
  - @kubb/plugin-ts@3.5.4
  - @kubb/react@3.5.4

## 3.5.3

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.5.3
  - @kubb/fs@3.5.3
  - @kubb/oas@3.5.3
  - @kubb/parser-ts@3.5.3
  - @kubb/plugin-oas@3.5.3
  - @kubb/plugin-ts@3.5.3
  - @kubb/react@3.5.3

## 3.5.2

### Patch Changes

- Updated dependencies [[`f5bae0d`](https://github.com/kubb-labs/kubb/commit/f5bae0db77f50fc11c504ab81bd077883346fd7e)]:
  - @kubb/plugin-oas@3.5.2
  - @kubb/plugin-ts@3.5.2
  - @kubb/core@3.5.2
  - @kubb/fs@3.5.2
  - @kubb/oas@3.5.2
  - @kubb/parser-ts@3.5.2
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
  - @kubb/parser-ts@3.5.1

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
  - @kubb/parser-ts@3.5.0

## 3.4.5

### Patch Changes

- Updated dependencies [[`b678aba`](https://github.com/kubb-labs/kubb/commit/b678abae84d0e0e17af1eaa818c47e15341cf67b)]:
  - @kubb/core@3.4.5
  - @kubb/plugin-oas@3.4.5
  - @kubb/plugin-ts@3.4.5
  - @kubb/react@3.4.5
  - @kubb/fs@3.4.5
  - @kubb/oas@3.4.5
  - @kubb/parser-ts@3.4.5

## 3.4.4

### Patch Changes

- [#1505](https://github.com/kubb-labs/kubb/pull/1505) [`4f571fa`](https://github.com/kubb-labs/kubb/commit/4f571fa94b1dc39dbffd4c27496585843e2bbb7f) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - use of `as ToZod` instead of `satisfies ToZod`

- Updated dependencies []:
  - @kubb/core@3.4.4
  - @kubb/fs@3.4.4
  - @kubb/oas@3.4.4
  - @kubb/parser-ts@3.4.4
  - @kubb/plugin-oas@3.4.4
  - @kubb/plugin-ts@3.4.4
  - @kubb/react@3.4.4

## 3.4.3

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.4.3
  - @kubb/fs@3.4.3
  - @kubb/oas@3.4.3
  - @kubb/parser-ts@3.4.3
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
  - @kubb/parser-ts@3.4.2

## 3.4.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.4.1
  - @kubb/fs@3.4.1
  - @kubb/oas@3.4.1
  - @kubb/parser-ts@3.4.1
  - @kubb/plugin-oas@3.4.1
  - @kubb/plugin-ts@3.4.1
  - @kubb/react@3.4.1

## 3.4.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.4.0
  - @kubb/fs@3.4.0
  - @kubb/oas@3.4.0
  - @kubb/parser-ts@3.4.0
  - @kubb/plugin-oas@3.4.0
  - @kubb/plugin-ts@3.4.0
  - @kubb/react@3.4.0

## 3.3.5

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.3.5
  - @kubb/fs@3.3.5
  - @kubb/oas@3.3.5
  - @kubb/parser-ts@3.3.5
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
  - @kubb/parser-ts@3.3.4
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
  - @kubb/parser-ts@3.3.3

## 3.3.2

### Patch Changes

- Updated dependencies [[`fd3831e`](https://github.com/kubb-labs/kubb/commit/fd3831e090c0356280a3c17e9e1878e843705e60)]:
  - @kubb/react@3.3.2
  - @kubb/plugin-oas@3.3.2
  - @kubb/plugin-ts@3.3.2
  - @kubb/core@3.3.2
  - @kubb/fs@3.3.2
  - @kubb/oas@3.3.2
  - @kubb/parser-ts@3.3.2

## 3.3.1

### Patch Changes

- [#1462](https://github.com/kubb-labs/kubb/pull/1462) [`9399093`](https://github.com/kubb-labs/kubb/commit/939909354c4413a4ac7ba9b68963e31230992006) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Use of `toZod` util to create schema based on a type

- Updated dependencies []:
  - @kubb/core@3.3.1
  - @kubb/fs@3.3.1
  - @kubb/oas@3.3.1
  - @kubb/parser-ts@3.3.1
  - @kubb/plugin-oas@3.3.1
  - @kubb/plugin-ts@3.3.1
  - @kubb/react@3.3.1

## 3.3.0

### Minor Changes

- [`7de9eeb`](https://github.com/kubb-labs/kubb/commit/7de9eeb59a69a9cff6377ce3c7887d5641300749) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - use Regular expression literal instead of RegExp-contructor

### Patch Changes

- Updated dependencies [[`ed08de3`](https://github.com/kubb-labs/kubb/commit/ed08de333ffc4a6de61707b3a0c2c9d647cd16fd)]:
  - @kubb/plugin-ts@3.3.0
  - @kubb/core@3.3.0
  - @kubb/fs@3.3.0
  - @kubb/oas@3.3.0
  - @kubb/parser-ts@3.3.0
  - @kubb/plugin-oas@3.3.0
  - @kubb/react@3.3.0

## 3.2.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.2.0
  - @kubb/fs@3.2.0
  - @kubb/oas@3.2.0
  - @kubb/parser-ts@3.2.0
  - @kubb/plugin-oas@3.2.0
  - @kubb/plugin-ts@3.2.0
  - @kubb/react@3.2.0

## 3.1.0

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.1.0
  - @kubb/fs@3.1.0
  - @kubb/oas@3.1.0
  - @kubb/parser-ts@3.1.0
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
  - @kubb/parser-ts@3.0.14
  - @kubb/react@3.0.14

## 3.0.13

### Patch Changes

- Updated dependencies [[`d2a69a3`](https://github.com/kubb-labs/kubb/commit/d2a69a3b11c02d2836081202c07954f8e49aef83)]:
  - @kubb/plugin-oas@3.0.13
  - @kubb/parser-ts@3.0.13
  - @kubb/core@3.0.13
  - @kubb/oas@3.0.13
  - @kubb/fs@3.0.13
  - @kubb/plugin-ts@3.0.13
  - @kubb/react@3.0.13

## 3.0.12

### Patch Changes

- [`9f6de42`](https://github.com/kubb-labs/kubb/commit/9f6de4201b503f060a8c856be26918f8e07a84a6) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - 2xx as part of `operations.ts`

- Updated dependencies []:
  - @kubb/core@3.0.12
  - @kubb/fs@3.0.12
  - @kubb/oas@3.0.12
  - @kubb/parser-ts@3.0.12
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
  - @kubb/parser-ts@3.0.11

## 3.0.10

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.0.10
  - @kubb/fs@3.0.10
  - @kubb/oas@3.0.10
  - @kubb/parser-ts@3.0.10
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
  - @kubb/parser-ts@3.0.9

## 3.0.8

### Patch Changes

- [#1400](https://github.com/kubb-labs/kubb/pull/1400) [`569cff0`](https://github.com/kubb-labs/kubb/commit/569cff0a6402830870c3aab7210acdb123b17c48) Thanks [@ekaradon](https://github.com/ekaradon)! - Fix generated zod schema for type file

- Updated dependencies []:
  - @kubb/core@3.0.8
  - @kubb/fs@3.0.8
  - @kubb/oas@3.0.8
  - @kubb/parser-ts@3.0.8
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
  - @kubb/parser-ts@3.0.7

## 3.0.6

### Patch Changes

- Updated dependencies [[`fa04933`](https://github.com/kubb-labs/kubb/commit/fa049330f3c41fd148169b6483ca1bdaa223c715), [`b634bc9`](https://github.com/kubb-labs/kubb/commit/b634bc905fc660e270908d6ee09b01b7f3811bf5), [`a12aa73`](https://github.com/kubb-labs/kubb/commit/a12aa737cf9e5fe63f1b5347cde151de2a6e405e), [`a12aa73`](https://github.com/kubb-labs/kubb/commit/a12aa737cf9e5fe63f1b5347cde151de2a6e405e)]:
  - @kubb/react@3.0.6
  - @kubb/oas@3.0.6
  - @kubb/core@3.0.6
  - @kubb/plugin-oas@3.0.6
  - @kubb/plugin-ts@3.0.6
  - @kubb/fs@3.0.6
  - @kubb/parser-ts@3.0.6

## 3.0.5

### Patch Changes

- Updated dependencies [[`23b8137`](https://github.com/kubb-labs/kubb/commit/23b8137bd69cbc896046a497dc4cbf7bf23d70ec)]:
  - @kubb/react@3.0.5
  - @kubb/plugin-oas@3.0.5
  - @kubb/plugin-ts@3.0.5
  - @kubb/core@3.0.5
  - @kubb/fs@3.0.5
  - @kubb/oas@3.0.5
  - @kubb/parser-ts@3.0.5

## 3.0.4

### Patch Changes

- [#1390](https://github.com/kubb-labs/kubb/pull/1390) [`87f83c1`](https://github.com/kubb-labs/kubb/commit/87f83c191aed01ae4f46da797ba94090778f37a9) Thanks [@aburgel](https://github.com/aburgel)! - fix: Use zod z.coerce instead of z.coercion

- Updated dependencies []:
  - @kubb/core@3.0.4
  - @kubb/fs@3.0.4
  - @kubb/oas@3.0.4
  - @kubb/parser-ts@3.0.4
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
  - @kubb/parser-ts@3.0.3
  - @kubb/react@3.0.3

## 3.0.2

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.0.2
  - @kubb/fs@3.0.2
  - @kubb/oas@3.0.2
  - @kubb/parser-ts@3.0.2
  - @kubb/plugin-oas@3.0.2
  - @kubb/plugin-ts@3.0.2
  - @kubb/react@3.0.2

## 3.0.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@3.0.1
  - @kubb/fs@3.0.1
  - @kubb/oas@3.0.1
  - @kubb/parser-ts@3.0.1
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

- [#1251](https://github.com/kubb-labs/kubb/pull/1251) [`c8cb50d`](https://github.com/kubb-labs/kubb/commit/c8cb50d1e4a13669a05ca11a18352b86a558bce1) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Support for discriminator

- [`8e7a819`](https://github.com/kubb-labs/kubb/commit/8e7a819e72abc1a2abb570947a73c8f72c89a069) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - banner and footer for every file

- [#1259](https://github.com/kubb-labs/kubb/pull/1259) [`2c860f2`](https://github.com/kubb-labs/kubb/commit/2c860f2b8c49cda8ad08540cd3cbfbdd7c12632a) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - 'generators' option for all plugins

- [#1162](https://github.com/kubb-labs/kubb/pull/1162) [`79c2153`](https://github.com/kubb-labs/kubb/commit/79c2153b93187c2dad7d54bc00d6ad869213bb7b) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - output option for all plugins(KubbPlugin) to track the barrel exportType or the output root of every plugin

- [#1282](https://github.com/kubb-labs/kubb/pull/1282) [`4b02d38`](https://github.com/kubb-labs/kubb/commit/4b02d38f1d169887f29934d616fb889373ae410d) Thanks [@ChilloManiac](https://github.com/ChilloManiac)! - Added coercion for specific types only

### Patch Changes

- [#1132](https://github.com/kubb-labs/kubb/pull/1132) [`7bb4a34`](https://github.com/kubb-labs/kubb/commit/7bb4a340927077d5f587f938d09b1381787a4310) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Correct integer parser when used together with coerce

- [`0bcb15b`](https://github.com/kubb-labs/kubb/commit/0bcb15b5502c1ced18205077c0b2e23811660033) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Respect order of `z.tuple`

- [#1127](https://github.com/kubb-labs/kubb/pull/1127) [`9ef278a`](https://github.com/kubb-labs/kubb/commit/9ef278acc3550b96d9477ef3770e5e68fead2cba) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - remove declare module(not being used)

- [#1132](https://github.com/kubb-labs/kubb/pull/1132) [`7bb4a34`](https://github.com/kubb-labs/kubb/commit/7bb4a340927077d5f587f938d09b1381787a4310) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Set default property for schema AST when type of default is not string or boolean

- [#1129](https://github.com/kubb-labs/kubb/pull/1129) [`0860556`](https://github.com/kubb-labs/kubb/commit/08605565794fb1181677a33ea8610b2237f4ee94) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - remove load, transform and writeFile in the plugin context

- [`5b7852b`](https://github.com/kubb-labs/kubb/commit/5b7852b461886f3ae6e7ee75c195013be8d7859c) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Reduce package size

- [#1162](https://github.com/kubb-labs/kubb/pull/1162) [`79c2153`](https://github.com/kubb-labs/kubb/commit/79c2153b93187c2dad7d54bc00d6ad869213bb7b) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Rewrite of generation for exportType 'barrelNamed'

- [#1292](https://github.com/kubb-labs/kubb/pull/1292) [`d70bdfc`](https://github.com/kubb-labs/kubb/commit/d70bdfc40aeeee4389123c2fb175a6c34ec94489) Thanks [@ChilloManiac](https://github.com/ChilloManiac)! - Discard `optional()` if there is a `default()` to ensure the output type is not `T | undefined`

- [#1238](https://github.com/kubb-labs/kubb/pull/1238) [`ebfcb48`](https://github.com/kubb-labs/kubb/commit/ebfcb48dd59e0dc5ec28582b94035d8e25c9ea8d) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Enums should use `z.literal` when format is set to number, string or boolean

- [#1342](https://github.com/kubb-labs/kubb/pull/1342) [`e8c2a7f`](https://github.com/kubb-labs/kubb/commit/e8c2a7f3ef6c41e74acaa6ba6bf7b78a9de00769) Thanks [@ChilloManiac](https://github.com/ChilloManiac)! - Add siblings to parser-zod for better manipulation of the AST

- Updated dependencies [[`c8cb50d`](https://github.com/kubb-labs/kubb/commit/c8cb50d1e4a13669a05ca11a18352b86a558bce1), [`8ad561d`](https://github.com/kubb-labs/kubb/commit/8ad561d3ff79b0e3dac21bc970106049a2338fba), [`9ef278a`](https://github.com/kubb-labs/kubb/commit/9ef278acc3550b96d9477ef3770e5e68fead2cba), [`833da08`](https://github.com/kubb-labs/kubb/commit/833da0820d3b91051d829e53ea2b981a74d37e84), [`7bb4a34`](https://github.com/kubb-labs/kubb/commit/7bb4a340927077d5f587f938d09b1381787a4310), [`8413897`](https://github.com/kubb-labs/kubb/commit/8413897bdc8511090cfdebd7783ad4823a6abf30), [`2fbc18a`](https://github.com/kubb-labs/kubb/commit/2fbc18a74d4e78effb9ce9844ad3ffe7ce7afbdf), [`39072a9`](https://github.com/kubb-labs/kubb/commit/39072a98195adb22b83d5e9857afbc329f20ecac), [`b5bccfa`](https://github.com/kubb-labs/kubb/commit/b5bccfaa79064f74925692966b12ae7906f2eed7), [`a8d645c`](https://github.com/kubb-labs/kubb/commit/a8d645c6a2e1b823f28679d5d27c8166c44cc7e2), [`0fc2205`](https://github.com/kubb-labs/kubb/commit/0fc22058bf79cf8ad543428fbd938cccd604d15c), [`8e7a819`](https://github.com/kubb-labs/kubb/commit/8e7a819e72abc1a2abb570947a73c8f72c89a069), [`20930e9`](https://github.com/kubb-labs/kubb/commit/20930e9b944cb30e134fdf22ddefefab9a1190c0), [`0860556`](https://github.com/kubb-labs/kubb/commit/08605565794fb1181677a33ea8610b2237f4ee94), [`20930e9`](https://github.com/kubb-labs/kubb/commit/20930e9b944cb30e134fdf22ddefefab9a1190c0), [`20930e9`](https://github.com/kubb-labs/kubb/commit/20930e9b944cb30e134fdf22ddefefab9a1190c0), [`20930e9`](https://github.com/kubb-labs/kubb/commit/20930e9b944cb30e134fdf22ddefefab9a1190c0), [`3a9859a`](https://github.com/kubb-labs/kubb/commit/3a9859a5f383f6832a9f056136665f1f7ca6fb72), [`3afc193`](https://github.com/kubb-labs/kubb/commit/3afc1935af6c5ad5233c22ad7c9a135693f0a850), [`2c860f2`](https://github.com/kubb-labs/kubb/commit/2c860f2b8c49cda8ad08540cd3cbfbdd7c12632a), [`5b7852b`](https://github.com/kubb-labs/kubb/commit/5b7852b461886f3ae6e7ee75c195013be8d7859c), [`79c2153`](https://github.com/kubb-labs/kubb/commit/79c2153b93187c2dad7d54bc00d6ad869213bb7b), [`e1a586b`](https://github.com/kubb-labs/kubb/commit/e1a586bffe29b8bc54d8ae27d23b3d8a941d5e37), [`79c2153`](https://github.com/kubb-labs/kubb/commit/79c2153b93187c2dad7d54bc00d6ad869213bb7b), [`a5b8d9e`](https://github.com/kubb-labs/kubb/commit/a5b8d9e396e2b4a61126696309c0d6dbf6d3b990), [`e8e5e03`](https://github.com/kubb-labs/kubb/commit/e8e5e039b413680f4420eb74b2f00c4ef7ed306f), [`622073d`](https://github.com/kubb-labs/kubb/commit/622073d5223180f0945ef0919dc3df841359019f), [`ede86d6`](https://github.com/kubb-labs/kubb/commit/ede86d69e5083252d80f1b1e2f1c18c55e245937), [`81b3a78`](https://github.com/kubb-labs/kubb/commit/81b3a78474b3e53446d98db88571a31a452384e0), [`ebbfac2`](https://github.com/kubb-labs/kubb/commit/ebbfac2dfa9f5245a928070c5fee3fdca7f76059), [`962e2d6`](https://github.com/kubb-labs/kubb/commit/962e2d6d49dff55563be13b1ded832d10743ec29), [`4d5f8d3`](https://github.com/kubb-labs/kubb/commit/4d5f8d3dae94e2cbe82fbbb6578532bdf41bee0d), [`4ae54c7`](https://github.com/kubb-labs/kubb/commit/4ae54c7b0a2ab52701b1215f341595a9d1e7903d), [`ebfcb48`](https://github.com/kubb-labs/kubb/commit/ebfcb48dd59e0dc5ec28582b94035d8e25c9ea8d), [`2fbc18a`](https://github.com/kubb-labs/kubb/commit/2fbc18a74d4e78effb9ce9844ad3ffe7ce7afbdf)]:
  - @kubb/plugin-oas@3.0.0
  - @kubb/plugin-ts@3.0.0
  - @kubb/oas@3.0.0
  - @kubb/core@3.0.0
  - @kubb/react@3.0.0
  - @kubb/fs@3.0.0
  - @kubb/parser-ts@3.0.0

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

- Updated dependencies []:
  - @kubb/core@2.23.1
  - @kubb/fs@2.23.1
  - @kubb/oas@2.23.1
  - @kubb/parser-ts@2.23.1
  - @kubb/plugin-oas@2.23.1
  - @kubb/react@2.23.1
  - @kubb/plugin-ts@2.23.1

## 2.23.0

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

### Minor Changes

- [#1065](https://github.com/kubb-labs/kubb/pull/1065) [`56687ec`](https://github.com/kubb-labs/kubb/commit/56687ec0deec06f3b42f8b4e18a1064b9474032b) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Export schemaType with z.infer

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

### Minor Changes

- [#1051](https://github.com/kubb-labs/kubb/pull/1051) [`88b2069`](https://github.com/kubb-labs/kubb/commit/88b2069dcbb52b908ff58ee52969fea2764e13fc) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - coercion option to enable/disable z.coerce

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

### Minor Changes

- [#1046](https://github.com/kubb-labs/kubb/pull/1046) [`18250ca`](https://github.com/kubb-labs/kubb/commit/18250cab70bd7d9b8816475a76c5bdbb630f75c4) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Custom importpath for zod(with support for i18n-zod)

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

- [#1037](https://github.com/kubb-labs/kubb/pull/1037) [`c0e2a9c`](https://github.com/kubb-labs/kubb/commit/c0e2a9c5bbc85e657e9a1dee3534b5113d67b4aa) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Add the ability to use the coerce option for primitives in the Zod plugin configuration.

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

- [`5285a0b`](https://github.com/kubb-labs/kubb/commit/5285a0b974f5039723aaa2beb6aed2d758f4fc01) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Zod cannot use min/max for z.tuple

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

- [#951](https://github.com/kubb-labs/kubb/pull/951) [`eac4bb5`](https://github.com/kubb-labs/kubb/commit/eac4bb525a6857b3a0e4c04d52e3de5d2f568d4f) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Add local property for datetime

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

- [`eb0c507`](https://github.com/kubb-labs/kubb/commit/eb0c507380143f4e2634ed844580c3337cef33fd) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Better datetime schema validation

- [#929](https://github.com/kubb-labs/kubb/pull/929) [`e32b6bd`](https://github.com/kubb-labs/kubb/commit/e32b6bda3d676b099dd28c6ab380cf22abb44895) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Nullable enums are not generated as nullable

- [#929](https://github.com/kubb-labs/kubb/pull/929) [`e32b6bd`](https://github.com/kubb-labs/kubb/commit/e32b6bda3d676b099dd28c6ab380cf22abb44895) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - exclude min/max out of Array schema

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

### Minor Changes

- [#898](https://github.com/kubb-labs/kubb/pull/898) [`d9191db`](https://github.com/kubb-labs/kubb/commit/d9191db9267b13acf4af40fb0bbe9c9d2cd39ca3) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - operations mapping grouped by method and operationdId

### Patch Changes

- Updated dependencies [[`d9191db`](https://github.com/kubb-labs/kubb/commit/d9191db9267b13acf4af40fb0bbe9c9d2cd39ca3)]:
  - @kubb/core@2.12.0
  - @kubb/react@2.12.0
  - @kubb/swagger@2.12.0
  - @kubb/plugin-ts@2.12.0
  - @kubb/parser@2.12.0

## 2.11.1

### Patch Changes

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

- [#880](https://github.com/kubb-labs/kubb/pull/880) [`a8d632d`](https://github.com/kubb-labs/kubb/commit/a8d632dc23c6a6ee5af35aca4eb140a1b6633bbb) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - z.and with .describe when using a description in your schema

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

- [`0c9d5c4`](https://github.com/kubb-labs/kubb/commit/0c9d5c46e0b06fd28009ab18cb39e9a60e7b3258) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - readOnly should omit and not use `z.readonly`

- Updated dependencies []:
  - @kubb/core@2.8.1
  - @kubb/parser@2.8.1
  - @kubb/react@2.8.1
  - @kubb/swagger@2.8.1
  - @kubb/plugin-ts@2.8.1

## 2.8.0

### Patch Changes

- [#852](https://github.com/kubb-labs/kubb/pull/852) [`752f9a0`](https://github.com/kubb-labs/kubb/commit/752f9a02f642f2c5e948b96622fdc73c33d571b8) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - useOperation and useSchema with a component Oas and Oas.Operation

- [#852](https://github.com/kubb-labs/kubb/pull/852) [`752f9a0`](https://github.com/kubb-labs/kubb/commit/752f9a02f642f2c5e948b96622fdc73c33d571b8) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - use of `useOperationHelpers` to abstract operation logic

- Updated dependencies [[`752f9a0`](https://github.com/kubb-labs/kubb/commit/752f9a02f642f2c5e948b96622fdc73c33d571b8), [`e2eed44`](https://github.com/kubb-labs/kubb/commit/e2eed4482e2e49d41c87e64eb484ebedbeb3ccc8)]:
  - @kubb/plugin-ts@2.8.0
  - @kubb/swagger@2.8.0
  - @kubb/react@2.8.0
  - @kubb/core@2.8.0
  - @kubb/parser@2.8.0

## 2.7.2

### Patch Changes

- [`5857667`](https://github.com/kubb-labs/kubb/commit/5857667ca41cbc8fb983d335691fa8c8047e1f48) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Support x-nullable as an alternative to nullable behind an option

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

- [`dc95f9d`](https://github.com/kubb-labs/kubb/commit/dc95f9da65e264208d063f730d240d6d5df47bf8) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Ability to use the email field with my own validation rules

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

- [`a18fe79`](https://github.com/kubb-labs/kubb/commit/a18fe7996907a5a7615cdde049d5d97e98fcf0c7) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - single file import fix for Zod

- Updated dependencies []:
  - @kubb/core@2.6.2
  - @kubb/parser@2.6.2
  - @kubb/react@2.6.2
  - @kubb/swagger@2.6.2
  - @kubb/plugin-ts@2.6.2

## 2.6.1

### Patch Changes

- [#821](https://github.com/kubb-labs/kubb/pull/821) [`1383571`](https://github.com/kubb-labs/kubb/commit/1383571a360257adff728265735283fa45ba8e94) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - anyOf with strict when using z.object

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

- Updated dependencies []:
  - @kubb/core@2.5.3
  - @kubb/parser@2.5.3
  - @kubb/react@2.5.3
  - @kubb/swagger@2.5.3
  - @kubb/plugin-ts@2.5.3

## 2.5.2

### Patch Changes

- [#807](https://github.com/kubb-labs/kubb/pull/807) [`4924023`](https://github.com/kubb-labs/kubb/commit/49240237e35604434ae960d5f14c978f10f1779f) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - array type with min/max

- [#809](https://github.com/kubb-labs/kubb/pull/809) [`f9f3dfb`](https://github.com/kubb-labs/kubb/commit/f9f3dfbe4fbdbd2c51549b6bfc1e3831cb0ffa15) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - use of casting for type option

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

- [#780](https://github.com/kubb-labs/kubb/pull/780) [`b719759`](https://github.com/kubb-labs/kubb/commit/b7197592cfbba181a1ed7995c33e640bafb91236) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Add types with `@kubb/swagger.ts` for zodSchemas

- [#780](https://github.com/kubb-labs/kubb/pull/780) [`b719759`](https://github.com/kubb-labs/kubb/commit/b7197592cfbba181a1ed7995c33e640bafb91236) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - dateType for zod

- Updated dependencies []:
  - @kubb/core@2.4.0
  - @kubb/parser@2.4.0
  - @kubb/react@2.4.0
  - @kubb/swagger@2.4.0
  - @kubb/plugin-ts@2.4.0

## 2.3.0

### Patch Changes

- Updated dependencies [[`ec9c07d`](https://github.com/kubb-labs/kubb/commit/ec9c07d90eb3472f5d0030a1cbb746e0055b8ab8)]:
  - @kubb/parser@2.3.0
  - @kubb/core@2.3.0
  - @kubb/react@2.3.0
  - @kubb/swagger@2.3.0

## 2.2.1

### Patch Changes

- [#771](https://github.com/kubb-labs/kubb/pull/771) [`6165dda`](https://github.com/kubb-labs/kubb/commit/6165ddafca56f450f249a26a1f426509170edb8c) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Optional properties with type: array allow it's values to be undefined in zod shape

- [#771](https://github.com/kubb-labs/kubb/pull/771) [`6165dda`](https://github.com/kubb-labs/kubb/commit/6165ddafca56f450f249a26a1f426509170edb8c) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - uri should not generate an URL for Zod

- [#771](https://github.com/kubb-labs/kubb/pull/771) [`6165dda`](https://github.com/kubb-labs/kubb/commit/6165ddafca56f450f249a26a1f426509170edb8c) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - min/max with schema.type == string

- Updated dependencies []:
  - @kubb/core@2.2.1
  - @kubb/parser@2.2.1
  - @kubb/react@2.2.1
  - @kubb/swagger@2.2.1

## 2.2.0

### Minor Changes

- [`2c20339`](https://github.com/kubb-labs/kubb/commit/2c20339cfac5c0789f6bf9086b6106feba4cbbde) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - support x-enum-varnames

### Patch Changes

- [#765](https://github.com/kubb-labs/kubb/pull/765) [`9c17a9e`](https://github.com/kubb-labs/kubb/commit/9c17a9e1538961fe07f21e6999d4be2aedb896ea) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Zod generated types for all parameters as optional is missing .optional() method call on root object

- Updated dependencies [[`9c17a9e`](https://github.com/kubb-labs/kubb/commit/9c17a9e1538961fe07f21e6999d4be2aedb896ea)]:
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

## 2.1.5

### Patch Changes

- Updated dependencies []:
  - @kubb/core@2.1.5
  - @kubb/parser@2.1.5
  - @kubb/react@2.1.5
  - @kubb/swagger@2.1.5

## 2.1.4

### Patch Changes

- Updated dependencies []:
  - @kubb/core@2.1.4
  - @kubb/parser@2.1.4
  - @kubb/react@2.1.4
  - @kubb/swagger@2.1.4

## 2.1.3

### Patch Changes

- Updated dependencies [[`9307bda`](https://github.com/kubb-labs/kubb/commit/9307bda2c2dc08503809eec7d048bba4e6388121)]:
  - @kubb/core@2.1.3
  - @kubb/react@2.1.3
  - @kubb/swagger@2.1.3
  - @kubb/parser@2.1.3

## 2.1.2

### Patch Changes

- Updated dependencies []:
  - @kubb/core@2.1.2
  - @kubb/parser@2.1.2
  - @kubb/react@2.1.2
  - @kubb/swagger@2.1.2

## 2.1.1

### Patch Changes

- Updated dependencies []:
  - @kubb/core@2.1.1
  - @kubb/parser@2.1.1
  - @kubb/react@2.1.1
  - @kubb/swagger@2.1.1

## 2.1.0

### Minor Changes

- [#713](https://github.com/kubb-labs/kubb/pull/713) [`c22433e`](https://github.com/kubb-labs/kubb/commit/c22433ec2c1b04527d72a6de44e524e580e2d876) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - `barrelNamed` for `exportType` to use `export { nameX, nameY } from '.'`

### Patch Changes

- [#744](https://github.com/kubb-labs/kubb/pull/744) [`1927d89`](https://github.com/kubb-labs/kubb/commit/1927d8972db283936e3a5f2b74401f1566ca0638) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Removal of '.schema' for references

- Updated dependencies [[`c22433e`](https://github.com/kubb-labs/kubb/commit/c22433ec2c1b04527d72a6de44e524e580e2d876)]:
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

## 2.0.5

### Patch Changes

- [#725](https://github.com/kubb-labs/kubb/pull/725) [`f68845b`](https://github.com/kubb-labs/kubb/commit/f68845b5c294e7ff56bc9187e86897850e6de8de) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - remove log

- Updated dependencies []:
  - @kubb/core@2.0.5
  - @kubb/parser@2.0.5
  - @kubb/react@2.0.5
  - @kubb/swagger@2.0.5

## 2.0.4

## 2.0.3

### Patch Changes

- Updated dependencies []:
  - @kubb/core@2.0.3
  - @kubb/parser@2.0.3
  - @kubb/react@2.0.3
  - @kubb/swagger@2.0.3

## 2.0.2

### Patch Changes

- [#718](https://github.com/kubb-labs/kubb/pull/718) [`31c7870`](https://github.com/kubb-labs/kubb/commit/31c7870c0519b6368f4209ff6817029bdfc630f9) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Generated zod schema causes ReferenceError in case of self-referencing property

- Updated dependencies []:
  - @kubb/core@2.0.2
  - @kubb/parser@2.0.2
  - @kubb/react@2.0.2
  - @kubb/swagger@2.0.2

## 2.0.1

### Patch Changes

- Updated dependencies []:
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

- [#683](https://github.com/kubb-labs/kubb/pull/683) [`c7722cf`](https://github.com/kubb-labs/kubb/commit/c7722cf16113e4d7ac33e5281e650e707a1e5f88) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - add `const` logic + move `schema.format` to `getBaseTypeFromSchema` instead of `getTypeFromProperties`

### Patch Changes

- [#689](https://github.com/kubb-labs/kubb/pull/689) [`8044907`](https://github.com/kubb-labs/kubb/commit/8044907f560f1e9a6120df259568b9213a4f1e4a) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - path.extName to set `.ts` or `.js` to the barrel files

- [#707](https://github.com/kubb-labs/kubb/pull/707) [`955f8ed`](https://github.com/kubb-labs/kubb/commit/955f8edc26ca303f3432ed875a97e249c88df89b) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - use of combineFiles

- [`e17bc7c`](https://github.com/kubb-labs/kubb/commit/e17bc7ccfb91aeab52488e847356890464aa6166) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - tsup build cleanup with `splitting`

- Updated dependencies [[`0c894ca`](https://github.com/kubb-labs/kubb/commit/0c894ca935045272a3427ed5646a83184646e354), [`955f8ed`](https://github.com/kubb-labs/kubb/commit/955f8edc26ca303f3432ed875a97e249c88df89b), [`d729470`](https://github.com/kubb-labs/kubb/commit/d729470b74121eef6776649654921ce61b35da51), [`d729470`](https://github.com/kubb-labs/kubb/commit/d729470b74121eef6776649654921ce61b35da51), [`48b7ff2`](https://github.com/kubb-labs/kubb/commit/48b7ff246a3459bb7a9be6d430407c2538d3b2eb), [`8044907`](https://github.com/kubb-labs/kubb/commit/8044907f560f1e9a6120df259568b9213a4f1e4a), [`6348057`](https://github.com/kubb-labs/kubb/commit/634805723409381eace8e68fd5f2eab6f737dd7a), [`210d58f`](https://github.com/kubb-labs/kubb/commit/210d58fd1fcc1e8d84f38fdfabbb59630a7394b5), [`0c894ca`](https://github.com/kubb-labs/kubb/commit/0c894ca935045272a3427ed5646a83184646e354), [`48b7ff2`](https://github.com/kubb-labs/kubb/commit/48b7ff246a3459bb7a9be6d430407c2538d3b2eb), [`955f8ed`](https://github.com/kubb-labs/kubb/commit/955f8edc26ca303f3432ed875a97e249c88df89b), [`d729470`](https://github.com/kubb-labs/kubb/commit/d729470b74121eef6776649654921ce61b35da51), [`955f8ed`](https://github.com/kubb-labs/kubb/commit/955f8edc26ca303f3432ed875a97e249c88df89b), [`e17bc7c`](https://github.com/kubb-labs/kubb/commit/e17bc7ccfb91aeab52488e847356890464aa6166)]:
  - @kubb/swagger@2.0.0
  - @kubb/core@2.0.0
  - @kubb/parser@2.0.0
  - @kubb/react@2.0.0
