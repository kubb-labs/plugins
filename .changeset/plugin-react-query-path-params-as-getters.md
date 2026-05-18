---
"@kubb/plugin-react-query": minor
---

Add opt-in `pathParamsAsGetters: boolean` option for `pluginReactQuery`. When enabled, generated `useQuery` hooks accept path params as either the value or a zero-arg getter (`petId | (() => petId) | undefined`), and the hook body unwraps the getter once via `typeof v === 'function' ? v() : v` before forwarding to `queryKey(...)` and `queryOptions(...)`.

Useful for reactive frameworks where reading a value at hook-call time captures only the initial snapshot — Svelte 5 `$state` (which warns with `state_referenced_locally`), Solid signals, MobX observables, Preact signals, and similar.

Defaults to `false`. Generated output is byte-identical to prior releases when the option is omitted. Scope is limited to the `useQuery` hook; suspense, infinite, and mutation hooks are unchanged.
