---
'@kubb/plugin-ts': patch
'@kubb/plugin-redoc': patch
---

`@kubb/plugin-ts` now lists `@kubb/parser-ts`, and `@kubb/plugin-redoc` lists `@kubb/adapter-oas`, as peer dependencies instead of dependencies. The plugin uses the copy that your `kubb` install brings, so a project that pins `kubb` no longer gets a newer parser with a second `@kubb/core` next to it. `kubb` already depends on both packages, so you don't need to install anything new.
