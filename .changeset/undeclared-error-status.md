---
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Check an error body against the schema of its own status. With `validator: 'zod'` and `throwOnError: false`, a status the document leaves out, such as a `502` from a gateway, now resolves with its body as `error` instead of rejecting with a `ParseError`. A `default` response covers every status.

The generated call passes `validator.error` as a map by status, for example `{ 404: getPetStatus404Schema, '5XX': getPetStatus5XXSchema }`, so each error body is checked against the schema of its own status, then its range, then `default`. A single validator for `error` still checks every non-2xx body.
