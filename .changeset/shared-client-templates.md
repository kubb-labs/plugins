---
'@kubb/plugin-client': minor
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
---

Ship the client runtime once. `@kubb/plugin-client` now holds the templates every client plugin copies: `core.ts` (the request pipeline, interceptors, validation, and result types), `serializers.ts`, `standardSchema.ts`, and `sse.ts`. `@kubb/plugin-fetch` and `@kubb/plugin-axios` depend on it, copy those files into `.kubb/`, and keep one template of their own, `client.ts`, with the transport and the types bound to its native request and response.

- Generated output gains `.kubb/core.ts`. `.kubb/client.ts` re-exports `core.ts` and `sse.ts` with the result types and `toEventStream` bound to the transport's native request and response, and generated operations import everything from it.
- `.kubb/sse.ts` is copied for every document, since `.kubb/client.ts` re-exports it.
