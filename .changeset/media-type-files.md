---
'@kubb/plugin-client': minor
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
---

Write a form media type into `.kubb/` only when the spec has a body of that type.

- `multipart/form-data`, `multipart/mixed`, and `application/x-www-form-urlencoded` each have their own file in `.kubb/mediaTypes/`.
- `formMediaTypes` is gone from `.kubb/mediaTypes.ts`. Import `multipartFormData`, `multipartMixed`, or `urlencoded` from its file.
