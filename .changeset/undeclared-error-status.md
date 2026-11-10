---
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Check an error body against the schema of its own status, and merge a per-call `validator` with the generated one.

- `validator.error` is a map by status, such as `{ 404: getPetStatus404Schema, '5xx': getPetStatus5xxSchema }`, matched by status, then range, then `default`. A single `error` validator still checks every non-2xx body.
- With `validator: 'zod'` and `throwOnError: false`, a status the document leaves out, such as a gateway `502`, resolves with its body as `error` instead of rejecting with a `ParseError`.
- A per-call `validator: { request }` keeps the generated response and error validators, and a per-call `styles` entry overrides only that parameter's style.
