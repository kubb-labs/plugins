---
'@kubb/plugin-client': major
'@kubb/plugin-fetch': major
'@kubb/plugin-axios': major
---

Run the fetch and axios clients on one core with the same interceptors and client factory.

- Import types from `templates/client.ts` and the shared runtime from `@kubb/plugin-client/templates/*`. `templates/fetch.ts` and `templates/axios.ts` are gone.
- Rename `FetchOptions` and `AxiosOptions` to `NativeOptions`.
- Write `EventStreamResult<ServerSentEvent<Pet>>` where you wrote `EventStreamResult<Pet>`, and the same for `StreamResult` and `UnwrappedStreamResult`.
- Return a web `Response` from a custom transport, and build its init with `toRequestInit(request)`, so a ky transport is one call.
- On axios, `client.interceptors` handlers get the core objects. Native handlers go on `getAxiosInstance().interceptors`, and `validateStatus`, `AxiosTransport`, `InterceptorFn`, and `InterceptorChannel` are gone.
- Rename `codecs` to `mediaTypes`. `serialize(body, contentType)` becomes `encode(body, context)`, and `deserialize(raw, contentType)` becomes `decode(response, context)`, which reads the body itself: `await response.text()`.
- Move a custom `serializer.body` into a `mediaTypes` entry. Serializers now cover path, query, header, and cookie only.
- Replace `responseType` on a call with `parseAs`, such as `parseAs: 'blob'`. The media type now comes from the response `Content-Type`, matched exactly, by `+json` suffix, by `type/*`, then `*/*`.
- Catch the `ParseError` that invalid JSON under a JSON media type now throws, or register a lenient `application/json` handler. An empty body is `undefined` for every media type.
- Replace `toEventStream(call, { shape })` with `client.stream({ ...config, eventShape })`, whose `data` is already the stream. Import `ServerSentEvent`, `TypedEvent`, and `StreamResult` from `.kubb/client`.
- Return a web `Response`, or `{ webResponse, request, response }`, from a transport, not a result with a parsed body. `readResponse`, `resolveResponseType`, `parseJsonOrText`, `isStreamed`, `CallResult`, `ResponseType`, `ResponseTypeMap`, `Codec`, and `defaultBodySerializer` are gone. Response interceptors receive a `DecodedResponse`.
- On axios, replace `axiosInstance` with `getAxiosInstance()`, which creates the instance on first use. Native axios response interceptors now see the raw bytes.
- Narrow `client.interceptors.error` handlers with `ResponseError.is`: they now see network errors, aborts, and validation errors too, and each one gets the error the previous handler returned.
- Expect the error body to be validated on the throwing path too, and a `2XX` key to count as success.
- A custom client (`importPath`) must make `client` generic, `client<TResponses, ThrowOnError>(config)`, and add a `stream` method for stream operations. Copy the `ClientInstance` type from `core.ts`, or build on `createClientCore`.

New: generated calls pass their types to `apiClient<Responses, ThrowOnError>(config)` with no cast, `isResponseError<Responses>(error)` narrows a thrown error by status, `client.extend(config)` keeps the parent's interceptors, `auth` sends every scheme a security requirement needs, and the default client is created on first use.

```diff
- import { client, defaultTransport } from './gen/.kubb/client'
+ import { client, createAxiosTransport, getAxiosInstance } from './gen/.kubb/client'

- defaultTransport.defaults.timeout = 10_000
- client.setConfig({ transport: axios.create({ baseURL }) })
+ getAxiosInstance().defaults.timeout = 10_000
+ client.setConfig({ transport: createAxiosTransport(axios.create({ baseURL })) })
```

To upgrade, regenerate, run `tsc --noEmit`, and fix each error with your plugin's "Migrate to v6" guide. The query plugins work with v5 and v6.
