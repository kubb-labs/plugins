---
'@kubb/plugin-ts': patch
'@kubb/plugin-zod': patch
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
'@kubb/plugin-cypress': patch
'@kubb/plugin-mcp': patch
---

An operation whose `requestBody` is not `required: true` now types `body` as optional in its options, as OpenAPI defines. A call such as petstore's `updateUser({ path: { username } })` typechecks without a body. When the operation has no required parameter either, the generated client takes no argument at all, such as `createUser()`. A body marked `required: true` stays required.
