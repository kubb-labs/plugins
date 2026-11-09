---
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Validate an error body only when the call returns it with `throwOnError: false`, as the `validator` docs say. Before, a failed call that throws ran the error schema too, so an error body the document does not describe, such as a gateway's HTML 502, threw a `ParseError` instead of the `ResponseError`.
