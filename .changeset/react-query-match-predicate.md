---
'@kubb/plugin-react-query': patch
---

Give each of the five hook generators (`query`, `suspenseQuery`, `infiniteQuery`, `suspenseInfiniteQuery`, `mutation`) a `match` predicate instead of classifying and bailing out inside `operation()`. This replaces the `createOperationDispatcher` workaround from #728, now that `@kubb/core`'s `Generator` supports `match` natively. Generated output is unchanged.

Requires the `kubb` release with `match` support (kubb-labs/kubb#3828). Not mergeable until that ships and the `kubb` catalog version here is bumped.
