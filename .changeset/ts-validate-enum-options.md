---
'@kubb/plugin-ts': patch
---

Fail the run with a clear error when `enum.type`, `syntaxType`, `arrayType`, or `optionalType` has a value outside the allowed set. Before, an unknown value fell back to other output silently. For example, `optionalType: 'bogus'` made optional properties required.
