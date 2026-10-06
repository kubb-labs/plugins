---
'@kubb/plugin-ts': patch
---

Generate the `<Operation>Response` alias from successful 2xx responses only. An `unknown` error response no longer erases the success body type in the MSW handlers. All declared statuses stay in `<Operation>Responses`.
