---
"@kubb/plugin-axios": patch
"@kubb/plugin-client": patch
"@kubb/plugin-cypress": patch
"@kubb/plugin-faker": patch
"@kubb/plugin-fetch": patch
"@kubb/plugin-ky": patch
"@kubb/plugin-mcp": patch
"@kubb/plugin-msw": patch
"@kubb/plugin-react-query": patch
"@kubb/plugin-redoc": patch
"@kubb/plugin-swr": patch
"@kubb/plugin-ts": patch
"@kubb/plugin-valibot": patch
"@kubb/plugin-vue-query": patch
"@kubb/plugin-zod": patch
---

Remove stale package metadata: `typesVersions` entries for files that are not built, a `files` entry for a folder that does not exist, and unused dependencies. `@kubb/*` dependencies now read their range from the workspace catalog. The published range is unchanged.
