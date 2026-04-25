---
"@kubb/plugin-faker": patch
---

Improve faker function code generation with cleaner type signatures and better structure.

**Changes:**
- Refactor generated faker functions to use explicit `defaultFakeData` variable for clarity
- Simplify return types to `Required<T>` (removes unnecessary generic type tracking)
- Function signature: `export function fake(data?: Partial<T>): Required<T>`
- Use spread operator pattern: `{ ...defaultFakeData, ...(data || {}) } as Required<T>`

**Benefits:**
- Cleaner, more readable generated code
- Explicit separation of defaults and overrides
- Type-safe: `Required<T>` guarantees all properties are present and non-optional
- Resolves type assignability issues when faker functions are used in contexts expecting `T`
- No API changes - still supports optional overrides
