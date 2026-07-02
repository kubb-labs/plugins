---
"@kubb/plugin-zod": minor
---

Remove the `typed` option. It has been a silent no-op since the v5 rewrite: the generator never read it or emitted a `ToZod` annotation, and output with `typed: true` was identical to output without it. Use `inferred: true` to export a `z.infer` type alias next to each schema.

Migration: delete `typed` from your `pluginZod` options.
