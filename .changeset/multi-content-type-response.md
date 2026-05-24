---
"@kubb/plugin-ts": minor
"@kubb/plugin-client": minor
"@kubb/plugin-zod": minor
"@kubb/plugin-faker": minor
"@kubb/plugin-msw": minor
---

Support multiple content types on requests and responses.

- `plugin-ts` now emits a union of per-content-type variants for responses that declare more than one content type (e.g. `GetPetByIdStatus200 = GetPetByIdStatus200Json | GetPetByIdStatus200Xml`), mirroring the existing request-body behaviour. Single-content-type responses are unchanged.
- `plugin-zod` and `plugin-faker` mirror this: they emit one schema/mock per content type plus a union alias for both responses and request bodies (e.g. `addPetStatus200Schema = z.union([addPetStatus200SchemaJson, addPetStatus200SchemaXml])`, and a `createAddPetStatus200` factory that picks between the per-content-type factories). Variant names line up across the three plugins via shared naming helpers.
- `plugin-msw` prefers the `application/json` content type for the mocked response's `Content-Type` header when a response declares several.
- The generated fetch client parses the response body based on the `Content-Type` header (JSON, text, blob) instead of always calling `res.json()`, honours an explicit `responseType` override, and serializes `application/x-www-form-urlencoded` bodies as `URLSearchParams`. Operations whose success response is a single binary/text content type now default `responseType` (e.g. `'blob'`), so file downloads work out of the box.

Single-content-type operations are backwards-compatible — generated output is unchanged.

Requires `@kubb/adapter-oas` and `@kubb/ast` with response `content` support.
