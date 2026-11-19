---
'@kubb/plugin-client': minor
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
'@kubb/plugin-ky': minor
---

Rename `ParseError` to `ValidationError`, to match `onValidationError` and `ResponseError.validationError`. `ParseError` is still exported as a deprecated alias, and `error.name` stays `'ParseError'`, so existing `instanceof` and name checks keep working.
