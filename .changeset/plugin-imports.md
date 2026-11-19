---
'@kubb/plugin-ts': patch
'@kubb/plugin-zod': patch
'@kubb/plugin-valibot': patch
'@kubb/plugin-faker': patch
'@kubb/plugin-client': patch
'@kubb/plugin-cypress': patch
'@kubb/plugin-msw': patch
'@kubb/plugin-mcp': patch
'@kubb/plugin-react-query': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-swr': patch
---

Generated files import each other's declarations through `File.Import` with `plugin`, so Kubb finds the file the emitting plugin wrote. This covers `$ref` schemas, types from plugin-ts and plugin-zod, validator schemas, faker factories, client functions, MSW handlers, MCP handlers, SDK classes and hook options. The plugins no longer read another plugin's `output` and `group` to rebuild its paths.

A declaration the other plugin did not generate, for example because its `exclude` drops the operation, now fails the build with `KUBB_SYMBOL_NOT_FOUND` instead of writing an import of a missing file. Generated code is unchanged otherwise. The client runtime (`.kubb/client.ts`), a custom `importPath` module, and plugin-faker's inline `import('…')` type reference keep their paths.
