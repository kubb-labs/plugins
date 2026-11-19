---
'@kubb/plugin-client': minor
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
'@kubb/plugin-ky': minor
---

Rename `ParseError` to `ValidationError`, to match `onValidationError`. `ParseError` is still exported as a deprecated alias, so existing imports and `instanceof ParseError` checks keep working. `error.name` is now `'ValidationError'`: update any check on `error.name === 'ParseError'`.
