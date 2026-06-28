---
"@kubb/plugin-faker": patch
"@kubb/plugin-msw": patch
---

Drop `any` from generated output. Faker mocks type `arrayElement` element values from the schema (inferring literals for plain enums, the precise property type when nested) and emit a cyclic self-reference as `undefined as unknown as <Type>` instead of `undefined as any`. MSW handlers omit the response-body generic so it falls back to msw's `DefaultBodyType` instead of `any`. Runtime behavior is unchanged.
