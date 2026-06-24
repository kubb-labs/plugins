# @kubb/plugin-axios

## 5.0.0-beta.76

### Patch Changes

- Updated dependencies [[`4c7e449`](https://github.com/kubb-labs/plugins/commit/4c7e449383a8888273b1e7f32222a5d869d9c4d8), [`e64ff08`](https://github.com/kubb-labs/plugins/commit/e64ff085c2ad3676291d7c81cfb9be1761012798)]:
  - @kubb/plugin-ts@5.0.0-beta.76
  - @kubb/plugin-zod@5.0.0-beta.76

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

### Minor Changes

- [#475](https://github.com/kubb-labs/plugins/pull/475) [`e0f0138`](https://github.com/kubb-labs/plugins/commit/e0f013848d4d42d59db8de6b7a7595409950f726) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Add `@kubb/plugin-axios`, an HTTP client plugin pinned to axios. Each operation becomes one async function that takes a single grouped `options` object and returns the shared `RequestResult` contract, with a per-call `throwOnError` flag (default `true`):

  - `throwOnError: true` (default): a non-2xx status throws `ResponseError` (normalized from the rejected axios error) and `data` is always defined.
  - `throwOnError: false`: maps to an internal `validateStatus: () => true` (a user-provided `validateStatus` wins) and returns errors as values, discriminated by `error`.

  The runtime is always bundled into `.kubb/client.ts`, so generated code never imports from `@kubb/plugin-axios` and the only runtime dependency is `axios`. A default `client` and a `createClient` factory are exported from the generated output. The `transport` config field takes an axios instance (default `axios.create()`), so you can bring an instance that already carries interceptors, retry adapters, or proxy config. Interceptors delegate to axios's native `interceptors.request`/`interceptors.response`, and `querySerializer`/`bodySerializer` map onto axios's `paramsSerializer`/`transformRequest`. On the result, `request`/`response` are the axios request config and `AxiosResponse`.

  Options: `output`, `group`, `include`/`exclude`/`override`, `baseURL`, `parser` (zod, success bodies only), and `macros`.

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
