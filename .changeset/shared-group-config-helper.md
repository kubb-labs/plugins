---
"@kubb/plugin-ts": patch
"@kubb/plugin-zod": patch
"@kubb/plugin-faker": patch
"@kubb/plugin-client": patch
"@kubb/plugin-react-query": patch
"@kubb/plugin-vue-query": patch
"@kubb/plugin-msw": patch
"@kubb/plugin-cypress": patch
"@kubb/plugin-mcp": patch
---

Replace the per-plugin `group` naming block (duplicated verbatim across nine plugins) with a shared `createGroupConfig` helper from `@internals/shared`. Each plugin's grouping behavior is preserved exactly — the `Controller`/`Requests` suffix and whether a user-provided `group.name` is honored are passed as options — so generated output is unchanged. Internal refactor only.
