---
"@kubb/plugin-client": minor
---

The bundled fetch client now throws a `ResponseError` for responses outside the 2xx range, so a resolved call always means success — the same contract the axios client enforces through its default `validateStatus`.

`ResponseError<TError>` extends `Error` and exposes the parsed error body and response metadata on `response` (`data`, `status`, `statusText`, `headers`). `ResponseErrorConfig<TError>` changes from the bare `TError` body to `ResponseError<TError>`, mirroring how the axios client wraps errors in `AxiosError<TError>`:

```ts
try {
  const { data } = await getStatus()
} catch (e) {
  if (e instanceof ResponseError) {
    console.error(e.response.status, e.response.data)
  }
}
```

Set `throwOnError: false` to keep the previous behavior of resolving every response regardless of status — as a plugin option (so generated types and zod validation widen to match), per request, or through `client.setConfig`. The axios client maps `throwOnError: false` to a permissive `validateStatus` unless a custom one is provided.
