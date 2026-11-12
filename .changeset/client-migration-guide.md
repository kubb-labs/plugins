---
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Rewrite the "Migrate to v6" guides for the client, fetch, and axios plugins from the changes on `main`. They now cover JSON Lines streams, response headers, cookie styles, the new serializer and media type files, generated file paths, and error validators per status, and drop exports that 5.x never had.
