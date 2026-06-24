---
"@kubb/plugin-fetch": patch
"@kubb/plugin-axios": patch
---

Build `FormData` again for `multipart/form-data` request bodies (#512).

Operations with a non-JSON request body now forward their content type to the runtime client, and the default body serializer converts a plain object into `FormData` for `multipart/form-data` (mirroring the existing `application/x-www-form-urlencoded` → `URLSearchParams` handling). A `Blob`/`File` value passes through, a `Date` becomes an ISO string, arrays expand into repeated keys, and nested objects are JSON-serialized. The `Content-Type` header is omitted whenever the serialized body is a `FormData` instance — including a manually supplied one — so the runtime appends the multipart boundary itself.
