---
'@kubb/plugin-client': major
'@kubb/plugin-fetch': major
'@kubb/plugin-axios': major
---

Remove the compatibility layer around the shared client runtime. The fetch and axios clients now share one interceptor API and one client factory, and stream results take the full event type.

Migrate as follows:

- **Template subpaths.** `@kubb/plugin-fetch/templates/fetch.ts` and `@kubb/plugin-axios/templates/axios.ts` are gone. Import `templates/client.ts` instead.
- **axios interceptors.** `client.interceptors` handlers receive the `ResolvedRequest`, `TransportResult`, and `ResponseError`, as on the fetch client. Register native axios handlers on `axiosInstance.interceptors` instead.
- **axios transport.** `transport` takes a transport function. Wrap an axios instance with `createAxiosTransport(instance)`.
- **axios default instance.** `defaultTransport` is now the transport function, and the instance it sends through is `axiosInstance`. Replace `defaultTransport.defaults` and `defaultTransport.interceptors` with `axiosInstance.defaults` and `axiosInstance.interceptors`. Clients from `createClient()` send through the same `axiosInstance` unless they get a `transport`.
- **Removed axios exports.** `validateStatus`, which had no effect, `AxiosTransport`, and `InterceptorChannel` are removed. `createClientCore`, `ClientInstance`, and `Interceptors` come from the shared core, and `createClientCore({ defaultTransport })` takes a transport function.
- **Stream event type.** `EventStreamResult`, `StreamResult`, and `UnwrappedStreamResult` take the full event type, so write `EventStreamResult<ServerSentEvent<Pet>>` where you wrote `EventStreamResult<Pet>`. A custom client from `@kubb/plugin-client` exports `ServerSentEvent` next to `TypedEvent`, and its `EventStreamResult` takes the full event type.

The generated `.kubb/client.ts` still exports `RequestConfig`, `ResponseErrorConfig`, and `RequestResult`, and calls still return `.unwrap()`. `@kubb/plugin-react-query`, `@kubb/plugin-vue-query`, `@kubb/plugin-swr`, and `@kubb/plugin-mcp` work with this release and with the previous one.
