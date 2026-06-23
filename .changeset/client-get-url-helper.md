---
"@kubb/plugin-fetch": minor
"@kubb/plugin-axios": minor
---

Add a `getUrl` helper to the generated client runtime. `client.getUrl(config)` constructs the final request URL — base URL, interpolated path params, and the serialized query — without sending the request, which is handy for query keys, prefetching, and link building.

```ts
import { client } from './.kubb/client'

const url = client.getUrl({ url: '/pet/{petId}', path: { petId: 1 }, query: { status: ['available'] } })
// => '/pet/1?status=available'
```

Both the fetch and axios runtimes share the same URL serialization the send path already uses, so a built URL matches the one the request would hit.
