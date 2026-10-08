---
'@kubb/plugin-axios': patch
---

Send `application/x-www-form-urlencoded` bodies on Node. A `URLSearchParams` body is now stringified before axios sends it, and gets the urlencoded `Content-Type` when none is set.
