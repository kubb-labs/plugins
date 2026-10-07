---
"@kubb/plugin-axios": patch
"@kubb/plugin-fetch": patch
---

Keep the request `contentType` in generated SDK methods when `sdk.mode` is `'tag'`, so operations with a non-JSON request body such as `application/x-www-form-urlencoded` send the right content type.
