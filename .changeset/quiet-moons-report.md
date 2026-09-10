---
'@kubb/plugin-axios': minor
'@kubb/plugin-fetch': minor
---

Add `onValidationError` to `ClientConfig` and `RequestConfig`, so a body that fails its schema no longer has to throw. The handler receives the `ParseError` plus the failing `value` and the call's `direction` / `method` / `url` / `status`; returning nothing rethrows (the default, unchanged), and returning `{ value }` resolves the call with that value instead. This makes it possible to report a drifted response to your error tracker and still render the page.
