---
'@kubb/plugin-client': minor
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
'@kubb/plugin-react-query': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-swr': patch
---

Stream a JSON Lines response, such as `application/jsonl`, `application/x-ndjson`, or `application/json-seq`, one parsed item per line.

- An operation whose only success content type is a JSON sequence now returns `StreamResult` typed with one item per line, as a `text/event-stream` operation returns its events. It used to wait for the whole body and return it as one string typed as a single item.
- The call asks for the declared media type in `Accept`, and `validator: 'zod'` checks each line.
- `.kubb/sse.ts` adds `parseJsonLines`, and `toEventStream` reads JSON Lines with `shape: 'line'`.
- React Query, Vue Query, and SWR skip hooks for these operations, as they do for event streams.

```ts
for await (const entry of await streamLogs()) {
  console.info(entry.message) // LogEntry
}
```
