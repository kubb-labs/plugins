---
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
---

Parse server-sent events in linear time and cap how large one event may grow before its terminating blank line.

- Add a per-call `maxEventSize` option, defaulting to 16,777,216 characters. A larger event throws a `RangeError` and cancels the stream.
- Pass `Infinity` to turn the limit off.

```ts
const { stream } = await streamEvents({ maxEventSize: 64 * 1024 * 1024 })
```
