---
"@kubb/plugin-axios": patch
"@kubb/plugin-cypress": patch
"@kubb/plugin-faker": patch
"@kubb/plugin-fetch": patch
"@kubb/plugin-mcp": patch
"@kubb/plugin-msw": patch
"@kubb/plugin-react-query": patch
"@kubb/plugin-swr": patch
"@kubb/plugin-ts": patch
"@kubb/plugin-vue-query": patch
"@kubb/plugin-zod": patch
---

Update to `@kubb/core` 5.0.0-beta.89 and adopt its single-options resolver API.

`resolver.file` and `resolver.default.file`/`default.path` take one options object now, so calls pass `{ ...params, root, output, group }` instead of a second `context` argument. The `plugin-faker`, `plugin-ts`, and `plugin-zod` resolvers build file names through `file: { baseName }` in place of the removed `resolveName` hook, which restores the caser-based file names (a faker mock lands in `createPetFaker.ts`).
