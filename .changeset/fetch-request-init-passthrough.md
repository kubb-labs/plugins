---
"@kubb/plugin-fetch": minor
"@kubb/plugin-axios": minor
---

Add an arbitrary request-options escape hatch to the fetch and axios client runtimes.

`@kubb/plugin-fetch` gains a `fetchOptions` field. The transport previously built a fixed init (`method`, `headers`, `body`, `signal`, `credentials`), leaving no way to set `cache`, `mode`, `redirect`, `keepalive`, `duplex`, or Next.js's non-standard `next: { revalidate, tags }`.

`@kubb/plugin-axios` gains the symmetric `axiosOptions` field (typed as `AxiosRequestConfig`) for per-call fields the runtime does not set itself, such as `timeout`, `proxy`, `maxRedirects`, `decompress`, and the `onUploadProgress` / `onDownloadProgress` callbacks. The pre-configured `transport` instance stays the place for cross-cutting concerns like retries and interceptors.

Both fields are accepted on `ClientConfig` and `RequestConfig` (a per-request value wins over the client-level one) and are spread into the request before the runtime-owned fields, so they can never override what the runtime controls (URL, method, headers, body, serialization, and `throwOnError` handling).

```ts
// fetch
client.setConfig({ fetchOptions: { cache: 'no-store' } })
await getPetById({ path: { petId: 1 }, fetchOptions: { cache: 'force-cache', next: { revalidate: 60 } } })

// axios
client.setConfig({ axiosOptions: { timeout: 10_000 } })
await getPetById({ path: { petId: 1 }, axiosOptions: { timeout: 2_000, onUploadProgress: (e) => console.log(e) } })
```
