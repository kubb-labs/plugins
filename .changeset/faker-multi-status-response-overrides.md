---
'@kubb/plugin-faker': patch
---

Merge object overrides into union factories: the response factory of an operation with more than one success status, and the factory of a response or request body with more than one content type. `createGetPetResponse({ name: 'Fluffy' })` now picks an object factory and passes `data` to it, so the mock keeps its other generated fields instead of returning `{ name: 'Fluffy' }` as is. An array or scalar override is still returned as is.
