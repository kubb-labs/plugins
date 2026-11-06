---
'@kubb/plugin-axios': patch
---

Return a `Blob` for a `responseType: 'blob'` call on the Node http adapter, as the fetch client does. The adapter has no `'blob'` and decoded the bytes as text, so a generated binary call such as an image download returned a corrupted string. The transport now reads a buffer and wraps it. The fetch adapter and the browser adapters keep `'blob'`.
