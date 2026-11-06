---
'@kubb/plugin-axios': minor
'@kubb/plugin-fetch': minor
---

Run the axios client on the same core as the fetch client, with axios as a transport.

- `transport` takes a function that receives the resolved request, as in `@kubb/plugin-fetch`. `createAxiosTransport(instance)` turns an axios instance into that function.
- The client splits success from error by status, so axios never throws on a status.
- The client templates ship as `templates/client.ts`.

```ts
import axios from 'axios'
import { client, createAxiosTransport } from './gen/.kubb/client'

client.setConfig({ transport: createAxiosTransport(axios.create({ timeout: 10_000 })) })
```
