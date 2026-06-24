---
"@kubb/plugin-react-query": minor
"@kubb/plugin-vue-query": minor
"@kubb/plugin-cypress": minor
"@kubb/plugin-faker": minor
"@kubb/plugin-swr": minor
"@kubb/plugin-msw": minor
"@kubb/plugin-ts": minor
---

Inline per-operation TypeScript types that are backed by a single `$ref` instead of emitting a redundant alias that only points at another type (kubb-labs/plugins#16).

When a request body or a response status resolves to a single component `$ref`, `@kubb/plugin-ts` no longer emits the `<op>Data` / `<op>Status<code>` alias. When the whole response union collapses to a single `$ref`, the `<op>Response` alias is dropped too. The remaining aggregate types reference the base component directly, and consumer plugins import that component from its own model file:

```ts
// Before
export type AddPetStatus200 = Pet
export type AddPetResponses = { '200': AddPetStatus200 }
export type AddPetResponse = AddPetStatus200

// After
export type AddPetResponses = { '200': Pet }
// (AddPetStatus200 and AddPetResponse are gone — consumers use `Pet` directly)
```

Inline, array, union, multi-content, and `Omit`-wrapped (read-only/write-only) schemas keep their per-operation alias, since they have no single base type to inline to. Because consumer plugins read the resolved names through the plugin driver, `@kubb/plugin-client`, `@kubb/plugin-react-query`, `@kubb/plugin-vue-query`, `@kubb/plugin-swr`, `@kubb/plugin-cypress`, `@kubb/plugin-msw`, and `@kubb/plugin-faker` all inherit the change. This is the default behavior — there is no option to configure.
