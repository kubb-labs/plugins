---
'@kubb/plugin-fetch': minor
'@kubb/plugin-axios': minor
'@kubb/plugin-client': minor
---

Type server-sent events by name from OpenAPI 3.2 `itemSchema`, validate them one by one, and reconnect with `Last-Event-ID`.

- Import `ServerSentEvent` and `toEventStream` from the new `.kubb/sse.ts` instead of `.kubb/client.ts`.
- Narrow `event.data` with `switch (event.event)` when the `itemSchema` names each event. Undeclared events go to `onUnknownEvent`.
- Validate each event with `validator: 'zod'`, map it first with `transform`, and end the stream on a sentinel with `terminator`.
- Resume a dropped stream with `reconnect`. `resume` is required for any method but GET, and the result exposes `lastEventId`.
- Export `TypedEvent` from a custom `@kubb/plugin-client` module.

```ts
const { stream } = await streamChat({ body, terminator: '[DONE]', reconnect: { resume: () => ({ method: 'GET' }) } })

for await (const event of stream) {
  if (event.event === 'message_delta') render(event.data)
}
```
