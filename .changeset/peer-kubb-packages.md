---
'@kubb/plugin-axios': minor
'@kubb/plugin-client': minor
'@kubb/plugin-cypress': minor
'@kubb/plugin-faker': minor
'@kubb/plugin-fetch': minor
'@kubb/plugin-mcp': minor
'@kubb/plugin-msw': minor
'@kubb/plugin-react-query': minor
'@kubb/plugin-redoc': minor
'@kubb/plugin-swr': minor
'@kubb/plugin-ts': minor
'@kubb/plugin-vue-query': minor
'@kubb/plugin-zod': minor
---

Plugins no longer need the `kubb` package. They import `@kubb/kit` and `@kubb/renderer-jsx` directly and list them as peer dependencies instead of `kubb`. A project that runs Kubb from code with `createKubb` from `@kubb/core` can now skip the CLI, MCP server, Studio, and bundler integrations that `kubb` installs. If you use the `kubb` CLI, nothing changes: `kubb` already depends on both packages.

`@kubb/plugin-ts` also lists `@kubb/parser-ts`, and `@kubb/plugin-redoc` lists `@kubb/adapter-oas`, as peer dependencies instead of dependencies. The plugin then uses your project's copy, so a project that pins its Kubb version no longer gets a newer parser with a second `@kubb/core` next to it.
