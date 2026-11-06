---
'@kubb/plugin-axios': minor
'@kubb/plugin-fetch': minor
---

Run the axios client on the same core as the fetch client, with axios as a transport.

- `transport` takes an `AxiosInstance`, as before, or a function that receives the resolved request, as in `@kubb/plugin-fetch`. `createAxiosTransport(instance)` turns an instance into that function, and `createClientCore({ defaultTransport })` keeps taking an instance.
- `client.interceptors` keeps handing native axios objects to its handlers and registers them on `defaultTransport`. They no longer follow an instance set later with `setConfig({ transport })`, and the `requestConfig` argument they received is always `undefined`.
- `validateStatus` is deprecated and has no effect: the client splits success from error by status, so axios never throws on a status.
- The client templates ship as `templates/client.ts`. `templates/fetch.ts` and `templates/axios.ts` re-export them.

```ts
import axios from 'axios'
import { client } from './gen/.kubb/client'

client.setConfig({ transport: axios.create({ timeout: 10_000 }) })
```
