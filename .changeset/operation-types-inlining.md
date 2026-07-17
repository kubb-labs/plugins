---
"@kubb/plugin-react-query": minor
"@kubb/plugin-vue-query": minor
"@kubb/plugin-cypress": minor
"@kubb/plugin-faker": minor
"@kubb/plugin-ts": minor
"@kubb/plugin-msw": minor
"@kubb/plugin-swr": minor
---

Add an `operationTypes` option to `@kubb/plugin-ts` (default `true`). With `operationTypes: false`, a request body or response backed by a single `$ref` references the base component type (for example `Pet`) instead of the per-operation `AddPetData` / `AddPetStatus200` alias, and those aliases are no longer emitted.

The option is carried by the plugin-ts resolver, so every consumer that reads it (the client plugins, react-query, vue-query, swr, faker, msw, cypress) inherits the inlining and imports each base component from its own file. Inline, array, union, multiple-content-type, and `Omit`-based schemas keep their per-operation alias, since no single base type exists.

Default (`true`) output is unchanged. Resolves #16.
