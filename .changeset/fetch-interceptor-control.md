---
"@kubb/plugin-fetch": minor
---

Give the fetch client interceptors more control over a request.

A request interceptor may return a transport result to short-circuit the send (serve from a cache, stub a response), and an error interceptor may return one to recover a failed call into a success. Returning the request or the error keeps the existing behavior, so current interceptors are unaffected.

`RequestConfig.interceptors` accepts per-call `request`, `response`, and `error` interceptors that run after the instance-level stacks for that single call.

`ClientConfig.Request` (and the per-call `Request`) overrides the `Request` constructor the default transport uses, for non-standard runtimes.
