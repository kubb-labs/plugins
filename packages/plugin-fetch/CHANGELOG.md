# @kubb/plugin-fetch

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
