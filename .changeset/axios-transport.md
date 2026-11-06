---
'@kubb/plugin-axios': major
'@kubb/plugin-fetch': major
---

Run the axios client on the same core as the fetch client, with axios as a transport.

- `client.interceptors.request`, `.response`, and `.error` handlers receive the `ResolvedRequest`, `TransportResult`, and `ResponseError` of the core, as in `@kubb/plugin-fetch`, instead of the axios config, response, and error. Register axios interceptors on `axiosInstance` or on your own instance.
- `transport` is a function. Wrap an `AxiosInstance` with `createAxiosTransport(instance)`. The exported `defaultTransport` is that function for `axiosInstance`, the `axios.create()` instance the client sends through.
- `validateStatus` is gone: the core splits success from error by status for every transport.
- `InterceptorChannel` is now `InterceptorStack`.
- Both clients drop the `params` alias of `query` on a call config.
- The client templates ship as `templates/client.ts` instead of `templates/fetch.ts` and `templates/axios.ts`.

```ts
import axios from 'axios'
import { client, createAxiosTransport } from './gen/.kubb/client'

client.setConfig({ transport: createAxiosTransport(axios.create({ timeout: 10_000 })) })
```
