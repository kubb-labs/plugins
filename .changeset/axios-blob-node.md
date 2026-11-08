---
'@kubb/plugin-axios': patch
---

Return a `Blob` for a `responseType: 'blob'` call on the Node http adapter, as the fetch client does. Before, the adapter decoded the bytes as text, so a download came back as a corrupted string.
