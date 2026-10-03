---
'@kubb/plugin-faker': patch
---

Preserve required properties when calling mock factories without overrides in nullable types, unions, and nested expressions. Infer overrides only from the data argument using `NoInfer`, removing the need for explicit `<object>` type arguments.
