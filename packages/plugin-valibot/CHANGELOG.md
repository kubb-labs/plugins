# @kubb/plugin-valibot

## 0.4.3

### Patch Changes

- [#1628](https://github.com/kubb-labs/plugins/pull/1628) [`85b1545`](https://github.com/kubb-labs/plugins/commit/85b1545c56ae8ee026f8bc7ef2ae725e9135125b) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Use Kubb 5.28.0. With `operations: 'inline'`, a type a generated file uses more than once is now declared once in that file instead of being repeated at each use.

## 0.4.2

### Patch Changes

- [#1624](https://github.com/kubb-labs/plugins/pull/1624) [`30e01bf`](https://github.com/kubb-labs/plugins/commit/30e01bf75d7dfe7376a8325409278e8c39429ff0) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Require Kubb `^5.27.1`, which aliases an inlined import that clashes with a name the file already uses.

## 0.4.1

### Patch Changes

- [#1613](https://github.com/kubb-labs/plugins/pull/1613) [`9d42761`](https://github.com/kubb-labs/plugins/commit/9d42761deac1eb840523ae201db7b4eb4649fcdd) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Require Kubb `^5.25.1`, which gives an `operationId` that is already taken a `_2`, `_3`, … suffix.

- [#1623](https://github.com/kubb-labs/plugins/pull/1623) [`e7b74b9`](https://github.com/kubb-labs/plugins/commit/e7b74b9137da6c8a42e44ab0a08a93d0e0958f6b) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Require Kubb `^5.27.0`. Inline enums on parameters and response headers now get the `enumSuffix`, so `FindPetsByStatusStatus` becomes `FindPetsByStatusStatusEnum` with the defaults.

- [#1617](https://github.com/kubb-labs/plugins/pull/1617) [`3e41f0d`](https://github.com/kubb-labs/plugins/commit/3e41f0d892098a391a8471971926a642b0ba7f3d) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Name each plugin's options types after the plugin, such as `PluginFetchOptions` and `PluginZodResolvedOptions`. The old names keep working until v6:
  
  | Package | Deprecated | Use instead |
  | --- | --- | --- |
  | `@kubb/plugin-client` | `Options`, `ResolvedOptions` | `PluginClientOptions`, `PluginClientResolvedOptions` |
  | `@kubb/plugin-axios`, `@kubb/plugin-fetch`, `@kubb/plugin-ky` | `Options` | `PluginAxiosOptions`, `PluginFetchOptions`, `PluginKyOptions` |
  | `@kubb/plugin-axios`, `@kubb/plugin-fetch`, `@kubb/plugin-ky` | `ResolvedOptions` | `ClientResolvedOptions` |
  | `@kubb/plugin-react-query`, `@kubb/plugin-swr`, `@kubb/plugin-vue-query` | `Transformer` | `KeyTransformer` |

## 0.4.0

### Minor Changes

- [#1591](https://github.com/kubb-labs/plugins/pull/1591) [`7823fd3`](https://github.com/kubb-labs/plugins/commit/7823fd31ccc2092da0386b178707383f7f8d9bfc) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Validate the `not` keyword. A schema with `not` was printed without it, so the validator accepted values the document forbids.
  
  - `@kubb/plugin-zod` adds a `refine` that fails when the value matches the `not` schema. `zod/mini` gets the same check through `z.refine`.
  - `@kubb/plugin-valibot` adds a `v.check` that fails when the value matches the `not` schema.
  - `@kubb/plugin-zod` with `mini: true` prints `z.iso.datetime()` for a `date-time` string, with the `offset` and `local` flags, like the standard printer. It printed `z.string()`.
  - A `pattern` that JavaScript cannot compile reports a `KUBB_INVALID_SPEC` diagnostic that names the pattern. It was a bare `SyntaxError`.

### Patch Changes

- [#1594](https://github.com/kubb-labs/plugins/pull/1594) [`473e23b`](https://github.com/kubb-labs/plugins/commit/473e23ba2b3368069f38010a0df6db77ac18b3f3) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Two generators now share code with their siblings, which fixes two small differences.
  
  - `@kubb/plugin-valibot` uses the `description` of a request body for its schema comment, as `@kubb/plugin-zod` does.
  - The `HookOptions` type of `@kubb/plugin-react-query` reads `override`, `include` and `exclude` the same way the hook files do. An `override` on `method` matched only the exact case there.

- [#1593](https://github.com/kubb-labs/plugins/pull/1593) [`9b5b769`](https://github.com/kubb-labs/plugins/commit/9b5b769f2a4f24ada778737ed5322cc8433412ac) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Remove stale package metadata: `typesVersions` entries for files that are not built, a `files` entry for a folder that does not exist, and unused dependencies. `@kubb/*` dependencies now read their range from the workspace catalog. The published range is unchanged.

## 0.3.0

### Minor Changes

- [#1573](https://github.com/kubb-labs/plugins/pull/1573) [`2c716b6`](https://github.com/kubb-labs/plugins/commit/2c716b65b093cc7187133e33fb34885040c94d5f) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Write files with kit templates instead of generators, and stop using deprecated kit APIs. Generated output does not change.
  
  - Each plugin registers its templates with `addTemplate`. The exported ones are `typeSchema` and `typeOperation` (plugin-ts), `fakerSchema` and `fakerOperation`, `valibotSchema` and `valibotOperation`, `cypressOperation`, and `mcpOperation` and `serverOperations` (plugin-mcp). Another plugin can register them or call their `render`.
  - `typeGenerator`, `fakerGenerator`, `valibotGenerator`, `cypressGenerator`, `mcpGenerator` and `serverGenerator` are removed. Register the templates above with `addTemplate` instead.
  - `setupClient` no longer takes `name`.
  - The user's `macros` option goes to `addMacro` instead of the deprecated `setMacros`.
  - Each plugin keeps its templates in `src/templates/`.

### Patch Changes

- [#1561](https://github.com/kubb-labs/plugins/pull/1561) [`bb317df`](https://github.com/kubb-labs/plugins/commit/bb317dff2871609ff9717fc1dd9dda17670800a8) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Write each module's imports as one `File.Import` with `names`, in place of the deprecated `name`, `isTypeOnly` and `isNameSpace`. The generated code is unchanged.

## 0.2.2

### Patch Changes

- [#1566](https://github.com/kubb-labs/plugins/pull/1566) [`dfdc37e`](https://github.com/kubb-labs/plugins/commit/dfdc37ef039f84c684cfb2a436446c4268783ec9) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Allow custom adapters with `@kubb/plugin-zod` and `@kubb/plugin-valibot`. Generation no longer fails with `KUBB_ADAPTER_REQUIRED` when the adapter is not `adapterOas`.
  
  Both printers now read offset and local date-times only from the `offset` and `local` flags on the `datetime` node, which `adapterOas` already sets from `dateType`. The `dateType` option of `printerZod` and `printerValibot` is removed. If you call a printer directly, set `offset: true` or `local: true` on the node instead.

## 0.2.1

### Patch Changes

- [#1549](https://github.com/kubb-labs/plugins/pull/1549) [`1cdfb5c`](https://github.com/kubb-labs/plugins/commit/1cdfb5cea7a71928cbb1102a35f82b4cc0efe308) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Plugins find their files with kit's `ctx.file` and import each other's names with `from`, `provide` and `code`, instead of looking up each other's paths.
  
  - A resolver `name` override renames TanStack hooks (react-query, vue-query, swr) and msw handlers, but no longer their files. Those files are named from the `operationId`.
  - Named imports list their names in alphabetical order.
  - A query or MCP plugin without its client plugin in the config reports `KUBB_PLUGIN_NOT_FOUND`.
  - Operation types come from plugin-ts, or from `pluginZod({ inferred })`, in the same order as before: codec types first, then plugin-ts, then plain inferred types.

- [#1560](https://github.com/kubb-labs/plugins/pull/1560) [`8567cc1`](https://github.com/kubb-labs/plugins/commit/8567cc1216e12c74acca48a4d72ebd69d26cc432) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Require Kubb `^5.23.3`, which adds `Code`, `Raw`, `Origin`, `<File inline>` and `ctx.getFile`. These plugins use them.

- [#1549](https://github.com/kubb-labs/plugins/pull/1549) [`1cdfb5c`](https://github.com/kubb-labs/plugins/commit/1cdfb5cea7a71928cbb1102a35f82b4cc0efe308) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Build each plugin's printer once per build with kit's `setPrinter`, instead of once per schema. Generated output is unchanged.
  
  - Generators read the printer as `ctx.printer` and pass per-node options with `printer.with(...)`.
  - Remove the `buildMemo` printer option from zod and valibot. Each printer keeps its own cache.
  - Prefix the zod and valibot memo keys with the plugin name, such as `plugin-zod:typeName`.

## 0.2.0

### Minor Changes

- [#1540](https://github.com/kubb-labs/plugins/pull/1540) [`0ac3c3f`](https://github.com/kubb-labs/plugins/commit/0ac3c3f3fd00b2cd02df0caebe8605ae8592fc32) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - The `resolver` option now takes an array of resolver parts as well as one patch. The parts merge left to right over the plugin's default resolver.
  
  ```ts
  import { casing, resolverCasedFile } from '@kubb/kit'
  
  pluginTs({ resolver: [resolverCasedFile(casing.camel), { name: (name) => `Api${name}` }] })
  ```

## 0.1.1

### Patch Changes

- [#1537](https://github.com/kubb-labs/plugins/pull/1537) [`02b78e4`](https://github.com/kubb-labs/plugins/commit/02b78e446dce19df167f582853851cb63f75660b) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Depend on `@kubb/ast` directly, at the same version as `@kubb/kit`. Generated code does not change.

- [#1535](https://github.com/kubb-labs/plugins/pull/1535) [`0441805`](https://github.com/kubb-labs/plugins/commit/0441805441348a5f64cf633cbea38b81072fc0bb) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - `@kubb/plugin-msw` handlers import `MswBody` from a shared `.kubb/mswBody.ts` instead of declaring it in each file.

## 0.1.0

### Minor Changes

- [#1497](https://github.com/kubb-labs/plugins/pull/1497) [`9cc713f`](https://github.com/kubb-labs/plugins/commit/9cc713f66aac9a216570c2e31d6019980f670d93) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Add `@kubb/plugin-valibot`, which generates a [Valibot](https://valibot.dev) schema for every schema in your OpenAPI spec, plus the parameter, request, and response schemas of each operation. Set `inferred: true` to export a type next to each schema, `coercion` to convert input before validation, and `typeGuards` to add `is*` and `assert*` functions. With `dateType: 'date'` on the adapter, response schemas parse a date string into a `Date` and request schemas write it back.
  
  ```ts
  import { pluginValibot } from '@kubb/plugin-valibot'
  
  export default defineConfig({
    plugins: [pluginValibot({ inferred: true })],
  })
  ```

### Patch Changes

- [#1506](https://github.com/kubb-labs/plugins/pull/1506) [`38204b3`](https://github.com/kubb-labs/plugins/commit/38204b3a786cc285b73fc09007794836f0cfcf04) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Use Kubb 5.21.2.

- [#1505](https://github.com/kubb-labs/plugins/pull/1505) [`e47b1e9`](https://github.com/kubb-labs/plugins/commit/e47b1e9fbd0de17b9146afbc30775e2ab4dbd2ca) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Mark `@kubb/plugin-ky` and `@kubb/plugin-valibot` as beta in `kubb-extension.json`. kubb.dev and Kubb Studio show a Beta badge for them. Their options and output can still change in a minor release.
