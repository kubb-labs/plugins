---
'@kubb/plugin-ts': patch
'@kubb/plugin-zod': patch
'@kubb/plugin-faker': patch
---

Reach `childName`, `enumPropName`, `extractRefName`, `isStringType`, `mergeAdjacentObjectsLazy`, `syncSchemaRef`, `containsCircularRef`, and `collectSync` from `kubb/kit` directly instead of through the `ast` namespace.

These helpers moved out of `@kubb/ast`'s `ast` namespace into `kubb/kit`'s flat exports in kubb-labs/kubb, and `ast.collect` now refers to the renamed lazy `collectLazy`. No behavior change; requires the matching `kubb` release.
