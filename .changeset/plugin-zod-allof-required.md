---
'@kubb/plugin-zod': patch
---

Preserve required properties when later `allOf` members narrow them without repeating `required`, in both Zod and Zod Mini schemas.
