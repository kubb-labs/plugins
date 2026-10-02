---
'@kubb/plugin-axios': patch
---

Interceptors registered through `client.interceptors` now follow a transport set later with `client.setConfig({ transport })`. They were registered on the Axios instance the client started with, while requests went through the new transport, so they silently never ran. Their ids stay valid for `eject` and `update`, and clearing `transport` moves them back to the client's original instance.

```typescript
client.interceptors.request.use(addAuthHeader)
client.setConfig({ transport: sharedAxiosInstance }) // addAuthHeader now runs on sharedAxiosInstance
```

A per-call `transport` still bypasses them, since the interceptors live on the client's own instance.
