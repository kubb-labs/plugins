---
"@kubb/plugin-ts": minor
"@kubb/plugin-client": minor
"@kubb/plugin-react-query": minor
"@kubb/plugin-vue-query": minor
"@kubb/plugin-faker": minor
"@kubb/plugin-msw": minor
"@kubb/plugin-cypress": minor
"@kubb/plugin-mcp": minor
---

Default `@kubb/plugin-ts`'s `operationTypes` option to `false`, so generated output references base schema types directly instead of a per-operation alias layer.

A request body or response backed by a single `$ref` now resolves to the referenced component type (for example `Pet`) instead of emitting `AddPetData` / `AddPetStatus200`. Inline, array, union, multiple-content-type, and key-omitting (`Omit<…>`) schemas keep their per-operation alias because no single base type exists. The `XxxResponses` / `XxxResponse` aggregates are still emitted (now referencing the base components).

Consumer plugins (`@kubb/plugin-client`, `@kubb/plugin-react-query`, `@kubb/plugin-vue-query`, `@kubb/plugin-faker`, `@kubb/plugin-msw`, `@kubb/plugin-cypress`, `@kubb/plugin-mcp`) inherit this through the TypeScript resolver and resolve the inlined component imports from their own files.

Set `operationTypes: true` on `@kubb/plugin-ts` to restore the previous alias output.
