---
'@kubb/plugin-client': minor
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Export `resolveClientOptions`, `setupClient`, `clientDependencies`, and the `ClientOptions` types from `@kubb/plugin-client`, so `@kubb/plugin-fetch` and `@kubb/plugin-axios` share one generator.

Drop the undocumented `clientGenerator` export from `@kubb/plugin-fetch` and `@kubb/plugin-axios`.
