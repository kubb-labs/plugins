---
'@kubb/plugin-ts': patch
---

An operation that accepts several request content types now types `contentType` as the bare media type too, such as `contentType: 'multipart/form-data'`, next to `{ request: 'multipart/form-data' }`. The runtime and the calling-operations guide already accepted the string.
