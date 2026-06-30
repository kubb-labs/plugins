---
---

Internal refactor with no release. The `maybeRefOrGetter` (vue-query) and `maybeValueOrGetter` (react-query) request-param type wrappers now live in the shared `@internals/tanstack-query` package, so the value-or-getter concept has one home. A doc comment there records why the unwrap strategy stays per plugin. Vue resolves lazily through `toValue` because its query keys are reactive. React resolves once at the hook boundary because React Query hashes keys. Both plugins re-export the wrappers and the generated output stays byte-identical.
