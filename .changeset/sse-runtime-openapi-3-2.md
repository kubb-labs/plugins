---
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
'@kubb/plugin-client': minor
---

Type server-sent events by name from OpenAPI 3.2 `itemSchema` and validate them one by one.

- Import `ServerSentEvent` and `toEventStream` from the new `.kubb/sse.ts` instead of `.kubb/client.ts`.
- Narrow `event.data` with `switch (event.event)` when the `itemSchema` names each event.
- Validate each event with `validator: 'zod'`, map it first with `transform`, and end the stream on a sentinel with `terminator`.
- Read `lastEventId` on the result to resume a dropped stream with a `Last-Event-ID` header on a new call.
- Export `TypedEvent` from a custom `@kubb/plugin-client` module.

```ts
const { stream } = await streamChat({ body, terminator: '[DONE]' })

for await (const event of stream) {
  if (event.event === 'message_delta') render(event.data)
}
```
