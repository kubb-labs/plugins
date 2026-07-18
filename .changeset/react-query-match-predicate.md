---
'@kubb/plugin-react-query': patch
---

Give each of the five hook generators (`query`, `suspenseQuery`, `infiniteQuery`, `suspenseInfiniteQuery`, `mutation`) a `match` predicate instead of classifying and bailing out inside `operation()`. This replaces the `createOperationDispatcher` workaround from #728, now that `@kubb/core`'s `Generator` supports `match` natively (kubb-labs/kubb#3828, released in `kubb@5.0.0-beta.104`). Generated output is unchanged.
