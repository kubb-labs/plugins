---
'@kubb/plugin-cypress': patch
'@kubb/plugin-msw': patch
'@kubb/plugin-mcp': patch
'@kubb/plugin-react-query': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-swr': patch
---

These plugins import plugin-ts and plugin-faker types through `File.Import` with `plugin`, so Kubb finds the file those plugins wrote. They no longer read the other plugin's `output` and `group` to rebuild its path. A type the other plugin did not generate, for example because its `exclude` drops the operation, now fails the build with `KUBB_SYMBOL_NOT_FOUND` instead of writing an import of a missing file. Generated code is unchanged.
