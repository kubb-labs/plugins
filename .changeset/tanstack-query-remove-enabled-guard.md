---
"@kubb/plugin-react-query": patch
"@kubb/plugin-vue-query": patch
---

Stop generating an automatic `enabled` guard in query and infinite-query options.

`<op>QueryOptions` and `<op>InfiniteQueryOptions` previously derived an `enabled`
check from the required path and query parameters (`enabled: !!petId` in React
Query, `enabled: () => !!toValue(petId)` in Vue Query). Those parameters stayed
required in the generated type, so callers could never pass `undefined` to reach
the disabled state — the guard contradicted the signature (kubb-labs/plugins#60).

The generated options now contain only `queryKey` and `queryFn`, and parameters
remain required. To defer a query until a value is ready, pass `enabled` through
the hook's `query` options, which the hook spreads into `useQuery`:

```ts
useGetPetById({ petId }, { query: { enabled: !!petId } })
```
