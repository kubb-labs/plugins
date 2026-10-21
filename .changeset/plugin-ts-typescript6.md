---
'@kubb/plugin-ts': patch
---

Load the compiler API from `@typescript/typescript6`, so the plugin keeps working next to TypeScript 7, which no longer exports it. Printer overrides that build compiler nodes import `ts` from `@typescript/typescript6`.

```diff
- import ts from 'typescript'
+ import ts from '@typescript/typescript6'
```
