---
"@kubb/plugin-ts": patch
---

Load `typescript` with `require` instead of `import`. When ESM code imports a CommonJS package, Node keeps a second copy of its source, and for TypeScript that copy is about 9 MB. Together with the same change in `@kubb/parser-ts`, this lowers heap by about 9 MB and RSS by about 25 MB when `plugin-ts` is loaded.
