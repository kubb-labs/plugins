---
'@kubb/plugin-client': minor
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
'@kubb/plugin-ky': minor
---

Add an opt-in `retry` setting to the generated client, on `client.setConfig` and on each call. It retries a transport error and the statuses 408, 429, 500, 502, 503, and 504, and works the same on fetch, axios, and ky.

```ts
client.setConfig({ retry: 2 })

await createOrder({ body, retry: { methods: ['POST'] } })
await chargeCard({ body, retry: false })
```

Retries are off unless you set `retry`. A retry waits with exponential backoff and jitter, follows a `Retry-After` header, and stops when the `signal` aborts. `POST` and `PATCH` are retried only when `retry.methods` names them. A streaming call with `retry` also reopens a dropped Server-Sent Events stream with its `Last-Event-ID`.
