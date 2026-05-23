---
"@kubb/plugin-ts": minor
"@kubb/plugin-client": minor
---

Support multiple content types on requests and responses.

- `plugin-ts` now emits a union of per-content-type variants for responses that declare more than one content type (e.g. `GetPetByIdStatus200 = GetPetByIdStatus200Json | GetPetByIdStatus200Xml`), mirroring the existing request-body behaviour. Single-content-type responses are unchanged.
- The generated fetch client parses the response body based on the `Content-Type` header (JSON, text, blob) instead of always calling `res.json()`, honours an explicit `responseType` override, and serializes `application/x-www-form-urlencoded` bodies as `URLSearchParams`. Operations whose success response is a single binary/text content type now default `responseType` (e.g. `'blob'`), so file downloads work out of the box.

Requires `@kubb/adapter-oas` and `@kubb/ast` with response `content` support.
