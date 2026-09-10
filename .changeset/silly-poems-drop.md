---
'@kubb/plugin-faker': patch
---

`create<Operation>Response` now typechecks when a status or content-type variant has an inline object schema. The generated union helper calls each status factory with its explicit `<object>` type argument, so the response return type no longer infers `TData` as `Partial<T>` and drops required properties (TS2322).
