---
"@kubb/plugin-client": patch
---

`pluginClient` no longer writes a `.kubb/client.ts` when an `importPath` is set. Any `importPath` — a relative module or a package such as `@kubb/plugin-client/clients/axios` — now makes the generated code import the client from that module, and the bundled client file is only emitted when no `importPath` is given. Previously a non-relative `importPath` still produced a `.kubb/client.ts` re-export.
