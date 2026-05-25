---
"@kubb/plugin-react-query": patch
"@kubb/plugin-vue-query": patch
---

Make `enabled`-guarded params optional in generated query signatures (type-only).

Query and infinite-query options emit an `enabled` guard derived from the required
path/query params (`enabled: !!petId`), but those params stayed required in the
type, so callers could never pass `undefined` to reach the disabled state the guard
already implements (kubb-labs/plugins#60).

Those params are now optional in the generated `queryKey`, `queryOptions`, and hook
signatures, and the `queryFn` calls the client with a non-null assertion (`petId!`).
The `enabled` guard is unchanged, and since `?`/`!` are erased at compile time the
emitted runtime is identical — this is a type-only change. Suspense hooks (which
cannot be disabled) keep their params required.

```ts
// now type-checks; the query stays disabled until petId is defined
useGetPetById({ petId: route.params.petId })
```
