---
'@kubb/plugin-client': major
'@kubb/plugin-fetch': major
'@kubb/plugin-axios': major
---

Run the fetch and axios clients on one core with the same interceptors and client factory, and pass the full event type to stream result types.

- Import types from `templates/client.ts`, which the package now exports for types only, and the shared runtime from `@kubb/plugin-client/templates/*`. `templates/fetch.ts` and `templates/axios.ts` are gone.
- Use `NativeOptions` where you used `FetchOptions` or `AxiosOptions`.
- Write `EventStreamResult<ServerSentEvent<Pet>>` where you wrote `EventStreamResult<Pet>`, and the same for `StreamResult` and `UnwrappedStreamResult`.
- On axios, `client.interceptors` handlers get the `ResolvedRequest`, `TransportResult`, and `ResponseError`, and the error handler skips network errors. Register native axios handlers on `axiosInstance.interceptors`.
- On axios, wrap an instance with `createAxiosTransport(instance)` to pass it as `transport`. `defaultTransport` is a function now, and `validateStatus`, `AxiosTransport`, `InterceptorFn`, and `InterceptorChannel` are gone.

```diff
- import { client, defaultTransport } from './gen/.kubb/client'
+ import { axiosInstance, client, createAxiosTransport } from './gen/.kubb/client'

- defaultTransport.defaults.timeout = 10_000
- client.setConfig({ transport: axios.create({ baseURL }) })
+ axiosInstance.defaults.timeout = 10_000
+ client.setConfig({ transport: createAxiosTransport(axios.create({ baseURL })) })
```

To upgrade, regenerate, run `tsc --noEmit`, and fix each error with your plugin's "Migrate to v6" guide. The query plugins work with v5 and v6.
