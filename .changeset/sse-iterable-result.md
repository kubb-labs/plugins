---
'@kubb/plugin-client': minor
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
---

Iterate a stream call's result directly. `EventStreamResult` is now an `AsyncIterable` of its events, so `for await (const event of await streamChat(...))` works, and TanStack Query's `experimental_streamedQuery` takes the generated call as its `streamFn` without `.stream`. The `stream` property stays and yields the same events.
