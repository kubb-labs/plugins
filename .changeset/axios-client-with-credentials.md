---
'@kubb/plugin-axios': patch
---

Add a top-level `withCredentials` to the client config and to each request. A client-level value now reaches every call, and a per-call value overrides it. `options.withCredentials` still works when neither is set.

```typescript
const client = createClient({ withCredentials: true })
await client({ method: 'GET', url: '/pet', withCredentials: false }) // this call omits credentials
```
