---
"@kubb/plugin-ts": patch
---

Fix missing grouped `<OperationId>QueryParams` type in v5 mode. Operations with query parameters now emit both individual parameter types and a grouped type.

```ts
// Before — only individual param types
export type ListPetsQueryLimit = number

// After — grouped type added
export type ListPetsQueryLimit = number
export type ListPetsQueryParams = { limit?: ListPetsQueryLimit }
```
