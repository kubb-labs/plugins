---
"@kubb/plugin-zod": major
---

Remove the `operations` option.

`plugin-zod` no longer emits an `operations.ts` file with the `operations` and `paths` maps. The option was niche and added surface area that few projects relied on.

If you still need that file, add a small custom Kubb plugin that reproduces it. The [Zod migration guide](https://kubb.dev/docs/5.x/migration-guide/plugin-zod) carries a complete, copy-pasteable example built on the public `definePlugin` and `defineGenerator` API.
