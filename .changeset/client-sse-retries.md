---
'@kubb/plugin-client': minor
---

Add opt-in `retry` configuration shared by HTTP calls and SSE connections.

- Set `retry` on the client or override it per call, including `false` to disable it.
- Resume failed SSE reads with `Last-Event-ID` and honor server `retry:` delays within the same retry budget.
- Respect `Retry-After`, cancellation, and request replay safeguards.

```ts
client.setConfig({ retry: { limit: 3, delay: (count) => 300 * 2 ** (count - 1) } })
const events = await client.stream({ url: '/events', retry: { limit: 1 } })
```
