---
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Generate a shorter `.kubb/client.ts`. The shared `core.ts` now reads `NativeRequest` and `NativeResponse` from the `client.ts` next to it and uses them as its type defaults, so the client no longer re-declares `RequestResult`, `UnwrappedResult`, `Transport`, `TransportResult`, `CallResult`, and `ResponseErrorConfig` only to bind them. Every name is still exported from `.kubb/client.ts` with the same type.
