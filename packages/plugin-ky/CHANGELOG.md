# @kubb/plugin-ky

## 0.5.0

### Minor Changes

- [#1591](https://github.com/kubb-labs/plugins/pull/1591) [`7823fd3`](https://github.com/kubb-labs/plugins/commit/7823fd31ccc2092da0386b178707383f7f8d9bfc) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - The generated client throws a `TypeError` for a path parameter it cannot send safely. Regenerate to get the new `.kubb/core.ts`.
  
  - A missing path parameter throws `Missing path parameter petId.` Before, `/pets/{petId}` was sent as `/pets/`, which is another endpoint.
  - A path parameter of `.` or `..` throws, because a URL parser resolves it against the path.
  - An API key sent as a cookie throws when it holds a character a cookie cannot carry, such as `;`, which would start another cookie.
  - A JSON Lines record that is not valid JSON throws a `ValidationError`, like every other JSON body. It was a `SyntaxError`.
  - `onValidationError` gets the URL template for a response failure, as it does for a request failure. The resolved URL could carry an API key in its query.

### Patch Changes

- [#1604](https://github.com/kubb-labs/plugins/pull/1604) [`0810d30`](https://github.com/kubb-labs/plugins/commit/0810d30ac91f276516e057db0c4c07ded38ff692) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Fix two client runtime types that rejected code the runtime accepts. The client config `headers` now takes a `Headers` instance, and a request or response interceptor may return nothing to keep the value. Regenerate to get the new types.

- [#1594](https://github.com/kubb-labs/plugins/pull/1594) [`473e23b`](https://github.com/kubb-labs/plugins/commit/473e23ba2b3368069f38010a0df6db77ac18b3f3) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Split the generated `.kubb/core.ts` into `core.ts`, `types.ts`, `auth.ts` and `retry.ts`. `.kubb/client.ts` exports the same names as before, so imports from it keep working. Regenerate to get the new files.

- [#1593](https://github.com/kubb-labs/plugins/pull/1593) [`9b5b769`](https://github.com/kubb-labs/plugins/commit/9b5b769f2a4f24ada778737ed5322cc8433412ac) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Remove stale package metadata: `typesVersions` entries for files that are not built, a `files` entry for a folder that does not exist, and unused dependencies. `@kubb/*` dependencies now read their range from the workspace catalog. The published range is unchanged.
- Updated dependencies [[`7823fd3`](https://github.com/kubb-labs/plugins/commit/7823fd31ccc2092da0386b178707383f7f8d9bfc), [`0810d30`](https://github.com/kubb-labs/plugins/commit/0810d30ac91f276516e057db0c4c07ded38ff692), [`7823fd3`](https://github.com/kubb-labs/plugins/commit/7823fd31ccc2092da0386b178707383f7f8d9bfc), [`473e23b`](https://github.com/kubb-labs/plugins/commit/473e23ba2b3368069f38010a0df6db77ac18b3f3), [`9b5b769`](https://github.com/kubb-labs/plugins/commit/9b5b769f2a4f24ada778737ed5322cc8433412ac)]:
  - @kubb/plugin-client@6.6.0

## 0.4.0

### Minor Changes

- [#1582](https://github.com/kubb-labs/plugins/pull/1582) [`f12f161`](https://github.com/kubb-labs/plugins/commit/f12f1611f249b32ca278cfa37d3fc891396d167b) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Add `importPath` to `pluginFetch`, `pluginAxios`, and `pluginKy`. The generated operations, SDK classes, and query hooks import the client from that module, and Kubb still writes the full `.kubb/` runtime, including `config.ts`. The module re-exports `.kubb/client.ts` and overrides what it needs, such as a pre-configured `client`. Typed response headers and `securitySchemes` stay, also in the query hooks, and the headers validator helper still comes from `.kubb/standardSchema.ts`.

### Patch Changes

- [#1573](https://github.com/kubb-labs/plugins/pull/1573) [`2c716b6`](https://github.com/kubb-labs/plugins/commit/2c716b65b093cc7187133e33fb34885040c94d5f) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Write files with kit templates instead of generators, and stop using deprecated kit APIs. Generated output does not change.
  
  - Each plugin registers its templates with `addTemplate`. The exported ones are `typeSchema` and `typeOperation` (plugin-ts), `fakerSchema` and `fakerOperation`, `valibotSchema` and `valibotOperation`, `cypressOperation`, and `mcpOperation` and `serverOperations` (plugin-mcp). Another plugin can register them or call their `render`.
  - `typeGenerator`, `fakerGenerator`, `valibotGenerator`, `cypressGenerator`, `mcpGenerator` and `serverGenerator` are removed. Register the templates above with `addTemplate` instead.
  - `setupClient` no longer takes `name`.
  - The user's `macros` option goes to `addMacro` instead of the deprecated `setMacros`.
  - Each plugin keeps its templates in `src/templates/`.

- [#1579](https://github.com/kubb-labs/plugins/pull/1579) [`a49a20d`](https://github.com/kubb-labs/plugins/commit/a49a20d97df981c4d990846af71866ce18b029a6) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - The template types of `@kubb/plugin-fetch`, `@kubb/plugin-axios`, and `@kubb/plugin-ky` now use the plugin's own `NativeOptions`, so they match the generated `.kubb/` runtime. `import.meta.resolve('@kubb/plugin-fetch/templates/client.ts')` resolves to the template file again, and so do the same paths in `@kubb/plugin-axios` and `@kubb/plugin-ky`.
- Updated dependencies [[`2c716b6`](https://github.com/kubb-labs/plugins/commit/2c716b65b093cc7187133e33fb34885040c94d5f), [`bb317df`](https://github.com/kubb-labs/plugins/commit/bb317dff2871609ff9717fc1dd9dda17670800a8), [`2c716b6`](https://github.com/kubb-labs/plugins/commit/2c716b65b093cc7187133e33fb34885040c94d5f), [`f12f161`](https://github.com/kubb-labs/plugins/commit/f12f1611f249b32ca278cfa37d3fc891396d167b)]:
  - @kubb/plugin-client@6.5.0

## 0.3.1

### Patch Changes

- [#1549](https://github.com/kubb-labs/plugins/pull/1549) [`1cdfb5c`](https://github.com/kubb-labs/plugins/commit/1cdfb5cea7a71928cbb1102a35f82b4cc0efe308) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Plugins find their files with kit's `ctx.file` and import each other's names with `from`, `provide` and `code`, instead of looking up each other's paths.
  
  - A resolver `name` override renames TanStack hooks (react-query, vue-query, swr) and msw handlers, but no longer their files. Those files are named from the `operationId`.
  - Named imports list their names in alphabetical order.
  - A query or MCP plugin without its client plugin in the config reports `KUBB_PLUGIN_NOT_FOUND`.
  - Operation types come from plugin-ts, or from `pluginZod({ inferred })`, in the same order as before: codec types first, then plugin-ts, then plain inferred types.

- [#1560](https://github.com/kubb-labs/plugins/pull/1560) [`8567cc1`](https://github.com/kubb-labs/plugins/commit/8567cc1216e12c74acca48a4d72ebd69d26cc432) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Require Kubb `^5.23.3`, which adds `Code`, `Raw`, `Origin`, `<File inline>` and `ctx.getFile`. These plugins use them.
- Updated dependencies [[`1cdfb5c`](https://github.com/kubb-labs/plugins/commit/1cdfb5cea7a71928cbb1102a35f82b4cc0efe308), [`8567cc1`](https://github.com/kubb-labs/plugins/commit/8567cc1216e12c74acca48a4d72ebd69d26cc432), [`1cdfb5c`](https://github.com/kubb-labs/plugins/commit/1cdfb5cea7a71928cbb1102a35f82b4cc0efe308)]:
  - @kubb/plugin-client@6.4.1

## 0.3.0

### Minor Changes

- [#1540](https://github.com/kubb-labs/plugins/pull/1540) [`0ac3c3f`](https://github.com/kubb-labs/plugins/commit/0ac3c3f3fd00b2cd02df0caebe8605ae8592fc32) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - The `resolver` option now takes an array of resolver parts as well as one patch. The parts merge left to right over the plugin's default resolver.
  
  ```ts
  import { casing, resolverCasedFile } from '@kubb/kit'
  
  pluginTs({ resolver: [resolverCasedFile(casing.camel), { name: (name) => `Api${name}` }] })
  ```

### Patch Changes

- Updated dependencies [[`0ac3c3f`](https://github.com/kubb-labs/plugins/commit/0ac3c3f3fd00b2cd02df0caebe8605ae8592fc32)]:
  - @kubb/plugin-client@6.4.0

## 0.2.0

### Minor Changes

- [#1516](https://github.com/kubb-labs/plugins/pull/1516) [`88228cd`](https://github.com/kubb-labs/plugins/commit/88228cd562165a1bd90ac9a94ab1f7fb8dee00dc) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Add an opt-in `retry` setting to the generated client, on `client.setConfig` and on each call. It retries a transport error and the statuses 408, 429, 500, 502, 503, and 504, and works the same on fetch, axios, and ky.
  
  ```ts
  client.setConfig({ retry: 2 })
  
  await createOrder({ body, retry: { methods: ['POST'] } })
  await chargeCard({ body, retry: false })
  ```
  
  Retries are off unless you set `retry`. `POST` and `PATCH` are retried only when `retry.methods` names them. A streaming call with `retry` reopens a dropped Server-Sent Events stream with its `Last-Event-ID`. On the Ky client, a call with `retry` on switches Ky's own retry off.

- [#1513](https://github.com/kubb-labs/plugins/pull/1513) [`4a23069`](https://github.com/kubb-labs/plugins/commit/4a23069f87f2d89d72fb77ea4ff5a6524d05f063) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Rename `ParseError` to `ValidationError`, to match `onValidationError`. `ParseError` is still exported as a deprecated alias, so existing imports and `instanceof ParseError` checks keep working. `error.name` is now `'ValidationError'`: update any check on `error.name === 'ParseError'`.

### Patch Changes

- [#1513](https://github.com/kubb-labs/plugins/pull/1513) [`4a23069`](https://github.com/kubb-labs/plugins/commit/4a23069f87f2d89d72fb77ea4ff5a6524d05f063) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Keep the HTTP status when a response body fails its schema. A `ValidationError` thrown inside a call now carries `status`, `method`, `direction`, and `source`, so `error.status === 404` works when a non-2xx body does not match its error schema.
- Updated dependencies [[`88228cd`](https://github.com/kubb-labs/plugins/commit/88228cd562165a1bd90ac9a94ab1f7fb8dee00dc), [`4a23069`](https://github.com/kubb-labs/plugins/commit/4a23069f87f2d89d72fb77ea4ff5a6524d05f063), [`4a23069`](https://github.com/kubb-labs/plugins/commit/4a23069f87f2d89d72fb77ea4ff5a6524d05f063)]:
  - @kubb/plugin-client@6.3.0

## 0.1.0

### Minor Changes

- [#1491](https://github.com/kubb-labs/plugins/pull/1491) [`a1b4efe`](https://github.com/kubb-labs/plugins/commit/a1b4efe774ac02112c77bb1b84195c5f923b8f5b) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Add `@kubb/plugin-ky`, which generates a type-safe HTTP client that sends with [Ky](https://github.com/sindresorhus/ky). Pass Ky options such as `retry`, `timeout`, and `hooks` in `options`, on a call or with `client.setConfig`. A call is sent once unless you set `retry`, as with the fetch and axios clients. The query and MCP plugins accept `client: 'ky'`.
  
  ```ts
  import { pluginKy } from '@kubb/plugin-ky'
  
  export default defineConfig({
    plugins: [pluginTs(), pluginKy({ baseURL: 'https://petstore.swagger.io/v2' })],
  })
  ```
  
  The `@kubb/plugin-fetch` and `@kubb/plugin-client` docs now point to `@kubb/plugin-ky`.

### Patch Changes

- [#1506](https://github.com/kubb-labs/plugins/pull/1506) [`38204b3`](https://github.com/kubb-labs/plugins/commit/38204b3a786cc285b73fc09007794836f0cfcf04) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Use Kubb 5.21.2.

- [#1505](https://github.com/kubb-labs/plugins/pull/1505) [`e47b1e9`](https://github.com/kubb-labs/plugins/commit/e47b1e9fbd0de17b9146afbc30775e2ab4dbd2ca) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Mark `@kubb/plugin-ky` and `@kubb/plugin-valibot` as beta in `kubb-extension.json`. kubb.dev and Kubb Studio show a Beta badge for them. Their options and output can still change in a minor release.
- Updated dependencies [[`a1b4efe`](https://github.com/kubb-labs/plugins/commit/a1b4efe774ac02112c77bb1b84195c5f923b8f5b), [`4dea353`](https://github.com/kubb-labs/plugins/commit/4dea353d0898f9fcf640199d467a004653cf86c0), [`38204b3`](https://github.com/kubb-labs/plugins/commit/38204b3a786cc285b73fc09007794836f0cfcf04)]:
  - @kubb/plugin-client@6.2.0
