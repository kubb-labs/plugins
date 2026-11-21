---
'@kubb/plugin-client': patch
'@kubb/plugin-msw': patch
'@kubb/plugin-react-query': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-swr': patch
---

Files that hold many operations, such as msw `handlers.ts` and the SDK classes, get their path, banner and footer from one shared helper instead of building them by hand. TanStack hook files take theirs from `ctx.file(node, { name })`. Generated output is unchanged.
