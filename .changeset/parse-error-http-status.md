---
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
'@kubb/plugin-ky': patch
---

Keep the HTTP status when a response body fails its schema. A `ParseError` thrown inside a call now carries `status`, `method`, `direction`, and `source`, so `error.status === 404` works when a non-2xx body does not match its error schema. When `onValidationError` returns `{ value }` for an error body, the `ResponseError` carries the original `ParseError` on `validationError`.
