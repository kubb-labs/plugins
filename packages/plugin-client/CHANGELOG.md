# @kubb/plugin-client

## 6.0.3

### Patch Changes

- [#1467](https://github.com/kubb-labs/plugins/pull/1467) [`2d29402`](https://github.com/kubb-labs/plugins/commit/2d29402a87e11825634a00873e1411b06a8979a4) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Use Kubb 5.20.1.
- Updated dependencies [[`2d29402`](https://github.com/kubb-labs/plugins/commit/2d29402a87e11825634a00873e1411b06a8979a4)]:
  - @kubb/plugin-ts@5.5.3
  - @kubb/plugin-zod@5.9.3

## 6.0.2

### Patch Changes

- [#1463](https://github.com/kubb-labs/plugins/pull/1463) [`141ba03`](https://github.com/kubb-labs/plugins/commit/141ba03a41ce5655d00d98558c2c46b528a1f937) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Require Kubb 5.19.0. Most plugins use the store form of `memo` from `@kubb/kit`, which 5.19.0 added.

- [#1466](https://github.com/kubb-labs/plugins/pull/1466) [`f552d00`](https://github.com/kubb-labs/plugins/commit/f552d00a05a44583c4731e0ce18e7e8fc226ebb8) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Document `pathParamsCasing: 'camelcase'` from `@kubb/adapter-oas`, which turns a `{pet-id}` path key into `petId`.
- Updated dependencies [[`141ba03`](https://github.com/kubb-labs/plugins/commit/141ba03a41ce5655d00d98558c2c46b528a1f937)]:
  - @kubb/plugin-ts@5.5.2
  - @kubb/plugin-zod@5.9.2

## 6.0.1

### Patch Changes

- [#1457](https://github.com/kubb-labs/plugins/pull/1457) [`7eea6f2`](https://github.com/kubb-labs/plugins/commit/7eea6f2a2938769e3df7051c1e8977b8ef4a1982) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Correct the docs each plugin ships for kubb.dev. Examples now run and typecheck against the generated output, and option types, defaults, and generated names match the code.

- [#1457](https://github.com/kubb-labs/plugins/pull/1457) [`7eea6f2`](https://github.com/kubb-labs/plugins/commit/7eea6f2a2938769e3df7051c1e8977b8ef4a1982) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - `@kubb/plugin-react-query`: the `customOptions` starter file imports `HookOptions` from the generated `HookOptions.ts` file, so it no longer needs a root barrel.
  
  `@kubb/plugin-fetch` and `@kubb/plugin-axios`: `returnType: 'plain'` is no longer accepted or offered, because it generated code that did not typecheck. It stays available on `@kubb/plugin-client`.
  
  `kubb-extension.json` now matches the code: `query.methods` defaults to `GET` and `QUERY`, `client` offers `client`, `@kubb/plugin-ts` is an optional dependency, `@kubb/plugin-client` lists `returnType`, and `@kubb/plugin-redoc` no longer lists `banner` and `footer`.
- Updated dependencies [[`7eea6f2`](https://github.com/kubb-labs/plugins/commit/7eea6f2a2938769e3df7051c1e8977b8ef4a1982), [`96cd58f`](https://github.com/kubb-labs/plugins/commit/96cd58f40103c9ccbf2fef6e624efa2c1a3c1eed), [`7eea6f2`](https://github.com/kubb-labs/plugins/commit/7eea6f2a2938769e3df7051c1e8977b8ef4a1982)]:
  - @kubb/plugin-ts@5.5.1
  - @kubb/plugin-zod@5.9.1

## 6.0.0

### Major Changes

- [#1350](https://github.com/kubb-labs/plugins/pull/1350) [`00cfe4e`](https://github.com/kubb-labs/plugins/commit/00cfe4edfaa752c6d67491dd45cb83bc9d867ea7) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Run the fetch and axios clients on one core with the same interceptors and client factory.
  
  - Import types from `templates/client.ts` and the runtime from `@kubb/plugin-client/templates/*`. `templates/fetch.ts` and `templates/axios.ts` are gone.
  - `FetchOptions` and `AxiosOptions` are now `NativeOptions`.
  - Rename `codecs` to `mediaTypes`, `serialize` to `encode`, and `deserialize` to `decode`, and move a custom `serializer.body` into a `mediaTypes` entry.
  - Replace `responseType` with `parseAs`, and catch the `ParseError` that invalid JSON now throws.
  - Replace `toEventStream(call, { shape })` with `client.stream({ ...config, eventShape })`, and name its result `StreamResult` with the event type, such as `StreamResult<Responses, true, ServerSentEvent<Pet>>`. `EventStreamResult` is gone.
  - Return a web `Response` from a custom transport, built with `toRequestInit(request)`.
  - Narrow `client.interceptors.error` handlers with `ResponseError.is`, since they now also get network and validation errors.
  - On axios, `client.interceptors` handlers get the core objects. Put native handlers on `getAxiosInstance().interceptors`. `validateStatus`, `AxiosTransport`, `InterceptorFn`, and `InterceptorChannel` are gone.
  - Make a custom client (`importPath`) generic and add a `stream` method.
  - With `sdk` tag classes, rename `new pet(config)` to `new PetClient(config)`.
  - Use the `servers` entry on a path or operation as that operation's default `baseURL`. A `baseURL` on the call still wins.
  
  ```diff
  - import { client, defaultTransport } from './gen/.kubb/client'
  + import { client, createAxiosTransport, getAxiosInstance } from './gen/.kubb/client'
  
  - defaultTransport.defaults.timeout = 10_000
  - client.setConfig({ transport: axios.create({ baseURL }) })
  + getAxiosInstance().defaults.timeout = 10_000
  + client.setConfig({ transport: createAxiosTransport(axios.create({ baseURL })) })
  ```
  
  To upgrade, regenerate, run `tsc --noEmit`, and follow your plugin's "Migrate to v6" guide. The query plugins work with v5 and v6.

### Minor Changes

- [#1392](https://github.com/kubb-labs/plugins/pull/1392) [`f003a3a`](https://github.com/kubb-labs/plugins/commit/f003a3aed5056d2447404f08bc3237a67c6a0dd9) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Export `resolveClientOptions`, `setupClient`, `clientDependencies`, `resolverClient`, and the `ClientOptions` and `ClientResolvedOptions` types from `@kubb/plugin-client`. `@kubb/plugin-fetch` and `@kubb/plugin-axios` now use them, and a transport plugin of your own can too.
  
  Drop the undocumented `clientGenerator` export from `@kubb/plugin-fetch` and `@kubb/plugin-axios`.

- [#1446](https://github.com/kubb-labs/plugins/pull/1446) [`88dd567`](https://github.com/kubb-labs/plugins/commit/88dd5676dd9f35f5e2820f7656e2bf4aafaf2237) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Write a serializer or form media type into `.kubb/` only when the spec needs it.
  
  - Kubb writes `.kubb/config.ts` with the serializers and media types of the spec, and `setConfig({ serializer })` merges per key.
  - The serializers live in `.kubb/serializers/`. `defaultQuerySerializer`, `defaultPathSerializer` and `applyHeaderStyles` are now `serializeQuery`, `serializePath` and `serializeHeaders`, and `serializer.header` and `serializer.cookie` are new config keys.
  - The form media types live in `.kubb/mediaTypes/` as `multipartFormData` and `urlencoded`. `formMediaTypes` is gone.
  - Each security scheme is written once, as `securitySchemes` in `.kubb/client.ts`.
  - A client built with `createClientCore` needs its serializers passed in `serializer`.

- [#1378](https://github.com/kubb-labs/plugins/pull/1378) [`a48c2ee`](https://github.com/kubb-labs/plugins/commit/a48c2ee9c3b1e949287d0aca5160727df43d66ac) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Stream a JSON Lines response, such as `application/jsonl`, `application/x-ndjson`, or `application/json-seq`, one parsed item per line.
  
  - An operation whose only success content type is JSON Lines returns `StreamResult` with one item per line, like a `text/event-stream` operation. It used to return the whole body as one string.
  - The call sends the media type in `Accept`, and `validator: 'zod'` checks each line.
  - `.kubb/sse.ts` adds `parseJsonLines`, and a custom client's `toEventStream` gets `{ shape: 'line' }`. An `application/json-seq` record must fit on one line.
  - React Query, Vue Query, and SWR skip hooks for these operations, as they do for event streams.
  
  ```ts
  for await (const entry of await streamLogs()) {
    console.info(entry.message) // LogEntry
  }
  ```

- [#1446](https://github.com/kubb-labs/plugins/pull/1446) [`88dd567`](https://github.com/kubb-labs/plugins/commit/88dd5676dd9f35f5e2820f7656e2bf4aafaf2237) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Return the response headers on every result, and support the OpenAPI 3.2 cookie style and named servers.
  
  - Return the response's `Headers` as `headers` on every result and on a thrown `ResponseError`. For a response that declares headers, `headers.get` suggests their names once `status` is narrowed.
  - Type the declared headers of a `text/event-stream` or JSON Lines response too. Such a call returns `StreamResultWithHeaders`, or `UnwrappedStreamResultWithHeaders` with `returnType: 'data'`, and `StreamResult`, `UnwrappedStreamResult` and `client.stream` take the headers record as an optional last type argument.
  - Send a `style: cookie` parameter without percent-encoding, with `explode` on by default. A value it cannot send, such as one with `;`, throws a `TypeError`.
  - Pass an `oauth2` scheme's `flows` and `metadataUrl`, and an `openIdConnect` scheme's `url`, to the `auth` resolver.
  - Export the servers that have a `name` as `servers` from `.kubb/client.ts`.
  
  ```ts
  import { client, servers } from './gen/.kubb/client'
  
  client.setConfig({ baseURL: servers.staging })
  ```
  
  `server.index` no longer counts a server without a `url`. A custom client (`importPath`) gets no typed headers. It must accept `flows`, `metadataUrl` and `url` in a `security` entry and `style: 'cookie'` in `styles`, as the "Write your client" guide shows.

- [#1446](https://github.com/kubb-labs/plugins/pull/1446) [`88dd567`](https://github.com/kubb-labs/plugins/commit/88dd5676dd9f35f5e2820f7656e2bf4aafaf2237) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Read the OpenAPI 3.1 and 3.2 fields that Kubb 5.18 adds, which needs Kubb 5.18.4 or later.
  
  - Treat a status range such as `2XX` as a success response.
  - Write a range in lower case: `ListPetsStatus2XX` becomes `ListPetsStatus2xx`, and the `'2XX'` key becomes `'2xx'`.
  - Add `@see` from an operation's `externalDocs` to its JSDoc.
  
  After you regenerate, rename imports of the `…Status2XX` names. An upper-case range key such as `'2XX'` or `'5XX'` in a hand-written responses record or `validator.error` map is no longer read, so write it in lower case.

- [#1449](https://github.com/kubb-labs/plugins/pull/1449) [`73a7053`](https://github.com/kubb-labs/plugins/commit/73a7053c25e73212b12d1107a8cac38f5a7e1408) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Add the `returnType` option to `@kubb/plugin-client`. Set it to `'full'` to wrap generated operations in `withUnwrap` from your `importPath` module, so callers can use `.unwrap()`, or to `'data'` to resolve to the body. The default stays `'plain'`.

- [#1446](https://github.com/kubb-labs/plugins/pull/1446) [`88dd567`](https://github.com/kubb-labs/plugins/commit/88dd5676dd9f35f5e2820f7656e2bf4aafaf2237) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Nest a tag group in the folders of its OpenAPI 3.2 `parent` tags.
  
  With `group: { type: 'tag' }`, a `payment` tag whose `parent` is `store` now writes to `store/payment/` instead of `payment/`. Tags without a `parent` keep their folder.
  
  ```diff
  - import { listPayments } from './gen/clients/payment/listPayments'
  + import { listPayments } from './gen/clients/store/payment/listPayments'
  ```
  
  Pass `group.name` to keep one folder per tag: `group: { type: 'tag', name: ({ group }) => group }`.

### Patch Changes

- [#1448](https://github.com/kubb-labs/plugins/pull/1448) [`65c6ba1`](https://github.com/kubb-labs/plugins/commit/65c6ba11a703783fd35f3511b0683a1391a47b43) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Use the shared `ast`, `casing` and `text` helpers from `@kubb/kit`. Generated code stays the same, except:
  
  - `@kubb/plugin-msw` mocks a `text/json` response as JSON.
  - `@kubb/plugin-zod` prints bigint bounds as inclusive, such as `.min(1n)` for `exclusiveMinimum: 0`.
  - A `group: { type: 'path' }` folder is the camelCased first path segment, such as `petStore` for `/pet-store/{id}`.

- [#1452](https://github.com/kubb-labs/plugins/pull/1452) [`298daf9`](https://github.com/kubb-labs/plugins/commit/298daf9e415bfd047202f1df0848089a8ce00fb7) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Rewrite the "Migrate to v6" guides for the client, fetch, and axios plugins from the changes on `main`. They now cover JSON Lines streams, response headers, cookie styles, the new serializer and media type files, generated file paths, and error validators per status, and drop exports that 5.x never had.

- [#1350](https://github.com/kubb-labs/plugins/pull/1350) [`00cfe4e`](https://github.com/kubb-labs/plugins/commit/00cfe4edfaa752c6d67491dd45cb83bc9d867ea7) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Make the fetch and axios clients handle headers, bodies, errors and streams the same way.
  
  - Send an object query parameter without a `style` as `name=odie&age=3` and an array header as `X-Ids: 3,4`, the OpenAPI defaults. Set `style: deepObject` to keep `filter[name]=odie`.
  - Send `body: null` as the JSON document `null`, return `undefined` for an empty body, and report `{ status, statusText }` as `error` for a failed call without a body.
  - Check an error body against the schema of its own status with a `validator.error` map, such as `{ 404: getPetStatus404Schema, '5xx': getPetStatus5xxSchema }`. A status the document leaves out resolves with its body as `error`.
  - Send `Accept: text/event-stream` on a stream call, and reject an aborted call or stream with the signal's reason.
  - Type-check the `.kubb/` runtime with `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`, `isolatedDeclarations` and `@total-typescript/ts-reset`.

- [#1446](https://github.com/kubb-labs/plugins/pull/1446) [`88dd567`](https://github.com/kubb-labs/plugins/commit/88dd5676dd9f35f5e2820f7656e2bf4aafaf2237) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Fix request serialization that did not match the OpenAPI style examples.
  
  - Send an array of objects with `style: deepObject` as indexed keys, such as `items[0][price]=p_1`, instead of `items=[object Object]`.
  - Default `explode` to `false` for `spaceDelimited` and `pipeDelimited`, so an array goes out as `ids=1%7C2`.
  - Keep `#`, `&`, `+` and `%20` intact with `allowReserved`, and send a space as `%20` instead of `+`.
  - Follow the `encoding` of a form body property: a JSON `contentType` sends one JSON value, and `explode: false` sends a multipart array as one part.
  - Stop writing `//` before the path when `baseURL` ends in `/`.
  
  The serialization guides now list how each `style` and `explode` combination is encoded.

- [#1350](https://github.com/kubb-labs/plugins/pull/1350) [`00cfe4e`](https://github.com/kubb-labs/plugins/commit/00cfe4edfaa752c6d67491dd45cb83bc9d867ea7) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Add an optional `cookies` option for `in: cookie` parameters to the types, Zod schemas, Faker mocks, clients, query hooks, MCP tools, and Cypress requests.
  
  - Query keys leave `cookies` out, as they do headers, since keys end up in SSR payloads and caches.
  - `validator: 'zod'` checks `cookies` when the call passes them.
  
  ```ts
  await getSession({ cookies: { session_id: 'abc' } })
  ```

- [#1446](https://github.com/kubb-labs/plugins/pull/1446) [`88dd567`](https://github.com/kubb-labs/plugins/commit/88dd5676dd9f35f5e2820f7656e2bf4aafaf2237) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Keep operation names and files apart from each other and from schemas.
  
  - Give an operation file an `Operation` suffix when a schema file has the same name, ignoring case. Operation `point` goes to `types/PointOperation.ts`, next to schema `Point`. The exported names stay the same.
  - Name an operation the same in every plugin when a `macros` entry changes its `method` or `path`. The MSW handler no longer imports `FindPetsByStatusResponse2`.

- [#1446](https://github.com/kubb-labs/plugins/pull/1446) [`88dd567`](https://github.com/kubb-labs/plugins/commit/88dd5676dd9f35f5e2820f7656e2bf4aafaf2237) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Fix bugs found on real OpenAPI 3.0, 3.1 and 3.2 specs.
  
  - Escape a `'` in a path, media type, method or MCP server name, and JSDoc tags inside `@see` text.
  - Prefer an exact success code such as `200` over a `2XX` range listed before it.
  - Keep an OpenAPI 3.0 `nullable: true` on an array item or a `oneOf`/`anyOf` member in the types and Zod schemas.
  - Accept a custom OpenAPI 3.2 method such as `COPY`, and stop importing a `<operation>ResponseSchema` that does not exist.
  - Type a stream variant next to another content type as `ReadableStream` and keep string event `data` as text.

- [#1446](https://github.com/kubb-labs/plugins/pull/1446) [`88dd567`](https://github.com/kubb-labs/plugins/commit/88dd5676dd9f35f5e2820f7656e2bf4aafaf2237) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Make generated response types match what the client returns at runtime.
  
  - Type an XML, YAML or CSV response as `string`. An operation that returns JSON and XML has `data: Pet | string`, so narrow on `result.contentType`.
  - Type an image, audio, video, PDF or `application/octet-stream` response as `Blob`, even when its schema says `type: string`.
  - Type `result.contentType` as the bare media type, such as `'text/html'`, so a `switch` on it matches.
  - Match the new types in Zod schemas, Faker mocks, Cypress requests and MSW handlers.

- [#1446](https://github.com/kubb-labs/plugins/pull/1446) [`88dd567`](https://github.com/kubb-labs/plugins/commit/88dd5676dd9f35f5e2820f7656e2bf4aafaf2237) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Fix edge cases in the OpenAPI 3.1 and 3.2 support.
  
  - A `Date` header passed per call goes out as ISO text, also when the spec declares no header parameters.
  - An empty exploded cookie adds no empty `; ` segment.
  - `RequestResult` and `UnwrappedResult` from `.kubb/client.ts` take the headers type argument.
  - Faker keeps exclusive and filled-in bounds on the `multipleOf` grid, and leaves out bigint bounds past the safe integer range.
  - Zod leaves out bigint bounds past the safe integer range, which printed as `1e+21n` or a rounded literal.
  - MSW sends a serialized Server-Sent Events example once, without wrapping it in `data:` again.
  - The primary success response is one with a body, so a `204` next to a `2xx` range no longer hides the body from MCP.
- Updated dependencies [[`65c6ba1`](https://github.com/kubb-labs/plugins/commit/65c6ba11a703783fd35f3511b0683a1391a47b43), [`00cfe4e`](https://github.com/kubb-labs/plugins/commit/00cfe4edfaa752c6d67491dd45cb83bc9d867ea7), [`88dd567`](https://github.com/kubb-labs/plugins/commit/88dd5676dd9f35f5e2820f7656e2bf4aafaf2237), [`88dd567`](https://github.com/kubb-labs/plugins/commit/88dd5676dd9f35f5e2820f7656e2bf4aafaf2237), [`88dd567`](https://github.com/kubb-labs/plugins/commit/88dd5676dd9f35f5e2820f7656e2bf4aafaf2237), [`88dd567`](https://github.com/kubb-labs/plugins/commit/88dd5676dd9f35f5e2820f7656e2bf4aafaf2237), [`88dd567`](https://github.com/kubb-labs/plugins/commit/88dd5676dd9f35f5e2820f7656e2bf4aafaf2237), [`88dd567`](https://github.com/kubb-labs/plugins/commit/88dd5676dd9f35f5e2820f7656e2bf4aafaf2237), [`88dd567`](https://github.com/kubb-labs/plugins/commit/88dd5676dd9f35f5e2820f7656e2bf4aafaf2237), [`88dd567`](https://github.com/kubb-labs/plugins/commit/88dd5676dd9f35f5e2820f7656e2bf4aafaf2237), [`88dd567`](https://github.com/kubb-labs/plugins/commit/88dd5676dd9f35f5e2820f7656e2bf4aafaf2237), [`88dd567`](https://github.com/kubb-labs/plugins/commit/88dd5676dd9f35f5e2820f7656e2bf4aafaf2237)]:
  - @kubb/plugin-ts@5.5.0
  - @kubb/plugin-zod@5.9.0

## 5.11.1

### Patch Changes

- [#1368](https://github.com/kubb-labs/plugins/pull/1368) [`821265a`](https://github.com/kubb-labs/plugins/commit/821265a374d1431288b745f863c28d2dc5d9ac63) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - An operation whose `requestBody` is not `required: true` now types `body` as optional in its options, as OpenAPI defines. A call such as petstore's `updateUser({ path: { username } })` typechecks without a body. When the operation has no required parameter either, the generated client takes no argument at all, such as `createUser()`. A body marked `required: true` stays required.
- Updated dependencies [[`6fadb07`](https://github.com/kubb-labs/plugins/commit/6fadb07c0e99de2732115486c2139060bd82d5e5), [`821265a`](https://github.com/kubb-labs/plugins/commit/821265a374d1431288b745f863c28d2dc5d9ac63), [`6fadb07`](https://github.com/kubb-labs/plugins/commit/6fadb07c0e99de2732115486c2139060bd82d5e5)]:
  - @kubb/plugin-ts@5.4.2
  - @kubb/plugin-zod@5.8.3

## 5.11.0

### Minor Changes

- [#1332](https://github.com/kubb-labs/plugins/pull/1332) [`d52d796`](https://github.com/kubb-labs/plugins/commit/d52d796bde29fed3f99e87438f410bbbec092b2a) Thanks [@tombeckenham](https://github.com/tombeckenham)! - Choose the response parser from each content type when one success response declares more than one. A binary body such as `audio/mpeg` stays a `Blob` when the same response also returns `text/event-stream`, including media types Kubb only knows are binary from `format: binary`.
  
  Custom clients: `responseType` can now be a map from content type to parser, such as `{ 'audio/mpeg': 'blob', 'text/event-stream': 'stream' }`. Widen its type to `string | Record<string, string>` and pick the parser from the response `Content-Type`.

## 5.10.0

### Minor Changes

- [#1340](https://github.com/kubb-labs/plugins/pull/1340) [`6714ffe`](https://github.com/kubb-labs/plugins/commit/6714ffea747595ce37fd90455c5507fed545991e) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Ship the client runtime once. `@kubb/plugin-client` now holds the templates every client plugin copies: `core.ts` (the request pipeline, interceptors, validation, and result types), `serializers.ts`, `standardSchema.ts`, and `sse.ts`. `@kubb/plugin-fetch` and `@kubb/plugin-axios` depend on it, copy those files into `.kubb/`, and keep one template of their own, `client.ts`, with the transport and the types bound to its native request and response.
  
  - Generated output gains `.kubb/core.ts`, which `.kubb/client.ts` re-exports with the result types bound to the transport's native request and response.
  - `.kubb/sse.ts` is still written only for a document with a `text/event-stream` operation. `.kubb/client.ts` then re-exports it, so `ServerSentEvent` and `toEventStream` stay importable from the client.

- [#1345](https://github.com/kubb-labs/plugins/pull/1345) [`0a5a254`](https://github.com/kubb-labs/plugins/commit/0a5a2546d50ae159e87e09e7ff7017140309013a) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Iterate a stream call's result directly. `EventStreamResult` is now an `AsyncIterable` of its events, so `for await (const event of await streamChat(...))` works, and the call can go to anything that reads an `AsyncIterable` without `.stream`. The `stream` property stays and yields the same events.

- [#1338](https://github.com/kubb-labs/plugins/pull/1338) [`4253a3f`](https://github.com/kubb-labs/plugins/commit/4253a3f4987b273bcb80a844455b6193bc0618a6) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Type server-sent events by name from OpenAPI 3.2 `itemSchema` and validate them one by one.
  
  - Import `ServerSentEvent` and `toEventStream` from the new `.kubb/sse.ts` instead of `.kubb/client.ts`.
  - Narrow `event.data` with `switch (event.event)` when the `itemSchema` names each event.
  - Validate each event with `validator: 'zod'`, map it first with `transform`, and end the stream on a sentinel with `terminator`.
  - Read `lastEventId` on the result to resume a dropped stream with a `Last-Event-ID` header on a new call.
  - Export `TypedEvent` from a custom `@kubb/plugin-client` module.
  
  ```ts
  const { stream } = await streamChat({ body, terminator: '[DONE]' })
  
  for await (const event of stream) {
    if (event.event === 'message_delta') render(event.data)
  }
  ```

- [#1345](https://github.com/kubb-labs/plugins/pull/1345) [`0a5a254`](https://github.com/kubb-labs/plugins/commit/0a5a2546d50ae159e87e09e7ff7017140309013a) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Give stream calls the same shape as regular calls. A stream operation now takes `StreamOptions<TData, ThrowOnError>` and returns `StreamResult<TResponses, ThrowOnError>`, the stream versions of `Options` and `RequestResult`. The result also carries `status`, `error`, `contentType`, and `request`, and checking `status` narrows `error` to the declared error body, as on a regular call. With `throwOnError: false`, a failed stream call now returns its `status` and `error` body. It used to return an empty stream and drop the error. The events are also the result's `data`, so `.unwrap()` resolves to them, and with `returnType: 'data'` a stream call now returns only its events, as a regular call returns only its body. It used to return the full result. `EventStreamOptions` is unchanged. `EventStreamResult` keeps its type parameters and gains `data`, `status`, `error`, `contentType`, `request`, and `[Symbol.asyncIterator]`, so a hand-built `EventStreamResult`, such as a test mock, needs those members to typecheck.

- [#1348](https://github.com/kubb-labs/plugins/pull/1348) [`0560f5d`](https://github.com/kubb-labs/plugins/commit/0560f5d823833980831fffef39378324c7302ae0) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Make a stream call fail loudly on an answer that is not an event stream.
  
  - A successful answer with a body that is not a stream, such as a JSON body, now throws a `TypeError` with the decoded body as its `cause`. It used to return an empty stream and lose the body. A successful answer with no body still returns an empty stream.
  - A streamed body is parsed as server-sent events whatever its content type says, as in earlier releases, so a server or proxy that drops the `text/event-stream` header still delivers its events.
  - An event the server ends without a blank line is now dropped, as the WHATWG event stream specification and browser `EventSource` do. End each event with a blank line, including the last one.

### Patch Changes

- [#1343](https://github.com/kubb-labs/plugins/pull/1343) [`eb2069f`](https://github.com/kubb-labs/plugins/commit/eb2069fc108d0d70b6fbae36bf63dad26ccc6a8d) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Generate a shorter `.kubb/client.ts`. The shared `core.ts` now reads `NativeRequest` and `NativeResponse` from the `client.ts` next to it and uses them as its type defaults, so the client no longer re-declares `RequestResult`, `UnwrappedResult`, `Transport`, `TransportResult`, `CallResult`, and `ResponseErrorConfig` only to bind them. Every name is still exported from `.kubb/client.ts` with the same type.

- [#1338](https://github.com/kubb-labs/plugins/pull/1338) [`4253a3f`](https://github.com/kubb-labs/plugins/commit/4253a3f4987b273bcb80a844455b6193bc0618a6) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Read an OpenAPI 3.2 `in: querystring` parameter as the operation's whole query string. A form-encoded object spreads into `query`, so its keys are typed and serialized like query parameters. A JSON one stays one value, sent as the whole query string without its name.
- Updated dependencies [[`4253a3f`](https://github.com/kubb-labs/plugins/commit/4253a3f4987b273bcb80a844455b6193bc0618a6)]:
  - @kubb/plugin-ts@5.4.1
  - @kubb/plugin-zod@5.8.2

## 5.9.0

### Minor Changes

- [#1314](https://github.com/kubb-labs/plugins/pull/1314) [`c40a8a0`](https://github.com/kubb-labs/plugins/commit/c40a8a0b77ede6b436a905ec4b1e35aabbe69b77) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Plugins no longer need the `kubb` package. They import `@kubb/kit` and `@kubb/renderer-jsx` directly and list them as dependencies instead of a peer on `kubb`. A project that runs Kubb from code with `createKubb` from `@kubb/core` no longer installs the CLI, MCP server, Studio, and bundler integrations that `kubb` brings. This works with npm, pnpm, Yarn (including Plug'n'Play), and Bun without extra installs. If you use the `kubb` CLI, nothing changes.
  
  `@kubb/plugin-ts` no longer installs `@kubb/parser-ts`. It is now an optional peer dependency, needed only when a `printer.nodes` handler returns a TypeScript compiler node, which is deprecated. If that happens and `@kubb/parser-ts` is missing, the build fails with `KUBB_MISSING_DEPENDENCY` and tells you to run `npm i -D @kubb/parser-ts`. Return a string from the handler instead to avoid the dependency.
  
  `@kubb/plugin-redoc` lists `@kubb/adapter-oas` as a peer dependency instead of a dependency, so it uses your project's copy.
  
  A project that pins an older Kubb version keeps one `@kubb/core` with npm and Bun. With pnpm or Yarn, pin `@kubb/kit` and `@kubb/renderer-jsx` to your Kubb version in `overrides` or `resolutions` to get the same.

### Patch Changes

- [#1313](https://github.com/kubb-labs/plugins/pull/1313) [`25cb730`](https://github.com/kubb-labs/plugins/commit/25cb730ce55b6f4c97c087d0eabc6b5281f75612) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Depend on Kubb `^5.15.2`: `@kubb/kit` and `@kubb/renderer-jsx` for every plugin, `@kubb/parser-ts` as the optional peer of `@kubb/plugin-ts`, and `@kubb/adapter-oas` as the peer of `@kubb/plugin-redoc`.

- [#1313](https://github.com/kubb-labs/plugins/pull/1313) [`25cb730`](https://github.com/kubb-labs/plugins/commit/25cb730ce55b6f4c97c087d0eabc6b5281f75612) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Cache each operation's client and dependency file with `ctx.memo` instead of `ctx.cache`. This keeps the plugins working once `@kubb/core` drops `ctx.cache`. Generated output does not change.

- [#1304](https://github.com/kubb-labs/plugins/pull/1304) [`4bed009`](https://github.com/kubb-labs/plugins/commit/4bed00935f652cc50358d1058a42d28adf1b3af8) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Compute build-constant work once per build through `memo` instead of once per schema or operation node: the Zod printers, the operation type source a client or hook takes its types from, the `TData` and `TError` expressions of each hook, and the circular and enum name sets. Each key prefix is registered in `Kubb.MemoRegistry`.
- Updated dependencies [[`1fd420e`](https://github.com/kubb-labs/plugins/commit/1fd420edfc2d479808b8af6d48526ea923aa6a41), [`25cb730`](https://github.com/kubb-labs/plugins/commit/25cb730ce55b6f4c97c087d0eabc6b5281f75612), [`4bed009`](https://github.com/kubb-labs/plugins/commit/4bed00935f652cc50358d1058a42d28adf1b3af8), [`c40a8a0`](https://github.com/kubb-labs/plugins/commit/c40a8a0b77ede6b436a905ec4b1e35aabbe69b77), [`b4c30d3`](https://github.com/kubb-labs/plugins/commit/b4c30d3ae240548e0d5ab69f5f3a06fba8ebf49d), [`5d013e3`](https://github.com/kubb-labs/plugins/commit/5d013e3d8a747780f81b7eb67be603695ac9c0bb)]:
  - @kubb/plugin-ts@5.4.0
  - @kubb/plugin-zod@5.8.0

## 5.8.1

### Patch Changes

- [#1299](https://github.com/kubb-labs/plugins/pull/1299) [`d3a8c5d`](https://github.com/kubb-labs/plugins/commit/d3a8c5dec2eab6e920b7dd9ff7e8637f7addd85f) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Import `camelCase` and `pascalCase` from `kubb/kit` instead of a copy bundled into each plugin, and compute each resolved name once per build through `this.memo`, with the key prefixes registered in `Kubb.MemoRegistry`. A grouped SDK class whose tag starts with a digit now gets a valid class name. Needs kubb 5.15 or later.
- Updated dependencies [[`d3a8c5d`](https://github.com/kubb-labs/plugins/commit/d3a8c5dec2eab6e920b7dd9ff7e8637f7addd85f)]:
  - @kubb/plugin-ts@5.3.3
  - @kubb/plugin-zod@5.7.4

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
