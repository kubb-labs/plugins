---
'@kubb/plugin-client': patch
'@kubb/plugin-fetch': patch
'@kubb/plugin-axios': patch
---

Let an error interceptor return another error, such as a domain error, without a type cast.

- `client.interceptors.error` handlers may return the `ResponseError`, another `Error` that the call throws, or nothing to keep the error.
- A handler that returns another error ends the chain, so every handler still receives a `ResponseError`.
- A handler that returns nothing no longer hands `undefined` to the next handler.

```typescript
class NotFoundError extends Error {}

client.interceptors.error.use((error) => (error.status === 404 ? new NotFoundError(error.message) : error))
```
