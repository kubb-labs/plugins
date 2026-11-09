---
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Check an error body against the error schema only for statuses the document declares. With `validator: 'zod'` and `throwOnError: false`, a status the document leaves out, such as a `502` from a gateway, now resolves with its body as `error` instead of rejecting with a `ParseError`. A `default` response declares every status.

The generated call lists the declared statuses in the new `validator.errorStatus` option, for example `[404, '5XX']`. Without `errorStatus`, `validator.error` checks every non-2xx body as before.
