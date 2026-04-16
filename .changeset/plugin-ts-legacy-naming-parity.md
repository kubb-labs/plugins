---
"@kubb/plugin-ts": minor
---

When `legacy: true`, the type generator now fully matches v4 output:

- Grouped parameter types: `<OperationId>PathParams`, `<OperationId>QueryParams`, `<OperationId>HeaderParams`
- No `<OperationId>RequestConfig` type emitted
- Wrapper types use `{ Response, Request?, QueryParams?, Errors }` shape
- Response union contains only the 2xx type
- Inline enum values are extracted as named declarations

Six `@deprecated` resolver methods added for grouped parameter naming. Implemented only in `resolverTsLegacy`; will be removed in v6.
