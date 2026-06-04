---
"@kubb/plugin-ts": patch
---

Add regression tests covering the v4 plugin-ts enum bugs from kubb-labs/kubb#3475 (array-of-objects with a nested enum collapsing to a bare enum array under `enumType: 'asConst'`) and kubb-labs/kubb#3476 (`#`-prefixed enum values like hex colours emitting as unquoted object keys). The v5 rewrites of `Type.tsx` and `isValidIdentifier` already prevent both, the new tests lock the scenarios in.
