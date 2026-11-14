---
'@kubb/plugin-faker': patch
---

Merge `data` overrides in the response factory of an operation with more than one success status. `createGetPetResponse({ name: 'Fluffy' })` now picks a status factory and passes `data` to it, so the mock keeps its other generated fields instead of returning `{ name: 'Fluffy' }` as is. An array override only goes to an array status, and an object override only to an object status.
