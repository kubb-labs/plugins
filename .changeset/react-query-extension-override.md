---
'@kubb/plugin-react-query': patch
---

Apply `override` entries that use the `extension` filter from Kubb 5.11 when generating hook options, so `{ type: 'extension', key: 'x-internal' }` now matches operations by vendor extension.
