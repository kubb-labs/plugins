---
'@kubb/plugin-react-query': minor
'@kubb/plugin-vue-query': minor
---

Make infinite query page params configurable and fix the default previous page.

- `infinite.getNextPageParam` and `infinite.getPreviousPageParam` take either a function expression string or a typed function (including via the new `definePageParam` helper) for pages whose next param has to be computed (for example `definePageParam((lastPage) => (lastPage.hasNext ? lastPage.number + 1 : undefined))`). They take precedence over `nextParam`, `previousParam` and `cursorParam`.
- `getPreviousPageParam` compares against `initialPageParam` when explicitly configured (e.g. `initialPageParam: 0` compares `<= 0`), while preserving the legacy `<= 1` threshold when omitted for backward compatibility.
- Generation warns when an operation falls back to the default page params with a response that isn't an array. Those params only stop on an empty array, so `hasNextPage` never turned false for such a response.
