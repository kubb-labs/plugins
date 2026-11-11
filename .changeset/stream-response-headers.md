---
'@kubb/plugin-client': minor
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
---

Type the response headers of a stream call. When a `text/event-stream` or JSON Lines response declares headers, such as an `X-Request-ID`, the call now returns `StreamResultWithHeaders` (or `UnwrappedStreamResultWithHeaders` with `returnType: 'data'`), so `result.headers.get` suggests their names as it does on a regular call. `StreamResult`, `UnwrappedStreamResult`, and `client.stream` take the headers record as a new, optional last type argument.
