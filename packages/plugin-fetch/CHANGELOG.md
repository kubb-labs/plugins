# @kubb/plugin-fetch

## 5.0.0-beta.95

### Patch Changes

- Updated dependencies [[`d069022`](https://github.com/kubb-labs/plugins/commit/d069022633b46fcacc8a7899780bd68e35b5f743), [`b37ad9b`](https://github.com/kubb-labs/plugins/commit/b37ad9b3c663f21b72ffdce947c984ce705ebf4d), [`d8654b0`](https://github.com/kubb-labs/plugins/commit/d8654b0e1b221b5db7a0137ed0b3da3eb80cb155)]:
  - @kubb/plugin-ts@5.0.0-beta.95
  - @kubb/plugin-zod@5.0.0-beta.95

## 5.0.0-beta.94

### Patch Changes

- Updated dependencies [[`d815500`](https://github.com/kubb-labs/plugins/commit/d81550018b7cf65bcc4715c4adbf8949fcba5516)]:
  - @kubb/plugin-zod@5.0.0-beta.87
  - @kubb/plugin-ts@5.0.0-beta.87

## 5.0.0-beta.87

### Patch Changes

- Updated dependencies [[`e59f005`](https://github.com/kubb-labs/plugins/commit/e59f005535a31a287c3a8faa6a967d69ce7b1dc1)]:
  - @kubb/plugin-zod@5.0.0-beta.86
  - @kubb/plugin-ts@5.0.0-beta.86

## 5.0.0-beta.86

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

- [#640](https://github.com/kubb-labs/plugins/pull/640) [`22f1221`](https://github.com/kubb-labs/plugins/commit/22f122170dc2330e788d54e9c2278c03f867cfb8) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Drop the unused `@internals/utils` devDependency flagged by knip. None of these packages import from it, they use `@internals/shared`, `ast`, or their own `utils.ts` instead. Runtime behavior is unchanged.

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
  - @kubb/plugin-zod@5.0.0-beta.85

## 5.0.0-beta.85

### Patch Changes

- [#633](https://github.com/kubb-labs/plugins/pull/633) [`c374262`](https://github.com/kubb-labs/plugins/commit/c3742623da739018d9610a0cbb274ab8e9e30322) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Send query and header parameters with the names the OpenAPI document declares (kubb-labs/plugins#631).

  The generated types keep camelCase keys (`include_deleted` becomes `includeDeleted`), but the client used to serialize those camelCased keys straight onto the request, so an API expecting `include_deleted` or `X-API-Key` never received them. Generated clients and SDK methods now remap the keys back to the spec names before the request goes out:

  ```ts
  return request({
    method: "POST",
    url: "/pets/{petId}",
    ...config,
    query: config.query
      ? { include_deleted: config.query.includeDeleted }
      : config.query,
  });
  ```

  The remap is only emitted for operations where a name actually changes. Path parameters were already correct, since the URL template placeholders are renamed in sync with the `path` keys. Per-parameter `styles` for query, header, and cookie are now keyed by the spec name to match the serialized keys.

  `@kubb/plugin-cypress` shares the same remap rendering now, which also fixes its generated `cy.request` calls for renamed params whose camelCased name is not a bare identifier (for example `2fa-token`).

## 5.0.0-beta.84

### Patch Changes

- Updated dependencies [[`b85a648`](https://github.com/kubb-labs/plugins/commit/b85a6483ac7aa08743200bba6abfbee7fa0c9722)]:
  - @kubb/plugin-ts@5.0.0-beta.84
  - @kubb/plugin-zod@5.0.0-beta.84

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

- [#617](https://github.com/kubb-labs/plugins/pull/617) [`a172bcb`](https://github.com/kubb-labs/plugins/commit/a172bcb267bf3134f36dd4494079aec1d81d8e01) Thanks [@Ericlm](https://github.com/Ericlm)! - Fix JSON request bodies in generated axios/fetch clients when no explicit `contentType` is provided.

- Updated dependencies [[`756830d`](https://github.com/kubb-labs/plugins/commit/756830d28ec98fde78e63e397d0214fed7b46a34), [`5db1f7a`](https://github.com/kubb-labs/plugins/commit/5db1f7a8eb8501489c40949423f7debf5f8ed26a)]:
  - @kubb/plugin-ts@5.0.0-beta.82
  - @kubb/plugin-zod@5.0.0-beta.82

## 5.0.0-beta.81

### Minor Changes

- [#608](https://github.com/kubb-labs/plugins/pull/608) [`40632ef`](https://github.com/kubb-labs/plugins/commit/40632efe9f4697f7adddbc5e3563f6ac85ce64b0) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Fix two precedence bugs in the client runtime. A `baseURL` passed on a single call now replaces the client-level `baseURL` instead of being concatenated onto it. An explicit header set on a call (such as `Authorization`) now wins over the token the `auth` resolver produces, so per-call overrides behave as documented.

### Patch Changes

- [#608](https://github.com/kubb-labs/plugins/pull/608) [`d3ad51c`](https://github.com/kubb-labs/plugins/commit/d3ad51cc2ac9d6f1b971c659744048ebd971b1f7) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Restructure the bundled client runtime so the send path reads as a short pipeline. Request resolution (headers, content type, auth, cookies, body) and response settlement (codec decode, validation, `throwOnError`) now live in focused helpers instead of one long closure, and `getUrl` shares the serializer resolution with the send path. Behavior and the public surface of `.kubb/client.ts` are unchanged, and a new test keeps the shared `serializers.ts` and `standardSchema.ts` templates byte-identical across both plugins.

- [#610](https://github.com/kubb-labs/plugins/pull/610) [`4a89343`](https://github.com/kubb-labs/plugins/commit/4a89343dc828e85cc20bcaddb3bf36bb088054a9) Thanks [@Ericlm](https://github.com/Ericlm)! - Fix generated client config for interpolated `baseURL` values. A config such as `baseURL: '${import.meta.env.VITE_API_SERVER}'` now emits a runtime template literal in `.kubb/client.ts` instead of a fixed string, so environment-based base URLs stay dynamic.

- Updated dependencies [[`9126149`](https://github.com/kubb-labs/plugins/commit/9126149b997970d336c1fcf2789576966270c86e), [`238d48c`](https://github.com/kubb-labs/plugins/commit/238d48cb0169d79e0a86d5cd7625575dde5bf9dd), [`238d48c`](https://github.com/kubb-labs/plugins/commit/238d48cb0169d79e0a86d5cd7625575dde5bf9dd), [`238d48c`](https://github.com/kubb-labs/plugins/commit/238d48cb0169d79e0a86d5cd7625575dde5bf9dd)]:
  - @kubb/plugin-zod@5.0.0-beta.81
  - @kubb/plugin-ts@5.0.0-beta.81

## 5.0.0-beta.80

### Patch Changes

- [#603](https://github.com/kubb-labs/plugins/pull/603) [`5fcf721`](https://github.com/kubb-labs/plugins/commit/5fcf72130d48c6cfb5bd7cb287585e6403b81bb4) Thanks [@Ericlm](https://github.com/Ericlm)! - Default generated `options` parameters to `{}` when an operation has no required request data, allowing calls like `getInventory()` without passing an empty object.

- Updated dependencies []:
  - @kubb/plugin-ts@5.0.0-beta.80
  - @kubb/plugin-zod@5.0.0-beta.80

## 5.0.0-beta.79

### Minor Changes

- [#594](https://github.com/kubb-labs/plugins/pull/594) [`da94c25`](https://github.com/kubb-labs/plugins/commit/da94c258d352bb980b23384ba7b900ab7f269de7) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Rename two client config options so they no longer collide with each other.

  The per-content-type `bodySerializers` and `deserializers` maps merge into one `codecs` map, keyed by content type, where each entry holds a `serialize` and a `deserialize` function. This removes the overlap with the single `serializer.body` function and pairs request encoding with response decoding per media type.

  ```ts
  // before
  client.setConfig({
    bodySerializers: { "application/xml": (body) => build(body) },
    deserializers: { "application/xml": (raw) => parse(raw) },
  });

  // after
  client.setConfig({
    codecs: {
      "application/xml": {
        serialize: (body) => build(body),
        deserialize: (raw) => parse(raw),
      },
    },
  });
  ```

  The per-parameter `serialization` metadata (the OpenAPI `style` / `explode` config a generated operation carries, and the per-call override) is renamed to `styles`, so it no longer reads like the `serializer` functions. The generated operations now emit a `styles:` entry instead of `serialization:`.

  ```ts
  // before
  await listPets({
    query: { tags },
    serialization: {
      query: { tags: { style: "pipeDelimited", explode: false } },
    },
  });

  // after
  await listPets({
    query: { tags },
    styles: { query: { tags: { style: "pipeDelimited", explode: false } } },
  });
  ```

- [#532](https://github.com/kubb-labs/plugins/pull/532) [`e1f5544`](https://github.com/kubb-labs/plugins/commit/e1f5544609e6e5c2a7361e056e65198d8b790065) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Serialize path, query, header, and cookie parameters plus urlencoded bodies by their `style` / `explode`, and fix array and object path params rendering as `[object Object]`. The generator reads each parameter's `style` / `explode` straight from the OpenAPI document and emits it on the call, so the right serialization applies without extra configuration (needs `@kubb/core` 5.0.0-beta.76 or later).

  ```ts
  defaultPathSerializer({ name: "id", value: [3, 4, 5] }); // '3,4,5'
  defaultPathSerializer({
    name: "id",
    value: [3, 4, 5],
    options: { style: "matrix", explode: true },
  }); // ';id=3;id=4;id=5'
  defaultQuerySerializer(
    { id: [3, 4, 5] },
    { id: { style: "pipeDelimited", explode: false } },
  ); // 'id=3|4|5'
  serializeCookies({ ids: [1, 2] }); // 'ids=1,2'
  ```

  A request carries the per-parameter metadata under one `serialization` object (`{ path, query, header, cookie, body }`), pairing with the `serializer` option (the functions). Params without metadata keep the previous defaults, so existing output is unchanged.

  The default serializers now live in their own `.kubb/serializers.ts`, emitted next to `.kubb/client.ts`, which imports them. Override a serializer through the `serializer` option as before.

  Breaking: `querySerializer` and `bodySerializer` move under one `serializer` object.

  ```ts
  -client({ querySerializer, bodySerializer }) +
    client({
      serializer: {
        query: querySerializer,
        body: bodySerializer,
        path: pathSerializer,
      },
    });
  ```

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

- [#555](https://github.com/kubb-labs/plugins/pull/555) [`95ea8c5`](https://github.com/kubb-labs/plugins/commit/95ea8c561a241506ab626eda5dd916fe61bf01fa) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Support Server-Sent Events (`text/event-stream`) responses in the generated client.

  An operation whose primary success response is `text/event-stream` now generates a function that returns a typed event stream instead of a one-shot result. Both the fetch and axios clients share the same syntax:

  ```ts
  const { stream } = await streamEvents({ ...options });

  for await (const event of stream) {
    console.log(event.data); // typed from the operation's event schema, JSON-parsed when it is JSON
  }
  ```

  Under the hood the call sets `responseType: 'stream'` and the runtime exposes `parseEventStream`, `toEventStream`, `EventStreamResult`, and `ServerSentEvent`. The parser handles the SSE wire format (`data:`, `event:`, `id:`, `retry:`), concatenates multi-line `data`, ignores comment and heartbeat lines, normalizes CRLF, keeps non-JSON `data` as a string, and stops when an `AbortSignal` aborts. It reads a web `ReadableStream` (fetch) or any async iterable of byte chunks (the axios stream response).

  For the axios client, stream requests default to the fetch adapter so the body arrives as a `ReadableStream` in the browser too, not just in Node. An explicit `adapter` is left untouched.

  Non-streaming operations are unchanged. Requires `@kubb/adapter-oas` and `@kubb/ast` with response `content` support.

- [#541](https://github.com/kubb-labs/plugins/pull/541) [`b66aeb7`](https://github.com/kubb-labs/plugins/commit/b66aeb79c9df5691ad75626e8125f8bf33e83e78) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - The `parser` option is renamed to `validator` across the client and query plugins. Set `validator: 'zod'` (or `{ request: 'zod', response: 'zod' }`) where you previously set `parser`. The accepted values are unchanged.

  Generated clients pass the schema straight to the `validator` slot instead of wrapping it in a `.parse(data)` call. The slot takes a Standard Schema validator, and only `client.ts` calls `validateStandardSchema`, so the helper stays in one place instead of being imported into every operation file.

  A `validateStandardSchema` helper is injected into `.kubb/standardSchema.ts` next to the client. It handles sync and async `validate()` results and throws `ParseError({ issues })` on failure, so callers get a consistent `{ issues }` array instead of a raw `ZodError`. Any schema that exposes `~standard.validate` works, including zod, valibot, and arktype.

  Error-body validation now runs on the throwing path too. `validator.error` executes before `ResponseError` is constructed, so `error.data` always holds the validated body regardless of the `throwOnError` setting.

### Patch Changes

- [#532](https://github.com/kubb-labs/plugins/pull/532) [`e1f5544`](https://github.com/kubb-labs/plugins/commit/e1f5544609e6e5c2a7361e056e65198d8b790065) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Serialize `Date` values as ISO-8601 across path, query, cookie, and header parameters, recurse into nested objects for the `deepObject` query style, and apply a per-part content type from `multipart/form-data` encoding. Per-parameter `serialization` keys whose camelCased name is not a bare identifier are now quoted so the generated literal stays valid.

  ```ts
  defaultPathSerializer({
    name: "since",
    value: new Date("2020-01-02T03:04:05.000Z"),
  }); // '2020-01-02T03%3A04%3A05.000Z'
  defaultQuerySerializer(
    { a: { b: { c: 1 } } },
    { a: { style: "deepObject" } },
  ); // 'a%5Bb%5D%5Bc%5D=1'
  defaultBodySerializer({
    body: { meta: { a: 1 } },
    contentType: "multipart/form-data",
    encoding: { meta: { contentType: "application/json" } },
  }); // FormData with a typed Blob part
  ```

- Updated dependencies [[`e20770b`](https://github.com/kubb-labs/plugins/commit/e20770b6baf5f5274e3dd8005a06580787274e3e), [`4309b83`](https://github.com/kubb-labs/plugins/commit/4309b83abcbe322bad76fedd466396ba32bdcd4f), [`4e0906b`](https://github.com/kubb-labs/plugins/commit/4e0906b93bcb3d37441857380e119204264afb3a), [`ba80c04`](https://github.com/kubb-labs/plugins/commit/ba80c0427d6a42ce3131323b3f48fa16f2965aad), [`3992fde`](https://github.com/kubb-labs/plugins/commit/3992fde9273c175148dd3286161eb22338256f7d), [`5e03a70`](https://github.com/kubb-labs/plugins/commit/5e03a70f44c845e4230ca64665db4fdc226af746), [`a0fe6bd`](https://github.com/kubb-labs/plugins/commit/a0fe6bdcb1e619957c1e797218ba2adc774c7ec0), [`62cae59`](https://github.com/kubb-labs/plugins/commit/62cae5965912a17533dbf3a2ade1c64f1b305e95), [`8a6dce0`](https://github.com/kubb-labs/plugins/commit/8a6dce03ba62fc6b180cc870487556927024ffff)]:
  - @kubb/plugin-ts@5.0.0-beta.79
  - @kubb/plugin-zod@5.0.0-beta.79

## 5.0.0-beta.77

### Minor Changes

- [#530](https://github.com/kubb-labs/plugins/pull/530) [`fb55ca5`](https://github.com/kubb-labs/plugins/commit/fb55ca5908cd3da664c432d001af3d4f73a203c5) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Add an arbitrary request-options escape hatch to the fetch and axios client runtimes.

  `@kubb/plugin-fetch` gains a `fetchOptions` field. The transport previously built a fixed init (`method`, `headers`, `body`, `signal`, `credentials`), leaving no way to set `cache`, `mode`, `redirect`, `keepalive`, `duplex`, or Next.js's non-standard `next: { revalidate, tags }`.

  `@kubb/plugin-axios` gains the symmetric `axiosOptions` field (typed as `AxiosRequestConfig`) for per-call fields the runtime does not set itself, such as `timeout`, `proxy`, `maxRedirects`, `decompress`, and the `onUploadProgress` / `onDownloadProgress` callbacks. The pre-configured `transport` instance stays the place for cross-cutting concerns like retries and interceptors.

  Both fields are accepted on `ClientConfig` and `RequestConfig` (a per-request value wins over the client-level one) and are spread into the request before the runtime-owned fields, so they can never override what the runtime controls (URL, method, headers, body, serialization, and `throwOnError` handling).

  ```ts
  // fetch
  client.setConfig({ fetchOptions: { cache: "no-store" } });
  await getPetById({
    path: { petId: 1 },
    fetchOptions: { cache: "force-cache", next: { revalidate: 60 } },
  });

  // axios
  client.setConfig({ axiosOptions: { timeout: 10_000 } });
  await getPetById({
    path: { petId: 1 },
    axiosOptions: { timeout: 2_000, onUploadProgress: (e) => console.log(e) },
  });
  ```

### Patch Changes

- Updated dependencies [[`fae9f47`](https://github.com/kubb-labs/plugins/commit/fae9f470468870ed7015f2c910fd817c7e7daeef), [`455e6f1`](https://github.com/kubb-labs/plugins/commit/455e6f1c1f9047fb5cb7d4d12038dc2b5eb4422a)]:
  - @kubb/plugin-ts@5.0.0-beta.77
  - @kubb/plugin-zod@5.0.0-beta.77

## 5.0.0-beta.76

### Minor Changes

- [#514](https://github.com/kubb-labs/plugins/pull/514) [`3fe9268`](https://github.com/kubb-labs/plugins/commit/3fe92680b3a624cec83db06dd42ebb57acab505d) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Validate the error body with zod on the non-throw path (kubb-labs/plugins#369).

  When a call resolves with a non-2xx status and `throwOnError: false`, the generated client now parses the error body against a new error-only `<operation>ErrorSchema` (a union of the documented non-2xx statuses), so `result.error` has a known, validated shape instead of being surfaced raw.

  - **plugin-zod**: emits `<operation>ErrorSchema` alongside the success-only `<operation>ResponseSchema` for every operation that documents an error response with a schema. The success path is unchanged.
  - **plugin-fetch / plugin-axios**: the `parser: 'zod'` shorthand (and the object form's `response: 'zod'`) now also wires an `error` parser hook; the runtime runs it on the error body only when a non-2xx call does not throw. The default `throwOnError: true` path still throws a raw `ResponseError`.

  This is a small behavioral change for existing `parser: 'zod'` users: error bodies on non-throw calls are now validated and can surface a `ZodError` when the server's error response does not match the spec.

### Patch Changes

- [#516](https://github.com/kubb-labs/plugins/pull/516) [`bdb6e73`](https://github.com/kubb-labs/plugins/commit/bdb6e73e71789b48679cabcfd93c0c02d4dea0af) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Fix path parameter interpolation when the OpenAPI placeholder uses a different casing than the generated `path` option. The generated `url` literal now camelCases its `{placeholder}` names (`/projects/{project_id}` becomes `/projects/{projectId}`) so they line up with the camelCase keys on the grouped `path` request option. The runtime client looks each placeholder up by key, so a snake_case path param such as `project_id` is no longer dropped and the request reaches the right URL.

- [#518](https://github.com/kubb-labs/plugins/pull/518) [`cf46f82`](https://github.com/kubb-labs/plugins/commit/cf46f825832dce0ec945b554c22cd00626f8bcbc) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Build `FormData` again for `multipart/form-data` request bodies ([#512](https://github.com/kubb-labs/plugins/issues/512)).

  Operations with a non-JSON request body now forward their content type to the runtime client, and the default body serializer converts a plain object into `FormData` for `multipart/form-data` (mirroring the existing `application/x-www-form-urlencoded` → `URLSearchParams` handling). A `Blob`/`File` value passes through, a `Date` becomes an ISO string, arrays expand into repeated keys, and nested objects are JSON-serialized. The `Content-Type` header is omitted whenever the serialized body is a `FormData` instance — including a manually supplied one — so the runtime appends the multipart boundary itself.

- Updated dependencies [[`3fe9268`](https://github.com/kubb-labs/plugins/commit/3fe92680b3a624cec83db06dd42ebb57acab505d), [`4c7e449`](https://github.com/kubb-labs/plugins/commit/4c7e449383a8888273b1e7f32222a5d869d9c4d8), [`e64ff08`](https://github.com/kubb-labs/plugins/commit/e64ff085c2ad3676291d7c81cfb9be1761012798)]:
  - @kubb/plugin-zod@5.0.0-beta.76
  - @kubb/plugin-ts@5.0.0-beta.76

## 5.0.0-beta.75

### Patch Changes

- [#498](https://github.com/kubb-labs/plugins/pull/498) [`9912bc6`](https://github.com/kubb-labs/plugins/commit/9912bc6473a668330a114bf175415562decaa5f0) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Spread the selected generators into `ctx.addGenerator` so the call matches the narrowed `@kubb/core` signature, which now takes generators as separate arguments instead of a bare array.

- Updated dependencies [[`6cabaa0`](https://github.com/kubb-labs/plugins/commit/6cabaa0f3bb219a789b5b31b97b65524ff855b30)]:
  - @kubb/plugin-zod@5.0.0-beta.75
  - @kubb/plugin-ts@5.0.0-beta.75

## 5.0.0-beta.74

### Minor Changes

- [#490](https://github.com/kubb-labs/plugins/pull/490) [`ec7e712`](https://github.com/kubb-labs/plugins/commit/ec7e7128e34df644ecc521fc974c2d8f818f6d5a) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Add a `getUrl` helper to the generated client runtime. `client.getUrl(config)` constructs the final request URL — base URL, interpolated path params, and the serialized query — without sending the request, which is handy for query keys, prefetching, and link building.

  ```ts
  import { client } from "./.kubb/client";

  const url = client.getUrl({
    url: "/pet/{petId}",
    path: { petId: 1 },
    query: { status: ["available"] },
  });
  // => '/pet/1?status=available'
  ```

  Both the fetch and axios runtimes share the same URL serialization the send path already uses, so a built URL matches the one the request would hit.

- [#481](https://github.com/kubb-labs/plugins/pull/481) [`5a58bda`](https://github.com/kubb-labs/plugins/commit/5a58bda6b8801dde914d3f0f2f3eae6314fc506d) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Resolve auth from the OpenAPI spec. Each generated call now carries a `security` array of inline auth objects derived from the operation's requirements (falling back to the global `security`) and `components.securitySchemes`:

  ```ts
  return request({
    method: "POST",
    url: "/pet",
    security: [{ type: "http", scheme: "bearer" }],
    ...config,
  });
  ```

  The runtime walks `security` in order and resolves each entry through a single `auth` config field, either a static token or a callback that receives the auth object. It places the result as a bearer or basic `Authorization` header, or an apiKey in the header, query, or cookie. `oauth2` and `openIdConnect` resolve as bearer. With `auth` unset the metadata is ignored, so there is no change for specs that configure nothing.

### Patch Changes

- [#493](https://github.com/kubb-labs/plugins/pull/493) [`f475ce6`](https://github.com/kubb-labs/plugins/commit/f475ce639a667d626a36979fcca55c667c9dbe2d) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Target `@kubb/core` `5.0.0-beta.74` and register generators in a single `ctx.addGenerator` call now that it accepts multiple generators, dropping the per-generator loop.

- Updated dependencies []:
  - @kubb/plugin-ts@5.0.0-beta.74
  - @kubb/plugin-zod@5.0.0-beta.74

## 5.0.0-beta.73

### Major Changes

- [#457](https://github.com/kubb-labs/plugins/pull/457) [`6d27528`](https://github.com/kubb-labs/plugins/commit/6d2752810ef46328bcb6b9495e4ff068c5ec43e8) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - **Breaking:** Remove the `generators` plugin option.

  Plugins no longer accept a `generators` array of custom `Generator` objects. To add or replace generated output, build your own plugin instead. See [Creating plugins](https://kubb.dev/docs/5.x/guides/creating-plugins) for the full walkthrough.

### Minor Changes

- [#475](https://github.com/kubb-labs/plugins/pull/475) [`e0f0138`](https://github.com/kubb-labs/plugins/commit/e0f013848d4d42d59db8de6b7a7595409950f726) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Add `@kubb/plugin-fetch`, an HTTP client plugin pinned to the Fetch API. Each operation becomes one async function that takes a single grouped `options` object and returns the shared `RequestResult` contract, with a per-call `throwOnError` flag (default `true`):

  - `throwOnError: true` (default): a non-2xx status throws `ResponseError` and `data` is always defined.
  - `throwOnError: false`: errors are returned as values, discriminated by `error`.

  The runtime is always bundled into `.kubb/client.ts`, so generated code never imports from `@kubb/plugin-fetch` and the only runtime dependency is the global `fetch`. A default `client` and a `createClient` factory are exported from the generated output; swap or extend the transport through the client config (`client.setConfig({ transport })`).

  Options: `output`, `group`, `include`/`exclude`/`override`, `baseURL`, `parser` (zod, success bodies only), and `macros`.

- [#455](https://github.com/kubb-labs/plugins/pull/455) [`8864aa7`](https://github.com/kubb-labs/plugins/commit/8864aa72ae813c24028989b320b3c6947331f80f) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Use the generated `<Operation>RequestConfig` type directly as the client function input.

  `@kubb/plugin-ts` now emits the request-config type with the same field names the runtime client uses — `body`, `path`, `query`, `headers`, `url` — instead of `data`, `pathParams`, `queryParams`, `headerParams`, `url`. `body` is required when the operation has a request body.

  ```ts
  // Before
  export type AddPetRequestConfig = {
    data?: AddPetData;
    pathParams?: never;
    queryParams?: never;
    headerParams?: never;
    url: "/pet";
  };

  // After
  export type AddPetRequestConfig = {
    body: AddPetData;
    path?: never;
    query?: never;
    headers?: never;
    url: "/pet";
  };
  ```

  `@kubb/plugin-fetch` consumes that type as-is, so each operation no longer emits a separate file-local `<Operation>Request` type to rename the fields:

  ```ts
  // Before
  type AddPetRequest = {
    body: AddPetRequestConfig['data']
    path?: AddPetRequestConfig['pathParams']
    query?: AddPetRequestConfig['queryParams']
    headers?: AddPetRequestConfig['headerParams']
    url: AddPetRequestConfig['url']
  }
  export function addPet<ThrowOnError extends boolean = true>(options: Options<AddPetRequest, ThrowOnError>): ...

  // After
  export function addPet<ThrowOnError extends boolean = true>(options: Options<AddPetRequestConfig, ThrowOnError>): ...
  ```

- [#478](https://github.com/kubb-labs/plugins/pull/478) [`39f6760`](https://github.com/kubb-labs/plugins/commit/39f67602ac2a5c1c48afb26ecaaf4f2cd19070ec) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Remove the `@kubb/plugin-client` package. Its axios and fetch runtimes now ship as the dedicated `@kubb/plugin-axios` and `@kubb/plugin-fetch` packages, which speak the same `RequestResult` contract.

  Migrate by swapping the plugin you register:

  ```ts
  // before
  import { pluginClient } from "@kubb/plugin-client";
  pluginClient({ client: "axios" });

  // after
  import { pluginAxios } from "@kubb/plugin-axios";
  pluginAxios({});
  ```

  The query plugins (`plugin-react-query`, `plugin-vue-query`, `plugin-swr`) and `plugin-mcp` now read their bundled client runtime from `@kubb/plugin-axios` and `@kubb/plugin-fetch` instead of `@kubb/plugin-client`. Register one of those packages, or let the hooks emit their own inline contract client when none is registered.

  `plugin-axios` and `plugin-fetch` now export `axiosClientTemplatePath` and `fetchClientTemplatePath` so other plugins can inject the matching runtime.

  Three `plugin-client` options have no equivalent and are dropped: `operations` (the `operations.ts` re-export file), `clientType: 'staticClass'`, and `importPath` for a custom client module. Use the `sdk` option on `plugin-axios` / `plugin-fetch` for class-based output.

- [#475](https://github.com/kubb-labs/plugins/pull/475) [`1e110db`](https://github.com/kubb-labs/plugins/commit/1e110dbb929acfc082989e740de30251c93eaebf) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Discriminate the `RequestResult` contract by a top-level `status`.

  A resolved call now carries its numeric HTTP status as `result.status`, and the result is a union of one variant per documented status. Switching on `result.status` narrows `data` and `error` to that status' payload, so an operation that documents more than one success body (200 vs 201) or several error bodies (400 vs 404) can be handled at the call site:

  ```ts
  const result = await getPetById({ path: { petId: 1 }, throwOnError: false });
  switch (result.status) {
    case 200:
      result.data; // GetPetByIdStatus200
      break;
    case 404:
      result.error; // GetPetByIdStatus404
      break;
  }
  ```

  The change is additive. `data`, `error`, `request`, and `response` keep their shapes, `if (result.error)` still splits success from failure, and `result.status` falls back to `number` for an operation with no documented responses. With `throwOnError` (the default) the result stays the union of the 2xx variants and `error` is `undefined`. `@kubb/plugin-client` injects the same runtime, so its generated output and the query plugins built on it gain the narrowing too.

- [#477](https://github.com/kubb-labs/plugins/pull/477) [`acb8222`](https://github.com/kubb-labs/plugins/commit/acb82223bd14d0a4da97c3548b0477091fe50822) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Add an `sdk` option to `pluginFetch` and `pluginAxios` that generates a class-based SDK. Leave `sdk` unset to keep the standalone per-operation functions, which is the default and what query plugins consume.

  Each tag client is an instance class whose constructor takes a client config and builds its own client, so every environment is a separate instance. A per-call `client` option still overrides the instance client for a one-off call.

  - `sdk: {}` emits one class per tag.
  - `sdk: { name: 'petStore' }` adds a composed root class that instantiates every tag client from one shared config, exposed under each tag.
  - `sdk: { name: 'petStore', mode: 'flat' }` collapses everything into one class named by `name`, with every operation as a direct method. The default `mode: 'tag'` keeps the per-tag classes.

  ```ts
  pluginFetch({
    sdk: { name: "petStore" },
  });

  const api = new PetStore({ baseURL: "https://api.example.com" });
  await api.pet.getPetById({ path: { petId: 1 } });
  ```

  ```ts
  pluginFetch({
    sdk: { name: "petStore", mode: "flat" },
  });

  const api = new PetStore({ baseURL: "https://api.example.com" });
  await api.getPetById({ path: { petId: 1 } });
  ```

### Patch Changes

- [#486](https://github.com/kubb-labs/plugins/pull/486) [`fcb28c1`](https://github.com/kubb-labs/plugins/commit/fcb28c13595d74520bacb526685129350d3bc185) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Inline the option defaults in each client plugin instead of sharing the `resolveOptions` helper from `@internals/client`, matching how `@kubb/plugin-ts` and `@kubb/plugin-zod` resolve their options. Generated output is unchanged.

- [#484](https://github.com/kubb-labs/plugins/pull/484) [`c1a51f8`](https://github.com/kubb-labs/plugins/commit/c1a51f85c45dc313d57925b68e66ee92037a52ed) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Bundle the private internal helper packages into the published output instead of declaring them as runtime dependencies. The published packages no longer reference workspace-only packages that are not on npm, and the release step can version the plugins again.

- Updated dependencies [[`c29bd39`](https://github.com/kubb-labs/plugins/commit/c29bd3949c07ffd23be20a2a6b98eb5de887d913), [`fca3007`](https://github.com/kubb-labs/plugins/commit/fca3007ceda865f7576157e57bcc70d9cbe37add), [`8864aa7`](https://github.com/kubb-labs/plugins/commit/8864aa72ae813c24028989b320b3c6947331f80f), [`7f3a055`](https://github.com/kubb-labs/plugins/commit/7f3a0556b967af0d468c5f9946455b073a1716c8), [`aa7ba7f`](https://github.com/kubb-labs/plugins/commit/aa7ba7f433ecb6ef5004cc2094f9ee7bed45a358), [`7364067`](https://github.com/kubb-labs/plugins/commit/7364067a2800d70822f530c6ab29b3d007cbd4e2), [`6d27528`](https://github.com/kubb-labs/plugins/commit/6d2752810ef46328bcb6b9495e4ff068c5ec43e8), [`4390631`](https://github.com/kubb-labs/plugins/commit/439063187de7b6d6b3fbeafe09a5391ab136bd20)]:
  - @kubb/plugin-ts@5.0.0-beta.73
  - @kubb/plugin-zod@5.0.0-beta.73
