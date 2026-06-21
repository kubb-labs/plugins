---
"@kubb/plugin-ts": patch
"@kubb/plugin-zod": patch
"@kubb/plugin-faker": patch
"@kubb/plugin-msw": patch
"@kubb/plugin-react-query": patch
"@kubb/plugin-vue-query": patch
"@kubb/plugin-swr": patch
"@kubb/plugin-cypress": patch
"@kubb/plugin-mcp": patch
"@kubb/plugin-redoc": patch
---

Drop the `'group'` value from the documented `output.mode` option. `output.mode` now accepts `'directory' | 'file'`, and the `group` option organizes `'directory'` output into per-tag or per-path subdirectories. This tracks the removal of the per-group consolidation mode in `@kubb/core`.
