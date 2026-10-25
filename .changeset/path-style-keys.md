---
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Path parameter styles are keyed by the spec name of the parameter, so `style` and `explode` now apply to path parameters that are not camelCase, such as `pet_id` and `scope.id`.
