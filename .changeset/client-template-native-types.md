---
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Give the types imported from `@kubb/plugin-fetch/templates/client.ts` and `@kubb/plugin-axios/templates/client.ts` the client's native request and response, as in the generated client. `client`, `createClient`, `isResponseError`, `StreamOptions`, `StreamResult`, `UnwrappedStreamResult`, and `ResponseErrorOf` resolved them to `unknown`.
