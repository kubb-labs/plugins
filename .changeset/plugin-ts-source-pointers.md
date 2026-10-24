---
'@kubb/plugin-ts': minor
---

Link each emitted type to the spec entry it comes from: parameter groups to their `parameters` list, status types to their response, body types to the request body, and extracted enums to their property. Editor tools such as `openapi-import` use it for go to definition.
