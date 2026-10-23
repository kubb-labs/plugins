---
'@kubb/plugin-ts': minor
---

Print TypeScript types as strings instead of building them with the TypeScript compiler, so `@kubb/plugin-ts` no longer depends on `@typescript/typescript6` and runs in edge runtimes such as Cloudflare Workers. The types are the same; unformatted output now uses two-space indentation, single quotes, and no semicolons.

`printer.nodes` handlers now return the type as a string, such as `date() { return 'Date' }`, and `this.transform` returns strings. A handler that returns a TypeScript compiler node still works but is deprecated and is removed in the next major.
