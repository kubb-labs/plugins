---
'@kubb/plugin-ts': patch
'@kubb/plugin-zod': patch
---

An operation whose `requestBody` is not `required: true` now types `body` as optional in its options, as OpenAPI defines. A call such as petstore's `updateUser({ path: { username } })` typechecks without a body. A body marked `required: true` stays required.
