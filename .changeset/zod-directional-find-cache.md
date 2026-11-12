---
'@kubb/plugin-zod': patch
---

Speed up the encode/decode detection on large specs by caching `ast.schema.find` answers for each build.
