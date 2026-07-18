---
'@kubb/plugin-react-query': patch
---

Give each of the five hook generators (`query`, `suspenseQuery`, `infiniteQuery`, `suspenseInfiniteQuery`, `mutation`) a `match` predicate instead of classifying and bailing out inside `operation()`. This replaces the `createOperationDispatcher` workaround from #728 now that `@kubb/core`'s `Generator` supports `match` natively: the core driver skips a non-matching generator before calling it, so `plugin.ts` goes back to registering the five generators directly. Generated output is unchanged.

Requires a `kubb` release that includes the `match` predicate on `Generator` (kubb-labs/kubb#3828). Not mergeable until that ships and the `kubb` catalog version here is bumped.
