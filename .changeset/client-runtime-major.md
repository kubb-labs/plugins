---
'@kubb/plugin-client': major
'@kubb/plugin-fetch': major
'@kubb/plugin-axios': major
---

Remove the compatibility layer around the client runtime. The fetch and axios clients share one interceptor API and one client factory, and stream results take the full event type.

- Import client types from `templates/client.ts`, and `NativeOptions` for the `options` type of a call. `templates/fetch.ts`, `templates/axios.ts`, `FetchOptions`, and `AxiosOptions` are gone, and the shared runtime comes from `@kubb/plugin-client/templates/*`. The package exports `templates/client.ts` for its types only.
- Pass the full event type to `EventStreamResult`, `StreamResult`, and `UnwrappedStreamResult`: `EventStreamResult<ServerSentEvent<Pet>>` where you wrote `EventStreamResult<Pet>`.
- Receive `ResolvedRequest`, `TransportResult`, and `ResponseError` in axios `client.interceptors` handlers, as on fetch. Native axios handlers go on `axiosInstance.interceptors`, and `client.interceptors.error` no longer runs for a network error.
- Wrap an axios instance with `createAxiosTransport(instance)` to use it as `transport`. `defaultTransport` is now a function, and `axiosInstance` is the instance behind it.
- Removed from the axios client: `validateStatus`, `AxiosTransport`, `InterceptorFn`, and `InterceptorChannel`. `createClientCore`, `ClientInstance`, and `Interceptors` come from the shared core.

```diff
- import { client, defaultTransport } from './gen/.kubb/client'
+ import { axiosInstance, client, createAxiosTransport } from './gen/.kubb/client'

- defaultTransport.defaults.timeout = 10_000
- client.setConfig({ transport: axios.create({ baseURL }) })
+ axiosInstance.defaults.timeout = 10_000
+ client.setConfig({ transport: createAxiosTransport(axios.create({ baseURL })) })
```

To upgrade, regenerate, run the type checker, and fix each error with the "Migrate to v6" guide of your plugin. The query plugins work with v5 and v6, so upgrade them separately.
