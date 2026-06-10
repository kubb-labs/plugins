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

Replace the per-plugin `group` naming block (duplicated verbatim across nine plugins) with a shared `createGroupConfig` helper from `@internals/shared`. A user-provided `group.name` is still honored across every plugin. The default folder name is covered by the separate group-folder changeset.
