---
"@kubb/plugin-fetch": minor
---

Add a `fetchOptions` escape hatch to the fetch client runtime so callers can reach the rest of the `fetch` `RequestInit`.

The transport previously built a fixed init (`method`, `headers`, `body`, `signal`, `credentials`), leaving no way to set `cache`, `mode`, `redirect`, `keepalive`, `duplex`, or Next.js's non-standard `next: { revalidate, tags }`. The new `fetchOptions` field is accepted on both `ClientConfig` and `RequestConfig` (a per-request value wins over the client-level one), carried onto `ResolvedRequest`, and spread into the `fetch` init before the runtime-owned fields, so it can never override the method, headers, body, signal, or credentials.

```ts
client.setConfig({ fetchOptions: { cache: 'no-store' } })
await getPetById({ path: { petId: 1 }, fetchOptions: { cache: 'force-cache', next: { revalidate: 60 } } })
```
