---
'@kubb/plugin-client': major
'@kubb/plugin-fetch': major
'@kubb/plugin-axios': major
---

Run the fetch and axios clients on one core with the same interceptors and client factory.

- Import types from `templates/client.ts` and the runtime from `@kubb/plugin-client/templates/*`. `templates/fetch.ts` and `templates/axios.ts` are gone.
- `FetchOptions` and `AxiosOptions` are now `NativeOptions`.
- Stream types take the event: `EventStreamResult<ServerSentEvent<Pet>>` instead of `EventStreamResult<Pet>`, also for `StreamResult` and `UnwrappedStreamResult`.
- A custom transport returns a web `Response` and builds its init with `toRequestInit(request)`.
- On axios, `client.interceptors` handlers get the core objects and skip network errors. Native handlers go on `axiosInstance.interceptors`. `validateStatus`, `AxiosTransport`, `InterceptorFn`, and `InterceptorChannel` are gone.

```diff
- import { client, defaultTransport } from './gen/.kubb/client'
+ import { axiosInstance, client, createAxiosTransport } from './gen/.kubb/client'

- defaultTransport.defaults.timeout = 10_000
- client.setConfig({ transport: axios.create({ baseURL }) })
+ axiosInstance.defaults.timeout = 10_000
+ client.setConfig({ transport: createAxiosTransport(axios.create({ baseURL })) })
```

To upgrade, regenerate, run `tsc --noEmit`, and follow your plugin's "Migrate to v6" guide. The query plugins work with v5 and v6.
