---
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
'@kubb/plugin-ts': patch
'@kubb/plugin-zod': patch
---

A `multipart/mixed` response with an OpenAPI 3.2 `itemSchema` is read as its list of parts and typed as an array, where the body failed validation as one item. JSON parts are parsed and other parts stay text. An `itemSchema` on `multipart/form-data` no longer turns the request body into an array.
