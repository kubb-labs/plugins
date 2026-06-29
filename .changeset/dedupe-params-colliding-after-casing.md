---
"@kubb/plugin-ts": patch
---

De-duplicate operation parameters that collapse to the same property name after casing. Some specs declare the same parameter twice under different casings (for example AWS S3 lists both `max-uploads` and `MaxUploads`), which Kubb camelCased to a single property and then emitted twice, producing an object type with a duplicate member that TypeScript rejects (`TS2300`). Parameters are now de-duplicated by their camelCased identity per location, keeping the first occurrence.
