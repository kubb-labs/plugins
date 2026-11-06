---
'@kubb/plugin-client': minor
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
---

Give stream calls the same shape as regular calls. A stream operation now takes `StreamOptions<TData, ThrowOnError>` and returns `StreamResult<TResponses, ThrowOnError>`, the stream versions of `Options` and `RequestResult`. The result also carries `status`, `error`, `contentType`, and `request`, and checking `status` narrows `error` to the declared error body, as on a regular call. With `throwOnError: false`, a failed stream call now returns its `status` and `error` body. It used to return an empty stream and drop the error. The events are also the result's `data`, so `.unwrap()` resolves to them, and with `returnType: 'data'` a stream call now returns only its events, as a regular call returns only its body. It used to return the full result. `EventStreamOptions` and `EventStreamResult` are unchanged, and `EventStreamResult` takes `ThrowOnError` as an optional third type parameter.
