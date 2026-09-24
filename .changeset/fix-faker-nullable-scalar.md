---
"@kubb/plugin-faker": patch
---

Keep `nullable` on a scalar schema. A nullable scalar inlines its primitive rather than naming the generated type, so the factory declared `(data?: string): string` for a schema the type plugin emitted as `string | null`. The factory could not express or return a null fixture, and an MSW handler generated with `parser: 'faker'` failed to compile because it passes its own `T | null` straight into it. The signature now carries the nullability, and a nullable factory returns an explicitly supplied `null` instead of treating it as "not provided".
