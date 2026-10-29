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

`@kubb/plugin-ts` no longer installs `@kubb/parser-ts`. It is now an optional peer dependency, needed only when a `printer.nodes` handler returns a TypeScript compiler node, which is deprecated. If that happens and `@kubb/parser-ts` is missing, the build fails with `KUBB_MISSING_DEPENDENCY` and tells you to run `npm i -D @kubb/parser-ts`. Return a string from the handler instead to avoid the dependency.

`@kubb/plugin-redoc` lists `@kubb/adapter-oas` as a peer dependency instead of a dependency, so it uses your project's copy. A project that pins its Kubb version no longer gets a second `@kubb/core` through these plugins.
