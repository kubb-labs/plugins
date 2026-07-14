---
"@kubb/plugin-cypress": patch
"@kubb/plugin-msw": patch
---

Consume the `Url` path-template helper from `kubb/kit` instead of a locally duplicated copy in `@internals/utils`, now that kubb core exposes `Url.toSafeTemplate` and `Url.toGroupedTemplateString` alongside its existing `toPath`/`toTemplateString`/`toObject`. Requires `kubb`/`@kubb/kit` 5.0.0-beta.98 or later.
