---
"@kubb/plugin-client": major
"@kubb/plugin-cypress": major
"@kubb/plugin-faker": major
"@kubb/plugin-mcp": major
"@kubb/plugin-msw": major
"@kubb/plugin-react-query": major
"@kubb/plugin-swr": major
"@kubb/plugin-ts": major
"@kubb/plugin-vue-query": major
"@kubb/plugin-zod": major
---

Adopt the explicit `output.mode` option from `@kubb/core`.

Kubb no longer infers a single file from an `output.path` ending in `.ts`. Set `output.mode: 'file'` to write everything into one file, `output.mode: 'group'` to write one file per group (which requires the `group` option), or leave it as the default `output.mode: 'directory'` for one file per operation or schema. A config that used a file-style `output.path` (e.g. `path: 'models.ts'`) now needs `output.mode: 'file'` to keep that layout.

Each plugin's `Options` type now uses the `OutputOptions` union, so `output.mode: 'group'` statically requires the `group` option. The generators no longer gate imports on `ctx.getMode`, since `@kubb/ast` strips self-imports for the consolidated modes.
