---
"@kubb/plugin-client": minor
"@kubb/plugin-react-query": minor
"@kubb/plugin-ts": minor
---

Support multiple content types in `requestBody`.

When an OpenAPI operation declares more than one content type for its `requestBody` (e.g. `application/json` **and** `multipart/form-data`), plugins now generate correct output for all declared types instead of silently ignoring all but the first.

- **plugin-ts**: emits individual types per content type (e.g. `UploadFileJsonData`, `UploadFileFormData`) plus a union alias (`type UploadFileData = UploadFileJsonData | UploadFileFormData`).
- **plugin-client**: adds a `contentType` parameter with a literal union type and a default matching the first declared type; uses a runtime ternary to dispatch between form-data and JSON request paths.
- **plugin-react-query**: `contentType` is forwarded through mutation variables into the client call; `buildFormData` import is now conditional on the operation actually using `multipart/form-data`.

Single-content-type operations are backwards-compatible — generated output is identical to before.
