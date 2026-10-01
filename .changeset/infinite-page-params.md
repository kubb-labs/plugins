---
'@kubb/plugin-react-query': minor
'@kubb/plugin-vue-query': minor
---

Make infinite query page params configurable and fix the default previous page.

- `infinite.getNextPageParam` and `infinite.getPreviousPageParam` take the source of TanStack Query's functions, inlined verbatim, for pages whose next param has to be computed (for example `(lastPage) => (lastPage.hasNext ? lastPage.number + 1 : undefined)`). They take precedence over `nextParam`, `previousParam` and `cursorParam`.
- `infinite.match` narrows which operations get infinite hooks, on top of having the `queryParam`.
- The default `getPreviousPageParam` compares against `initialPageParam` instead of `1`, so page 1 of a 0-based API has a previous page.
- Generation warns when an operation falls back to the default page params with a response that isn't an array. Those params only stop on an empty array, so `hasNextPage` never turned false for such a response.
