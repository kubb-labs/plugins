---
'@kubb/plugin-ts': patch
---

A response whose headers match an earlier status code of the same operation now aliases that type, such as `export type ListPetsStatus429Headers = ListPetsStatus200Headers`, instead of repeating it. Every `<Operation>Status<code>Headers` type is still exported.
