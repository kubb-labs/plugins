---
"@kubb/plugin-ts": minor
"@kubb/plugin-client": minor
"@kubb/plugin-react-query": minor
"@kubb/plugin-vue-query": minor
---

Add an `operationTypes` option to `@kubb/plugin-ts` to reference base schema types directly instead of the per-operation alias layer, addressing kubb-labs/plugins#16.

With `operationTypes: false`, a request body or response backed by a single `$ref` resolves to the referenced component type (e.g. `Pet`) instead of the `AddPetData` / `AddPetStatus200` alias. Inline, array, and union schemas keep their per-operation alias because no single base type exists.

The option lives on `@kubb/plugin-ts` only. It makes the TypeScript resolver inline `$ref`-backed names, and consumer plugins (`@kubb/plugin-client`, `@kubb/plugin-react-query`, `@kubb/plugin-vue-query`) read that resolver through the plugin driver — so they inherit the inlining automatically, with no per-plugin flag to keep in sync. A generated client function reads `addPet(data?: Pet): Promise<Pet>` instead of the alias chain.

The default (`true`) keeps the current output unchanged.
