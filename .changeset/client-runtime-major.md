---
'@kubb/plugin-client': major
'@kubb/plugin-fetch': major
'@kubb/plugin-axios': major
---

Remove the compatibility layer around the shared client runtime. The fetch and axios clients now share one interceptor API and one client factory, and stream results take the full event type.

Each plugin has a "Migrate to v6" guide with before-and-after code. In short:

- **Template subpaths.** `@kubb/plugin-fetch/templates/fetch.ts` and `@kubb/plugin-axios/templates/axios.ts` are gone. Import `templates/client.ts` instead. Both plugins also stop publishing `templates/core.ts`, `templates/serializers.ts`, and `templates/standardSchema.ts`, which only re-exported `@kubb/plugin-client/templates/*`. Import those from `@kubb/plugin-client`.
- **axios interceptors.** `client.interceptors` handlers receive the `ResolvedRequest`, `TransportResult`, and `ResponseError`, as on the fetch client. Register native axios handlers on `axiosInstance.interceptors` instead. `client.interceptors.error` now runs for a `ResponseError` only, not for a network error with no response. To log network errors, add an error callback with `axiosInstance.interceptors.response.use(undefined, onError)`.
- **axios transport.** `transport` takes a transport function. Wrap an axios instance with `createAxiosTransport(instance)`.
- **axios default instance.** `defaultTransport` is now the transport function, and the instance it sends through is `axiosInstance`. Replace `defaultTransport.defaults` and `defaultTransport.interceptors` with `axiosInstance.defaults` and `axiosInstance.interceptors`. Clients from `createClient()` inherit the `transport` of `client`, and send through `axiosInstance` when neither sets one.
- **Removed axios exports.** `validateStatus`, which had no effect, `AxiosTransport`, and `InterceptorChannel` are removed. `createClientCore`, `ClientInstance`, and `Interceptors` come from the shared core, and `createClientCore({ defaultTransport })` takes a transport function.
- **Stream event type.** `EventStreamResult`, `StreamResult`, and `UnwrappedStreamResult` take the full event type, so write `EventStreamResult<ServerSentEvent<Pet>>` where you wrote `EventStreamResult<Pet>`. A custom client from `@kubb/plugin-client` exports `ServerSentEvent` next to `TypedEvent`, and its `EventStreamResult` takes the full event type.

The generated `.kubb/client.ts` still exports `RequestConfig`, `ResponseErrorConfig`, and `RequestResult`, and calls still return `.unwrap()`. `@kubb/plugin-react-query`, `@kubb/plugin-vue-query`, `@kubb/plugin-swr`, and `@kubb/plugin-mcp` work with this release and with the previous one.
