---
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

`ResponseErrorOf`, `StreamResult` and `isResponseError` imported from `@kubb/plugin-fetch/templates/client.ts` or `@kubb/plugin-axios/templates/client.ts` now default to the client's native request and response (`Request`/`Response` or `AxiosRequestConfig`/`AxiosResponse`) instead of `unknown`, matching the generated `.kubb/` runtime.
