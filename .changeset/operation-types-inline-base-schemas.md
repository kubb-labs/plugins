---
"@kubb/plugin-ts": minor
"@kubb/plugin-client": minor
"@kubb/plugin-react-query": minor
"@kubb/plugin-vue-query": minor
---

Add an `operationTypes` option to reference base schema types directly instead of the per-operation alias layer, addressing kubb-labs/plugins#16.

With `operationTypes: false`, a request body or response backed by a single `$ref` resolves to the referenced component type (e.g. `Pet`) instead of the `AddPetData` / `AddPetStatus200` alias. Inline, array, and union schemas keep their per-operation alias because no single base type exists.

- **`@kubb/plugin-ts`** stops emitting redundant `$ref`-backed aliases and references the base component inside `XxxResponses` / `XxxResponse`.
- **`@kubb/plugin-client`**, **`@kubb/plugin-react-query`**, and **`@kubb/plugin-vue-query`** thread the option through their generated function/hook signatures, so a client function reads `addPet(data?: Pet): Promise<Pet>` instead of the alias chain.

The default (`true`) keeps the current output unchanged. Set the same value on every plugin that references operation types so the generated names stay consistent.
