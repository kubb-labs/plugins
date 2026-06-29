---
"@kubb/plugin-zod": patch
---

Emit strict-typecheck-clean Zod for several real-world spec edge cases:

- **Recursive schemas** now annotate the export with `z.ZodType` (e.g. `export const xSchema: z.ZodType = …`). A self-referential initializer (a `z.lazy(() => xSchema)` back to the same const) was implicitly `any` under `strict` (`TS7022`/`TS7024`).
- **`null` defaults** are dropped instead of emitting a bare `.default()` (`TS2554` "Expected 1 arguments, but got 0"). A `null` default is invalid on a non-nullable schema and redundant on a nullish one.
- **Enum defaults that don't match the member type** (e.g. `default: '1'` on a numeric enum `1 | 3`) are coerced to the matching member's typed literal, or dropped when no member matches (`TS2769`).
- **`z.discriminatedUnion` with a non-discriminable member** — including a `$ref` whose target is an `allOf` (a `ZodIntersection`) — now falls back to `z.union` (`TS2322`). The previous guard only caught inline intersection members.
- **`.strict()` is no longer appended** to a `oneOf` member that resolves to a cyclic schema (now `z.ZodType`) or to a nullable/optional schema (`ZodNullable`/`ZodOptional`), neither of which exposes `.strict()` (`TS2339`).
