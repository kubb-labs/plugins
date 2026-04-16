---
"@kubb/plugin-ts": major
---

**Breaking:** Remove deprecated options. Use `adapterOas(...)` instead:

| Removed | Replacement |
|---|---|
| `enumSuffix` | `adapterOas({ enumSuffix })` |
| `dateType` | `adapterOas({ dateType })` |
| `integerType` | `adapterOas({ integerType })` |
| `unknownType` | `adapterOas({ unknownType })` |
| `emptySchemaType` | `adapterOas({ emptySchemaType })` |
