---
'@kubb/plugin-react-query': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-swr': patch
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
'@kubb/plugin-redoc': patch
---

`@kubb/plugin-react-query`: the `customOptions` starter file imports `HookOptions` from the generated `HookOptions.ts` file, so it no longer needs a root barrel.

`@kubb/plugin-fetch` and `@kubb/plugin-axios`: `returnType: 'plain'` is no longer accepted or offered, because it generated code that did not typecheck. It stays available on `@kubb/plugin-client`.

`kubb-extension.json` now matches the code: `query.methods` defaults to `GET` and `QUERY`, `client` offers `client`, `@kubb/plugin-ts` is an optional dependency, `@kubb/plugin-client` lists `returnType`, and `@kubb/plugin-redoc` no longer lists `banner` and `footer`.
