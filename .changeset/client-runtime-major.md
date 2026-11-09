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
- On axios, `client.interceptors` handlers get the core objects and skip network errors. Native handlers go on `axiosInstance.interceptors`, and `validateStatus`, `AxiosTransport`, `InterceptorFn`, and `InterceptorChannel` are gone.

```diff
- import { client, defaultTransport } from './gen/.kubb/client'
+ import { axiosInstance, client, createAxiosTransport } from './gen/.kubb/client'

- defaultTransport.defaults.timeout = 10_000
- client.setConfig({ transport: axios.create({ baseURL }) })
+ axiosInstance.defaults.timeout = 10_000
+ client.setConfig({ transport: createAxiosTransport(axios.create({ baseURL })) })
```

To upgrade, regenerate, run `tsc --noEmit`, and fix each error with your plugin's "Migrate to v6" guide. The query plugins work with v5 and v6.
