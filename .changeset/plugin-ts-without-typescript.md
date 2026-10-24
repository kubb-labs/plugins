---
'@kubb/plugin-ts': minor
---

Print TypeScript types with [`yuku-codegen`](https://www.npmjs.com/package/yuku-codegen) instead of the TypeScript compiler, so `@kubb/plugin-ts` no longer depends on `@typescript/typescript6` and runs in edge runtimes such as Cloudflare Workers. Generation is about 30% faster and uses about 40 MB less memory. The types are the same; unformatted output now uses two-space indentation and single quotes.

`printer.nodes` handlers now return the type as a string, such as `date() { return 'Date' }`, and `this.transform` returns strings. A handler can still return a TypeScript compiler node when your project installs `typescript` 5 or 6, or `@typescript/typescript6` next to TypeScript 7. Both are optional peer dependencies. That form is deprecated and is removed in the next major.

`@kubb/plugin-ts` no longer has a `typescript` peer dependency, so installing it no longer pulls in the TypeScript 7 compiler (about 30 MB).
