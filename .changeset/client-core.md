---
'@kubb/plugin-client': minor
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Export `resolveClientOptions`, `setupClient`, `clientDependencies`, `resolverClient`, and the `ClientOptions` and `ClientResolvedOptions` types from `@kubb/plugin-client`. `@kubb/plugin-fetch` and `@kubb/plugin-axios` now use them, and a transport plugin of your own can too.

Drop the undocumented `clientGenerator` export from `@kubb/plugin-fetch` and `@kubb/plugin-axios`.
