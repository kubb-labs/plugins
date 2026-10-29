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

Plugins no longer need the `kubb` package. They import `@kubb/kit` and `@kubb/renderer-jsx` directly and list them as dependencies instead of a peer on `kubb`. A project that runs Kubb from code with `createKubb` from `@kubb/core` no longer installs the CLI, MCP server, Studio, and bundler integrations that `kubb` brings. This works with npm, pnpm, Yarn (including Plug'n'Play), and Bun without extra installs. If you use the `kubb` CLI, nothing changes.

`@kubb/plugin-ts` no longer installs `@kubb/parser-ts`. It is now an optional peer dependency, needed only when a `printer.nodes` handler returns a TypeScript compiler node, which is deprecated. If that happens and `@kubb/parser-ts` is missing, the build fails with `KUBB_MISSING_DEPENDENCY` and tells you to run `npm i -D @kubb/parser-ts`. Return a string from the handler instead to avoid the dependency.

`@kubb/plugin-redoc` lists `@kubb/adapter-oas` as a peer dependency instead of a dependency, so it uses your project's copy.

A project that pins an older Kubb version keeps one `@kubb/core` with npm and Bun. With pnpm or Yarn, pin `@kubb/kit` and `@kubb/renderer-jsx` to your Kubb version in `overrides` or `resolutions` to get the same.
