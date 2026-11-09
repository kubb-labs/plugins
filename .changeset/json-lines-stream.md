---
'@kubb/plugin-client': minor
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
'@kubb/plugin-react-query': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-swr': patch
---

Stream a JSON Lines response, such as `application/jsonl`, `application/x-ndjson`, or `application/json-seq`, one parsed item per line.

- An operation whose only success content type is JSON Lines returns `StreamResult` with one item per line, like a `text/event-stream` operation. It used to return the whole body as one string.
- The call sends the media type in `Accept`, and `validator: 'zod'` checks each line.
- `.kubb/sse.ts` adds `parseJsonLines`, and a custom client's `toEventStream` gets `{ shape: 'line' }`. An `application/json-seq` record must fit on one line.
- React Query, Vue Query, and SWR skip hooks for these operations, as they do for event streams.

```ts
for await (const entry of await streamLogs()) {
  console.info(entry.message) // LogEntry
}
```
