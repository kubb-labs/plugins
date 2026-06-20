---
"@kubb/plugin-react-query": patch
"@kubb/plugin-vue-query": patch
---

Require the spec-required params in generated query signatures and drop the auto `enabled` guard.

Query and infinite-query options used to emit an `enabled` guard derived from the required params (`enabled: !!path`) while keeping those params optional. The guard turned truthy as soon as a caller passed the params, so it never narrowed the types and never reached a state the caller could not already see in the signature.

The grouped `path`, `query`, and `headers` options are now required in the generated `queryKey`, `queryOptions`, and hook signatures whenever the operation marks them required, and no `enabled` guard is generated. The query key types only the groups it reads, so a required `headers` on the operation no longer forces it onto the key. Pass TanStack Query's own `enabled` (or `skipToken`) through the hook options for conditional and dependent queries.

```ts
// petId is required, so the call needs it up front
const { data } = useGetPetById({ path: { petId } })

// keep a query disabled until an input exists
useGetPetById({ path: { petId } }, { query: { enabled: !!petId } })
```
